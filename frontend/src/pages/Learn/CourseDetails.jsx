import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/courseDetails.css";

const CourseDetails = () => {
  const { theme } = useTheme();
  const { courseId } = useParams();
  const navigate = useNavigate();

  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState("curriculum");

  // State for backend data
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch course data from backend
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const backendResponse = await courseAPI.getCourse(courseId);

        // Extract course data from response (handle both response.course and direct response)
        const backendCourse = backendResponse.course || backendResponse;

        // Check if we have valid course data
        if (!backendCourse || !backendCourse._id) {
          throw new Error("No valid course data received from backend");
        }

        const courseTitle = backendCourse.title || "Untitled Course";
        const topicsCount = backendCourse.topics?.length || 0;
        const dynamicDuration =
          topicsCount > 0
            ? `${topicsCount} Day${topicsCount === 1 ? "" : "s"}`
            : backendCourse.duration || "Self-Paced";

        const coursePrice = backendCourse.price ?? backendCourse.pricing ?? backendCourse.programFee ?? "";
        const isFree =
          !coursePrice ||
          coursePrice === 0 ||
          coursePrice === "0" ||
          coursePrice === "Free" ||
          String(coursePrice).toLowerCase() === "free" ||
          backendCourse.pricingType === "Free";

        let startButtonText = "START FOR FREE";
        if (!isFree) {
          const formattedPrice = String(coursePrice).startsWith("₹")
            ? coursePrice
            : `₹${coursePrice}`;
          startButtonText = `START FOR ${formattedPrice}`;
        }

        // Build enhanced course mapping with clean defaults
        const enhancedCourse = {
          ...backendCourse,
          id: backendCourse._id,
          title: courseTitle,
          price: coursePrice,
          isFree,
          startButtonText,
          description:
            backendCourse.description ||
            "Build a strong programming foundation by learning through practical problem solving.",
          difficulty: backendCourse.level || "Beginner",
          duration: dynamicDuration,
          courseType: backendCourse.courseType || "Self-Paced",
          instructor: {
            name: backendCourse.instructor || "Prashanti Vasi",
            bio:
              backendCourse.instructorBio ||
              "With 15+ years of experience, Prashanti Vasi believes in practical learning over theory, focusing on real-world problem solving and hands-on practice that helps students build strong fundamentals.",
          },
          curriculum:
            backendCourse.topics?.map((topic, index) => {
              const cleanTitle = (topic.title || "")
                .replace(/^CORE\s+(\w+)\s+NOTES\s*[-–]\s*\d+$/i, "$1")
                .replace(/^\d+\.\s*/, "")
                .replace(/\s*[-–]\s*\d+$/, "") || `Module ${index + 1}`;
              const topicCount = topic.lessonCount || topic.lessons || 1;

              return {
                id: topic._id || topic.id || index + 1,
                number: String(index + 1).padStart(2, "0"),
                name: cleanTitle,
                topicsLabel: `${topicCount} Topic${topicCount === 1 ? "" : "s"}`,
              };
            }) || [],
          learningOutcomes:
            Array.isArray(backendCourse.learningOutcomes) &&
            backendCourse.learningOutcomes.length > 0
              ? backendCourse.learningOutcomes
              : [
                  `Write and understand core ${courseTitle} programs.`,
                  "Solve programming problems using core concepts.",
                  "Build a strong foundation for DSA and placements.",
                ],
        };

        setCourse(enhancedCourse);
        setError(null);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(err.message);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  if (error || !course) {
    return (
      <div
        className={`course-details-page ${
          isDarkMode ? "dark-mode" : "light-mode"
        } flex min-h-screen items-center justify-center`}
      >
        <div className="page text-center py-20">
          <h1 className="course-title mb-4">
            {error ? "Error Loading Course" : "Course Not Found"}
          </h1>
          {error && <p className="course-description mb-6 mx-auto">{error}</p>}
          <button
            onClick={() => navigate("/learn")}
            className="start-button mx-auto"
            type="button"
          >
            <span>BACK TO LEARN</span>
            <span className="button-arrow">←</span>
          </button>
        </div>
      </div>
    );
  }

  const handleStartCourse = () => {
    navigate(`/learn/courses/${courseId}/topics`);
  };

  return (
    <div
      className={`course-details-page ${
        isDarkMode ? "dark-mode" : "light-mode"
      }`}
    >
      <ScrollProgress />

      <main className="page">
        {/* =======================================
             HERO
        ======================================== */}
        <section className="hero">
          <div className="hero-left">
            <div className="course-type">COURSE</div>

            <h1 className="course-title">{course.title}</h1>

            <p className="course-description">{course.description}</p>

            <div className="trainer">
              By <strong>{course.instructor.name}</strong>
            </div>

            {/* COURSE META */}
            <div className="course-meta">
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{course.duration}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Mode</span>
                <span className="meta-value">{course.courseType}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Level</span>
                <span className="meta-value">{course.difficulty}</span>
              </div>
            </div>

            {/* START BUTTON */}
            <button
              className="start-button"
              id="startButton"
              type="button"
              onClick={handleStartCourse}
            >
              <span>{course.startButtonText || "START FOR FREE"}</span>
              <span className="button-arrow">→</span>
            </button>
          </div>

          {/* HERO VISUAL */}
          <div className="hero-visual">
            <div className="code-card">
              <div className="code-top">
                <div className="code-label">
                  {(course.title || "C").toUpperCase().includes("C") ? "C / BASICS" : `${(course.title || "CODE").toUpperCase()} / BASICS`}
                </div>
                <div className="code-progress-label">
                  01 / {String(course.curriculum?.length || 8).padStart(2, "0")}
                </div>
              </div>

              <div className="code-window">
                <div className="code-line">
                  <span className="code-number">01</span>
                  <span>
                    <span className="code-keyword">#include</span> &lt;stdio.h&gt;
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">02</span>
                  <span></span>
                </div>

                <div className="code-line">
                  <span className="code-number">03</span>
                  <span>
                    <span className="code-keyword">int</span> main()
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">04</span>
                  <span>
                    &nbsp;&nbsp;printf(<span className="code-accent">"Hello"</span>);
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">05</span>
                  <span>
                    &nbsp;&nbsp;<span className="code-keyword">return</span> 0;
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">06</span>
                  <span>{"}"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================
             TABS
        ======================================== */}
        <section className="tabs-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "curriculum" ? "active" : ""}`}
              data-tab="curriculum"
              type="button"
              onClick={() => setActiveTab("curriculum")}
            >
              Curriculum
            </button>

            <button
              className={`tab ${activeTab === "trainer" ? "active" : ""}`}
              data-tab="trainer"
              type="button"
              onClick={() => setActiveTab("trainer")}
            >
              Trainer
            </button>

            <button
              className={`tab ${activeTab === "outcomes" ? "active" : ""}`}
              data-tab="outcomes"
              type="button"
              onClick={() => setActiveTab("outcomes")}
            >
              Outcomes
            </button>
          </div>

          {/* =====================================
               CURRICULUM
          ====================================== */}
          <div
            className={`tab-content ${
              activeTab === "curriculum" ? "active" : ""
            }`}
            id="curriculum"
          >
            <div className="section-eyebrow">CURRICULUM</div>

            <h2 className="section-title">What you'll learn.</h2>

            <div className="curriculum-list">
              {course.curriculum && course.curriculum.length > 0 ? (
                (() => {
                  const mid = Math.ceil(course.curriculum.length / 2);
                  const col1 = course.curriculum.slice(0, mid);
                  const col2 = course.curriculum.slice(mid);

                  return (
                    <>
                      <div className="curriculum-col">
                        {col1.map((item) => (
                          <div className="curriculum-row" key={item.id}>
                            <div className="chapter-number">{item.number}</div>
                            <div className="chapter-name">{item.name}</div>
                          </div>
                        ))}
                      </div>
                      <div className="curriculum-col">
                        {col2.map((item) => (
                          <div className="curriculum-row" key={item.id}>
                            <div className="chapter-number">{item.number}</div>
                            <div className="chapter-name">{item.name}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="curriculum-col">
                  <div className="curriculum-row">
                    <div className="chapter-number">01</div>
                    <div className="chapter-name">Foundations & Concepts</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =====================================
               TRAINER
          ====================================== */}
          <div
            className={`tab-content ${activeTab === "trainer" ? "active" : ""}`}
            id="trainer"
          >
            <div className="trainer-section">
              <div className="trainer-label">TRAINER</div>

              <div className="trainer-block">
                <div className="trainer-name">{course.instructor.name}</div>

                <p className="trainer-description">{course.instructor.bio}</p>
              </div>
            </div>
          </div>

          {/* =====================================
               OUTCOMES
          ====================================== */}
          <div
            className={`tab-content ${
              activeTab === "outcomes" ? "active" : ""
            }`}
            id="outcomes"
          >
            <div className="section-eyebrow">AFTER THIS COURSE</div>

            <h2 className="section-title">What you'll be able to do.</h2>

            <div className="outcomes-grid">
              {course.learningOutcomes.map((outcome, index) => (
                <div className="outcome-card" key={index}>
                  <div className="outcome-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="outcome-title">{outcome}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CourseDetails;
