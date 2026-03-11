import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import {
  ArrowLeft, Users, Activity, TrendingUp, Flame,
  BookOpen, Plus, Trash2, Mail,
} from 'lucide-react';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StatCard({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
        <Icon size={16} className={iconClass} />
        <span>{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchBatch(); }, [id]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setBatch(await res.json());
      else setError('Batch not found');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${id}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatch(data.batch);
        setAddEmail('');
      } else {
        setAddError(data.message || 'Failed to add student');
      }
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveStudent = async (userId) => {
    if (!window.confirm('Remove this student from the batch?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${id}/students/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        setBatch(prev => ({ ...prev, students: prev.students.filter(s => s._id !== userId) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF4FB] flex items-center justify-center">
        <Sidebar headerMode isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="text-slate-500 text-sm animate-pulse">Loading batch details...</div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-[#EDF4FB] flex flex-col items-center justify-center gap-4">
        <Sidebar headerMode isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
        <p className="text-red-600 text-sm">{error || 'Batch not found'}</p>
        <button
          onClick={() => navigate('/admin/batches')}
          className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline"
        >
          <ArrowLeft size={14} /> Back to Batches
        </button>
      </div>
    );
  }

  const totalStudents = batch.students?.length ?? 0;
  const initial = batch.name?.charAt(0)?.toUpperCase() || 'B';

  return (
    <div className="min-h-screen bg-[#EDF4FB]">
      <Sidebar headerMode isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => navigate('/admin/batches')}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Batches
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Batch Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold flex items-center justify-center flex-shrink-0 shadow-md">
            {initial}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{batch.name}</h1>
            <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {batch.college}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Started: {fmtDate(batch.startDate)}
              </span>
              <span className="text-slate-300">·</span>
              <span>{totalStudents} Student{totalStudents !== 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Students" value={totalStudents} iconClass="text-blue-500" />
          <StatCard icon={Activity} label="Active Students Today" value="—" iconClass="text-green-500" />
          <StatCard icon={TrendingUp} label="Average Score" value="—" iconClass="text-purple-500" />
          <StatCard icon={Flame} label="Average Streak" value="—" iconClass="text-orange-500" />
        </div>

        {/* Track Card */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Attached Track</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-blue-500" />
                <h3 className="font-semibold text-slate-800">{batch.track}</h3>
              </div>
              {batch.description && (
                <p className="text-sm text-slate-500 mb-3">{batch.description}</p>
              )}
              {batch.endDate && (
                <p className="text-xs text-slate-400 mt-2">
                  {fmtDate(batch.startDate)} – {fmtDate(batch.endDate)}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  batch.status === 'Active' ? 'bg-green-500' : batch.status === 'Upcoming' ? 'bg-amber-500' : 'bg-slate-400'
                }`}></span>
                <span className="text-xs text-slate-500 font-medium">{batch.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Students</h2>

          {/* Add Student */}
          <form onSubmit={handleAddStudent} className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex items-center gap-3 shadow-sm">
            <div className="relative flex-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="Enroll student by email address..."
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={addLoading || !addEmail.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              <Plus size={15} />
              {addLoading ? 'Adding...' : 'Add Student'}
            </button>
          </form>
          {addError && (
            <p className="text-red-600 text-sm mb-4 px-1">{addError}</p>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {totalStudents === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  <Users size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-500 text-sm font-medium">No students enrolled yet</p>
                <p className="text-slate-400 text-xs mt-1">Add students using their email address above</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batch.students.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(student.firstName || student.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">
                            {student.firstName
                              ? `${student.firstName} ${student.lastName || ''}`.trim()
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{student.email}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove student"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
