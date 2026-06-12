import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import MarkdownContent from '../Learn/MarkdownContent';
import { getStudentProjectOverview } from '../../api/project';

export default function ProjectOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overviewData, setOverviewData] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getStudentProjectOverview();
      if (res.success) {
        setOverviewData(res);
      } else {
        setError(res.message || 'Failed to load project overview.');
      }
    } catch (err) {
      console.error('Project Overview Fetch Error:', err);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-6 text-[#00113b]">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#00113b] transition hover:text-[#001b5c] dark:text-[#8fd9ff] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 md:p-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading project overview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 font-semibold text-sm">{error}</p>
              <button
                type="button"
                onClick={fetchOverview}
                className="mt-4 bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-blue-700 transition"
              >
                Retry
              </button>
            </div>
          ) : overviewData ? (
            <div className="space-y-6">
              <div className="border-b border-black/5 dark:border-white/5 pb-5">
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded">
                  {overviewData.category}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#00113b] dark:text-white mt-2 md:text-3xl">
                  {overviewData.title}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  {overviewData.description}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div>Duration: <span className="text-[#00113b] dark:text-white">{overviewData.duration_days} Days</span></div>
                  <div>Cert XP Requirement: <span className="text-[#00113b] dark:text-white">{overviewData.xp_requirement} XP</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#00113b] dark:text-white mb-4">Project Guide & Expectations</h3>
                {overviewData.overview_markdown_content ? (
                  <div className="prose dark:prose-invert max-w-none">
                    <MarkdownContent markdown={overviewData.overview_markdown_content} />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">No overview documentation uploaded for this project.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </UserSidebarLayout>
  );
}
