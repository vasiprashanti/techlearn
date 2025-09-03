import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import useInViewport from "../../hooks/useInViewport";
import CourseCard from "../../components/CourseCard";

const CollegeAssessment = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeRounds, setActiveRounds] = useState([]);
  const [headingRef, isHeadingInViewport] = useInViewport();

  const collegeConfig = {
    uoh: { logo: "/uh.png", shortName: "UoH" },
    vjit: { logo: "/vjit.png", shortName: "VJIT" },
    vnr: { logo: "/vnrvjiet.png", shortName: "VNRVJIET" },
    mahindra: { logo: "/mu.png", shortName: "MU" },
  };

  const currentCollege = collegeConfig[collegeId];
  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/college/${collegeId}`);
        const result = res.data;

        if (result.success) {
          const mergedRounds = [
            ...(result.mcqs || []).map((mcq) => ({ ...mcq, type: "MCQ" })),
            ...(result.codingRounds || []).map((coding) => ({
              ...coding,
              type: "Coding",
            })),
          ];
          setActiveRounds(mergedRounds.filter((r) => r.isActive));
        } else {
          setActiveRounds([]);
        }
      } catch (error) {
        console.error("Error fetching college data:", error);
        setActiveRounds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeData();
  }, [collegeId]);

  const handleStartTest = (linkId, type) => {
    if (type === "MCQ") navigate(`/mcq/${linkId}`);
    if (type === "Coding") navigate(`/coding/${linkId}`);
  };

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  if (!currentCollege) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            College Not Found
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <ScrollProgress />

      {/* Header Section */}
      <div className="relative z-10 pt-24 pb-12">
        <div className="container px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            {/* Left-aligned Logo Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3 flex-shrink-0">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                  techPREP
                </h1>
                <span className="text-xl font-semibold text-blue-900 dark:text-white">
                  X
                </span>
                <img
                  src={currentCollege.logo}
                  alt={currentCollege.shortName}
                  className="h-16 md:h-20 object-contain flex-shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Tagline under logo, also left aligned */}
            <div className="w-full">
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-4xl leading-relaxed">
                Practice MCQs and coding rounds to boost your placement prep and ace technical interviews.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rounds Grid */}
      <div className="container px-6 pb-16 mx-auto max-w-7xl">
        {activeRounds.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {activeRounds.map((round, index) => (
              <CourseCard
                key={round._id}
                course={{
                  id: round._id,
                  title: round.title,
                  description: `${round.type} Assessment`,
                  status: "available",
                }}
                index={index}
                onClick={() => handleStartTest(round.linkId, round.type)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No active tests available right now.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CollegeAssessment;
