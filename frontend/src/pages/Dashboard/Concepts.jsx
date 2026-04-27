import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { conceptsData } from "../../api/coursesData";

const Concepts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const isDashboardContext = location.pathname.startsWith('/dashboard/resources/important-concepts');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(conceptsData);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () =>
      courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())),
    [courses, search]
  );

  const goToConceptDetail = (conceptId) => {
    const basePath = isDashboardContext
      ? '/dashboard/resources/important-concepts'
      : '/core-prep/important-concepts';
    navigate(`${basePath}/${conceptId}`);
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="dashboard-surface dashboard-surface-strong p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="dashboard-page-title">
                Important Concepts
              </h1>
              <p className="dashboard-page-subtitle max-w-2xl">
                Strengthen your interview foundations with structured deep-dives into OS, DBMS, Networks, OOD, and system design essentials.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f82ac] dark:text-[#81bde6]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search concepts..."
                className="dashboard-input-surface rounded-xl pl-10 pr-3"
              />
            </div>
          </div>
        </motion.section>

        {loading ? (
          <div className="dashboard-surface p-6 text-[#4c6f9a] dark:text-[#7fb8e2]">
            Loading concepts...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-300/70 bg-red-50 p-6 text-red-700 dark:border-red-500/35 dark:bg-red-900/20 dark:text-red-300">
            Failed to load concepts. Please try again.
          </div>
        ) : null}

        {!loading && !error ? (
          <section>
            <p className="mb-4 text-sm text-[#5f82ac] dark:text-[#81bde6]">
              {filtered.length} topic{filtered.length !== 1 ? 's' : ''}
            </p>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((concept, index) => (
                <motion.article
                  key={concept.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="dashboard-surface flex h-full flex-col p-5"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
                      style={{
                        color: concept.color,
                        borderColor: `${concept.color}55`,
                        backgroundColor: `${concept.color}1f`,
                      }}
                    >
                      {concept.icon}
                    </div>

                    <div className="min-h-[4.5rem] min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">{concept.title}</h2>
                      <p className="mt-1 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">{concept.topics} topics</p>
                    </div>
                  </div>

                  <p className="mt-4 min-h-[4.5rem] line-clamp-3 text-sm text-[#3d618e] dark:text-[#7fb8e2]">{concept.description}</p>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest">
                      <span className="text-[#5f82ac] dark:text-[#81bde6]">Progress</span>
                      <span className="font-semibold text-[#2d7fe8] dark:text-[#8fd9ff]">{concept.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#c4e3ff] dark:bg-[#0a2f6f]/55">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6]"
                        style={{ width: `${concept.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToConceptDetail(concept.id)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#082a5d] shadow-md transition hover:scale-[1.01] hover:shadow-lg"
                  >
                    <BookOpen className="h-4 w-4" />
                    {concept.progress > 0 ? 'Continue' : 'Start Learning'}
                  </button>
                </motion.article>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#86c4ff]/45 bg-[#e7f6ff] p-6 text-sm text-[#4c6f9a] dark:border-[#6fbfff]/35 dark:bg-[#0d366f]/65 dark:text-[#7fb8e2]">
                No concepts match "{search}".
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </UserSidebarLayout>
  );
};

export default Concepts;
