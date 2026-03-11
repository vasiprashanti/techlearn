import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminReports() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalBatches: 0, activeBatches: 0, tracks: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/batches`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const batches = await res.json();
          const tracks = {};
          batches.forEach(b => {
            tracks[b.track] = (tracks[b.track] || 0) + 1;
          });
          setStats({
            totalBatches: batches.length,
            activeBatches: batches.filter(b => b.status === 'Active').length,
            tracks,
          });
        }
      } catch (err) {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const trackColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => navigate('/admin/batches')} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            <span className="text-xl">←</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reports</h1>
            <p className="text-xs text-slate-500">Batch analytics overview</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6 pb-10">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading reports...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Batches</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalBatches}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Active Batches</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.activeBatches}</p>
              </div>
            </div>

            {/* Track Distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Batches by Track</h2>
              {Object.keys(stats.tracks).length === 0 ? (
                <p className="text-sm text-slate-500">No batch data available yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.tracks).map(([track, count], idx) => (
                    <div key={track}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-700 font-medium">{track}</span>
                        <span className="text-sm text-slate-500 font-bold">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className={`${trackColors[idx % trackColors.length]} h-2.5 rounded-full transition-all`}
                          style={{ width: `${Math.min((count / stats.totalBatches) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Facts */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Quick Facts</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-600">Total Tracks</span>
                  <span className="text-sm font-bold text-slate-900">{Object.keys(stats.tracks).length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-600">Inactive Batches</span>
                  <span className="text-sm font-bold text-slate-900">{stats.totalBatches - stats.activeBatches}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600">Most Popular Track</span>
                  <span className="text-sm font-bold text-blue-600">
                    {Object.entries(stats.tracks).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
