import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data);
        }
      } catch (err) {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/admin/batches')} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900">Admin Profile</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 pb-10">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading profile...</div>
        ) : (
          <>
            {/* Avatar Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name || 'Admin User'}</h2>
              <p className="text-sm text-slate-500">{user?.email || 'admin@techlearn.com'}</p>
              <span className="mt-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
                {user?.role || 'Administrator'}
              </span>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Account Details</h3>

              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Full Name</span>
                <span className="text-sm font-semibold text-slate-900">{user?.name || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Email</span>
                <span className="text-sm font-semibold text-slate-900">{user?.email || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Role</span>
                <span className="text-sm font-semibold text-blue-600">{user?.role || 'admin'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-slate-500">Joined</span>
                <span className="text-sm font-semibold text-slate-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
              <button
                onClick={() => navigate('/admin')}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm font-medium text-slate-700"
              >
                <span>🏠</span> Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/admin/batches')}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm font-medium text-slate-700"
              >
                <span>📊</span> Manage Batches
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-3 text-sm font-medium text-red-600"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
