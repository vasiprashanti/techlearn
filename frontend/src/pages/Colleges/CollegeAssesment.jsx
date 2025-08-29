import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingScreen from "../../components/LoadingScreen";

const CollegeAssessment = () => {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeRounds, setActiveRounds] = useState([]);

  // College configuration
  const collegeConfig = {
    vjit: {
      name: "Vidya Jyothi Institute of Technology",
      logo: "/vjit.png",
      shortName: "VJIT",
    },
    uoh: {
      name: "University of Hyderabad",
      logo: "/uh.png",
      shortName: "UoH",
    },
    vnr: {
      name: "VNR Vignana Jyothi Institute of Engineering and Technology",
      logo: "/vnrvjiet.png",
      shortName: "VNRVJIET",
    },
    mahindra: {
      name: "Mahindra University",
      logo: "/mu.png",
      shortName: "MU",
    },
  };

  const currentCollege = collegeConfig[collegeId];
  
  const BASE_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/college/${collegeId}`);
        console.log("ipd kavalsindi",res);
        const result = res.data;

        if (result.success) {
          // Merge mcqs and coding rounds (access directly from result)
          const mergedRounds = [
            ...(result.mcqs || []).map((mcq) => ({
              ...mcq,
              type: "MCQ",
            })),
            ...(result.codingRounds || []).map((coding) => ({
              ...coding,
              type: "Coding",
            })),
          ];

          // filter only active ones
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
    return <LoadingScreen showMessage={false} size={48} duration={800} />;
  }

  if (!currentCollege) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
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
    <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
      <div className="max-w-7xl w-full mx-auto px-6 pt-20 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900 dark:text-white">
              tech<span className="text-blue-600">PREP</span>
            </h1>
            <span className="text-xl font-semibold text-blue-900 dark:text-gray-200">
              X
            </span>
            <img
              src={currentCollege.logo}
              alt={currentCollege.shortName}
              className="h-36 md:h-38 object-contain"
            />
          </div>
          <p className="text-lg text-blue-900 dark:text-gray-200">
            Practice MCQs and coding rounds to boost your placement prep and ace
            technical interviews.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {activeRounds.length > 0 ? (
            activeRounds.map((round) => (
              <div
                key={round._id}
                className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <h4 className="text-lg font-semibold text-blue-900 dark:text-white text-center mb-4">
                  {round.title}
                </h4>
                <button
                  onClick={() => handleStartTest(round.linkId, round.type)}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition ${
                    round.type === "MCQ"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Start {round.type} Round
                </button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-blue-900 dark:text-gray-200 text-center">
              No active tests available right now.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeAssessment;
