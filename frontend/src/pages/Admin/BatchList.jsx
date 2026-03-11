import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Building2, ChevronDown, Eye, Users, Bell, X, LayoutDashboard, LogOut, Zap, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StatusBadge({ status }) {
  const map = {
    Active: 'border border-green-500 text-green-600 bg-white',
    Upcoming: 'border border-amber-500 text-amber-600 bg-white',
    Archived: 'border border-slate-400 text-slate-500 bg-white',
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${map[status] || map.Upcoming}`}>
      {status}
    </span>
  );
}

function CollegeDropdown({ colleges, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 font-medium hover:border-slate-300 transition-colors min-w-[140px] justify-between"
      >
        <span>{value || 'All Colleges'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[180px] py-1 overflow-hidden">
          {['All Colleges', ...colleges].map(c => (
            <button
              key={c}
              onClick={() => { onChange(c === 'All Colleges' ? '' : c); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                (value === c || (!value && c === 'All Colleges')) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = ['All Status', 'Active', 'Upcoming', 'Archived'];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 font-medium hover:border-slate-300 transition-colors min-w-[130px] justify-between"
      >
        <span>{value || 'All Status'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[160px] py-1 overflow-hidden">
          {options.map(o => (
            <button
              key={o}
              onClick={() => { onChange(o === 'All Status' ? '' : o); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                (value === o || (!value && o === 'All Status')) ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BatchCard({ batch, onView, onEdit, onDelete, onToggleStatus }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <Building2 size={14} className="text-slate-400" />
          <span className="font-medium text-slate-600">{batch.college}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(batch)}
            title={batch.status === 'Active' ? 'Deactivate batch' : 'Activate batch'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              batch.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
            }`}
          >
            <Zap size={12} className={batch.status === 'Active' ? 'fill-emerald-500 text-emerald-500' : 'text-slate-400'} />
            {batch.status === 'Active' ? 'Active' : 'Activate'}
          </button>
          <StatusBadge status={batch.status} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 leading-tight">{batch.name}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{batch.description || batch.track}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100">
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">Start</p>
          <p className="text-sm font-semibold text-slate-800">{fmtDate(batch.startDate)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">End</p>
          <p className="text-sm font-semibold text-slate-800">{fmtDate(batch.endDate)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">Students</p>
          <p className="text-sm font-semibold text-slate-800">{batch.students?.length ?? 0}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onView(batch._id)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
        >
          <Eye size={16} />
          View Batch
        </button>
        <button
          onClick={() => onEdit(batch._id)}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
          title="Edit batch"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(batch._id, batch.name)}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 transition-colors"
          title="Delete batch"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function BatchList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filterSearchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close panels on outside click
  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const uniqueColleges = [...new Set(batches.map(b => b.college).filter(Boolean))];

  const filtered = batches.filter(b => {
    const q = search.toLowerCase();
    if (q && !b.name.toLowerCase().includes(q) && !b.college.toLowerCase().includes(q) && !b.track.toLowerCase().includes(q)) return false;
    if (collegeFilter && b.college !== collegeFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setBatches(await res.json());
      else setError('Failed to fetch batches');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (batch) => {
    const newStatus = batch.status === 'Active' ? 'Upcoming' : 'Active';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${batch._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          batchName: batch.name, college: batch.college,
          track: batch.track, startDate: batch.startDate, status: newStatus,
        }),
      });
      if (res.ok) {
        setBatches(prev => prev.map(b => b._id === batch._id ? { ...b, status: newStatus } : b));
      } else {
        setError('Failed to update batch status');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (batchId, batchName) => {
    if (!window.confirm(`Delete "${batchName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/batches/${batchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setBatches(prev => prev.filter(b => b._id !== batchId));
      else setError('Failed to delete batch');
    } catch (err) {
      setError(err.message);
    }
  };

  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A';
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' : 'Admin User';

  return (
    <div className="min-h-screen bg-[#EDF4FB]">
      <Sidebar headerMode isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Batches</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Header search — clicks to focus the filter bar search */}
            <div
              className="relative hidden md:flex items-center cursor-pointer"
              onClick={() => filterSearchRef.current?.focus()}
            >
              <Search size={15} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                readOnly
                className="pl-9 pr-10 py-2 border border-slate-200 rounded-full text-sm text-slate-400 bg-slate-50 w-52 cursor-pointer hover:border-slate-300 transition-colors select-none"
              />
              <span className="absolute right-3 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5">⌘K</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifications(p => !p); setShowProfile(false); }}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-800 text-sm">Notifications</p>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm text-slate-700 font-medium">New student enrolled</p>
                      <p className="text-xs text-slate-400 mt-0.5">2 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm text-slate-700 font-medium">Batch CS-2024A updated</p>
                      <p className="text-xs text-slate-400 mt-0.5">1 hour ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm text-slate-700 font-medium">New batch created</p>
                      <p className="text-xs text-slate-400 mt-0.5">Yesterday</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 text-center">
                    <button className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(p => !p); setShowNotifications(false); }}
                className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold hover:bg-blue-700 transition-colors select-none cursor-pointer"
              >
                {userInitial}
              </button>

              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {/* Profile header */}
                  <div className="flex flex-col items-center pt-6 pb-4 px-4 bg-slate-50 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mb-3 shadow-md">
                      {userInitial}
                    </div>
                    <p className="font-bold text-slate-900 text-base">{fullName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.email || '—'}</p>
                    <span className="mt-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full uppercase tracking-wide">
                      {user?.role || 'Administrator'}
                    </span>
                  </div>

                  {/* Account details */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Account Details</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Full Name', value: fullName },
                        { label: 'Email', value: user?.email || '—' },
                        { label: 'Role', value: user?.role || '—', highlight: true },
                        { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className={`text-xs font-semibold ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-2">
                    <button
                      onClick={() => { navigate('/admin'); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-slate-400" />
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => { navigate('/admin/batches'); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Users size={16} className="text-slate-400" />
                      Manage Batches
                    </button>
                    <button
                      onClick={() => { logout(); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={filterSearchRef}
              type="text"
              placeholder="Search batches..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <CollegeDropdown colleges={uniqueColleges} value={collegeFilter} onChange={setCollegeFilter} />
          <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
          <button
            onClick={() => navigate('/admin/batches/create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors ml-auto"
          >
            <Plus size={16} />
            Create Batch
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
                <div className="h-6 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                <div className="h-10 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Users size={28} className="text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">No batches found</p>
            <p className="text-sm text-slate-500 mb-6">
              {batches.length === 0 ? 'Create your first batch to get started.' : 'Try adjusting your filters.'}
            </p>
            {batches.length === 0 && (
              <button
                onClick={() => navigate('/admin/batches/create')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
              >
                <Plus size={16} /> Create First Batch
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(batch => (
              <BatchCard
                key={batch._id}
                batch={batch}
                onView={id => navigate(`/admin/batches/${id}`)}
                onEdit={id => navigate(`/admin/batches/${id}/edit`)}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
