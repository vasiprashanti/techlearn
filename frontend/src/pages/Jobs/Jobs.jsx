import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, MapPin, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import jobsAPI from "../../services/jobsApi";
import { useAuth } from "../../context/AuthContext";

const tabs = [
  { id: "all", label: "All Jobs" },
  { id: "for-you", label: "For You" },
];

const formatPostedDate = (value) => {
  if (!value) return "Recently posted";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently posted" : `Posted ${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
};

export default function Jobs() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = activeTab === "for-you" ? await jobsAPI.forYou() : await jobsAPI.list(search.trim());
        if (!cancelled) {
          setJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
          setMessage(payload.message || "");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load jobs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, search]);

  const visibleJobs = useMemo(() => jobs, [jobs]);

  return (
    <div className="min-h-screen px-5 pb-20 pt-28 text-[#00113b] dark:text-slate-100 md:px-10 lg:px-16">
      <main className="mx-auto w-full max-w-[1240px]">
        <header className="mb-8 max-w-2xl">
          <p className="font-press-start text-[9px] uppercase tracking-[0.16em] text-[#3c83f6] dark:text-[#8fd9ff]">HIRING</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Find your next opportunity.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#00113b]/65 dark:text-slate-300">
            Browse the jobs and internships currently available through TechLearn.
          </p>
        </header>

        <div className="mb-7 flex flex-col gap-4 border-b border-black/10 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-6" role="tablist" aria-label="Job listings">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${activeTab === tab.id ? "border-[#3c83f6] text-[#3c83f6] dark:border-[#8fd9ff] dark:text-[#8fd9ff]" : "border-transparent text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "all" && (
            <label className="mb-3 flex h-10 w-full items-center gap-2 rounded-xl border border-black/10 bg-white/65 px-3 text-sm dark:border-white/10 dark:bg-[#071a3e] sm:mb-2 sm:w-72">
              <Search className="h-4 w-4 shrink-0 text-black/40 dark:text-white/50" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search jobs"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
              />
            </label>
          )}
        </div>

        {activeTab === "for-you" && !isAuthenticated && (
          <div className="mb-6 rounded-2xl border border-[#3c83f6]/20 bg-white/65 p-5 dark:border-[#8fd9ff]/20 dark:bg-[#071a3e]">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-[#3c83f6] dark:text-[#8fd9ff]" />
              <div>
                <p className="font-bold">Personalized jobs come after your profile.</p>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">Sign up and tell us what role you want so we can build this list from your real preferences.</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-white/50 p-10 text-center text-sm text-black/55 dark:border-white/10 dark:bg-[#071a3e] dark:text-white/60">Loading jobs...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        ) : visibleJobs.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-[#071a3e]">
            {activeTab === "for-you" && <img src="/logoo2-small.webp" alt="TechLearn mascot" className="mx-auto h-16 w-16 object-contain" />}
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-[#3c83f6] dark:text-[#8fd9ff]" />
            <h2 className="mt-4 text-xl font-bold">{activeTab === "for-you" ? "Your recommendations are not ready yet" : "No jobs are available yet"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55 dark:text-white/60">{message || "New opportunities will appear here when they are published."}</p>
            {activeTab === "for-you" && (
              <Link to={isAuthenticated ? "/dashboard/profile" : "/onboarding?intent=placement"} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3c83f6] px-4 py-2.5 text-sm font-bold text-white">
                {isAuthenticated ? "Update profile" : "Build your profile"} <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleJobs.map((job) => (
              <article key={job.id} className="dashboard-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#3c83f6] dark:text-[#8fd9ff]">{job.company}</p>
                    <h2 className="mt-2 text-xl font-bold">{job.title}</h2>
                  </div>
                  {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-black/10 p-2 text-[#3c83f6] dark:border-white/10 dark:text-[#8fd9ff]" aria-label={`Apply for ${job.title}`}><ArrowUpRight className="h-4 w-4" /></a>}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-black/55 dark:text-white/60">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  <span>{job.employmentType}</span>
                  <span>{formatPostedDate(job.postedAt)}</span>
                </div>
                {job.description && <p className="mt-4 text-sm leading-6 text-black/65 dark:text-white/70">{job.description}</p>}
                {job.skills?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-lg border border-black/10 px-2 py-1 text-xs dark:border-white/10">{skill}</span>)}</div>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
