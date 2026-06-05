import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, ArrowLeft } from 'lucide-react';
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
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-8">
        
        {/* Header Section with Brand Gradient and Back Button */}
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-4xl pt-8 text-center md:pt-10"
        >
          <button
            type="button"
            onClick={() => navigate("/dashboard/resources")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </button>
          <h1 className="font-press-start leading-normal">
            <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
              IMPORTANT CONCEPTS
            </span>
          </h1>
        </motion.header>

        {/* Search Section */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.04 }}
          className="dashboard-surface dashboard-surface-strong p-6 sm:p-8"
        >
          <div className="w-full">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f82ac] dark:text-[#81bde6]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search concepts..."
                className="dashboard-input-surface rounded-full pl-10 pr-4"
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
          <section className="space-y-4">
            <p className="text-sm text-[#5f82ac] dark:text-[#81bde6]">
              {filtered.length} topic{filtered.length !== 1 ? 's' : ''}
            </p>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((concept, index) => (
                <motion.article
                  key={concept.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="dashboard-surface flex h-full flex-col p-6 md:p-8 border border-transparent hover:border-[#3C83F6]/25 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group justify-between"
                >
                  {/* Hover Glow Layer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3C83F6]/0 to-[#3C83F6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />

                  {/* Top Block */}
                  <div className="z-10 flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold shadow-sm group-hover:scale-105 transition-transform duration-300"
                        style={{
                          color: concept.color,
                          borderColor: `${concept.color}44`,
                          backgroundColor: `${concept.color}15`,
                        }}
                      >
                        {concept.icon}
                      </div>

                      <div className="min-h-[3rem] min-w-0 flex-1 flex flex-col justify-center">
                        <h2 className="text-xl font-bold tracking-tight text-[#0d2a57] dark:text-[#dff3ff] group-hover:text-[#3C83F6] transition-colors duration-300 leading-snug">
                          {concept.title}
                        </h2>
                        <p className="mt-1 text-xs uppercase tracking-widest font-semibold text-[#5f82ac] dark:text-[#81bde6]">
                          {concept.topics} topics
                        </p>
                      </div>
                    </div>

                    <p className="min-h-[4.5rem] line-clamp-3 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] leading-relaxed">
                      {concept.description}
                    </p>
                  </div>

                  {/* Bottom Block */}
                  <div className="z-10 mt-6 pt-5 border-t border-black/5 dark:border-white/5 space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold">
                        <span className="text-[#5f82ac] dark:text-[#81bde6]">Progress</span>
                        <span className="text-[#3c83f6] dark:text-[#8fd9ff]">{concept.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#c4e3ff] dark:bg-[#0a2f6f]/55 relative overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6]"
                          style={{ width: `${concept.progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => goToConceptDetail(concept.id)}
                      className="dashboard-secondary-btn w-full py-3 flex items-center justify-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>{concept.progress > 0 ? 'Continue' : 'Start Learning'}</span>
                    </button>
                  </div>
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
