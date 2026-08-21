import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../../components/HeroSection';
import ScrollProgress from '../../components/ScrollProgress';
import Courses from './Courses';
import { useTheme } from '../../context/ThemeContext';

const LearnMain = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-x-clip font-sans antialiased text-[#00113b] dark:text-[#8fd9ff] ${
      isDarkMode 
        ? "dark bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" 
        : "light bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
    }`}>
      <ScrollProgress />
      <HeroSection />
      <ProgramCatalog isDarkMode={isDarkMode} />
      <Courses />
    </div>
  );
};

const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const base = raw.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
})();

function ProgramCatalog({ isDarkMode }) {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/programs/catalog`)
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) throw new Error(payload.message || 'Unable to load programs.');
        if (!cancelled) setPrograms(payload.programs || []);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message || 'Unable to load programs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => ({
    free: programs.filter((program) => program.accessType === 'free'),
    trainer: programs.filter((program) => program.accessType === 'trainer-led'),
  }), [programs]);

  const startFreeProgram = async (program) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signup', {
        state: {
          returnTo: `/learn/program/${program._id}`,
          freeProgramId: program._id,
        },
      });
      return;
    }

    setStartingId(program._id);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/programs/${program._id}/free-enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Unable to start this program.');
      navigate(`/learn/program/${program._id}`);
    } catch (error) {
      setMessage(error.message || 'Unable to start this program.');
    } finally {
      setStartingId(null);
    }
  };

  const joinWaitlist = (program) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signup', { state: { waitlistProgramId: program._id, waitlistProgramName: program.name } });
      return;
    }
    setStartingId(program._id);
    setMessage('');
    fetch(`${API_BASE}/programs/${program._id}/waitlist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) throw new Error(payload.message || 'Unable to join the waitlist.');
        setMessage(`You’re on the waitlist for ${program.name}.`);
      })
      .catch((error) => setMessage(error.message || 'Unable to join the waitlist.'))
      .finally(() => setStartingId(null));
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 lg:px-12">
      <div className="rounded-[2rem] border border-blue-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#061438]/70 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">LEARN</p>
            <h2 className="mt-2 text-2xl font-bold text-[#00113b] dark:text-white sm:text-3xl">Programs for every learning path</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Explore free self-paced programs and trainer-led programs in one place.</p>
          </div>
          <BookOpen className="text-blue-500" size={30} />
        </div>

        {loading ? <div className="flex min-h-28 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={18} /> Loading programs…</div> : null}
        {message ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">{message}</p> : null}

        {!loading && !programs.length ? <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Programs will appear here as soon as they are published.</p> : null}
        <ProgramGroup title="Free programs" description="Start learning immediately with an individual schedule." programs={groups.free} isDarkMode={isDarkMode} actionLabel="Start learning" onAction={startFreeProgram} loadingId={startingId} />
        <ProgramGroup title="Trainer-led programs" description="See upcoming cohorts and register your interest." programs={groups.trainer} isDarkMode={isDarkMode} actionLabel="Join waitlist" onAction={joinWaitlist} loadingId={startingId} />
      </div>
    </section>
  );
}

function ProgramGroup({ title, description, programs, actionLabel, onAction, loadingId }) {
  if (!programs.length) return null;
  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div><h3 className="text-lg font-bold text-[#00113b] dark:text-white">{title}</h3><p className="text-sm text-slate-500 dark:text-slate-400">{description}</p></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {programs.map((program) => (
          <article key={program._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div><span className="inline-flex rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">{program.programType}</span><h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{program.name}</h4></div>
              {program.pricingType === 'Free' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <Users className="text-amber-500" size={20} />}
            </div>
            <p className="mt-2 min-h-10 text-sm text-slate-600 dark:text-slate-300">{program.description || 'Structured learning with practical resources.'}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1"><Clock3 size={14} /> {program.duration || `${program.durationDays || 0} days`}</span><span>{program.courseCount || 0} courses</span><span>{program.roadmapCount || 0} roadmaps</span>{program.pricingType === 'Paid' && <span className="font-semibold text-slate-700 dark:text-slate-200">From ₹{Number(program.pricingPlans?.[0]?.price || program.programFee || 0).toLocaleString('en-IN')}</span>}</div>
            {(() => {
              const materialNames = [
                ...(program.courseIds || []).map((course) => course.title),
                ...(program.roadmapIds || []).map((roadmap) => roadmap.title),
                ...(program.projectIds || []).map((project) => project.title),
              ].filter(Boolean).slice(0, 3);
              return materialNames.length ? (
                <div className="mt-4 rounded-xl border border-blue-500/15 bg-blue-500/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500 dark:text-blue-300">Included materials</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{materialNames.join(' · ')}</p>
                </div>
              ) : null;
            })()}
            <button type="button" onClick={() => onAction(program)} disabled={loadingId === program._id} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loadingId === program._id ? <Loader2 className="animate-spin" size={16} /> : null}{actionLabel}<ArrowRight size={16} /></button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default LearnMain;
