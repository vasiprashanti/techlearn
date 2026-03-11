import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import { ArrowLeft, Calendar, BookOpen, Building2, AlignLeft, Menu } from 'lucide-react';

const colleges = [
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'NIT Trichy', 'NIT Warangal',
  'BITS Pilani', 'VIT Vellore', 'SRM University', 'Amity University', 'MIT', 'Other',
];

const tracks = [
  'Data Structures & Algorithms',
  'Full Stack Web Development',
  'Data Science & AI',
  'UI/UX Design',
  'React & Node.js',
  'Python Programming',
  'Mobile App Development',
  'DevOps & Cloud',
  'Cybersecurity',
  'Web Development',
];

const toDateInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().split('T')[0];
};

export default function BatchEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    batchName: '',
    college: '',
    track: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchBatch(); }, [id]);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const batch = await res.json();
        setFormData({
          batchName: batch.name || '',
          college: batch.college || '',
          track: batch.track || '',
          description: batch.description || '',
          startDate: toDateInput(batch.startDate),
          endDate: toDateInput(batch.endDate),
          status: batch.status || 'Active',
        });
      } else {
        setError('Failed to fetch batch');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/admin/batches'), 1200);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update batch');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm";
  const selectCls = "w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer text-sm";

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#EDF4FB] flex items-center justify-center">
        <Sidebar headerMode isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="text-slate-500 text-sm animate-pulse">Loading batch...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF4FB]">
      <Sidebar headerMode isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
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

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Edit Batch</h1>
          <p className="text-sm text-slate-500 mb-7">Update batch details below.</p>

          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-semibold flex items-center gap-2">
              ✅ Batch updated successfully! Redirecting...
            </div>
          )}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">Batch Name <span className="text-red-500">*</span></label>
              <input type="text" name="batchName" value={formData.batchName} onChange={handleInputChange} placeholder="e.g. CS-2024A" className={inputCls} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" /> College <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select name="college" value={formData.college} onChange={handleInputChange} className={selectCls} required>
                  <option value="">Select a college</option>
                  {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <BookOpen size={14} className="text-slate-400" /> Track <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select name="track" value={formData.track} onChange={handleInputChange} className={selectCls} required>
                  <option value="">Select a track</option>
                  {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <AlignLeft size={14} className="text-slate-400" /> Description
              </label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. Data Structures & Algorithms" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">Status</label>
              <div className="relative">
                <select name="status" value={formData.status} onChange={handleInputChange} className={selectCls}>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Archived">Archived</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" /> Start Date <span className="text-red-500">*</span>
                </label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" /> End Date
                </label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {loading ? 'Saving...' : success ? 'Saved ✓' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/batches')}
                className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
