import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { programLearningAPI } from "../../services/programLearningApi";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/courseDetails.css";

const formatPhaseName = (phaseKey) => {
  if (!phaseKey) return "";
  const map = {
    day_0_readiness: "Phase 1: Day 0 Readiness",
    core_learning: "Phase 2: Core Learning",
    revision: "Phase 3: Revision",
    company_preparation: "Phase 4: Company Preparation",
    final_assessment: "Phase 5: Final Assessment",
  };
  return map[phaseKey] || phaseKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function ProgramPreview() {
  const { theme } = useTheme();
  const { programId } = useParams();
  const navigate = useNavigate();

  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState("curriculum");
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    programLearningAPI
      .getPublicProgramPreview(programId)
      .then((payload) => {
        if (!cancelled) {
          const prog = payload.program || null;
          if (!prog || !prog._id) {
            throw new Error("No valid program data received from backend");
          }
          setProgram(prog);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "This program is not available.");
          setProgram(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  if (error || !program) {
    return (
      <div
        className={`course-details-page ${
          isDarkMode ? "dark-mode" : "light-mode"
        } flex min-h-screen items-center justify-center`}
      >
        <div className="page text-center py-20">
          <h1 className="course-title mb-4">
            {error ? "Program not available" : "Program Not Found"}
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

  const intent = program.programType === "Skill" ? "skill" : "placement";
  const materials = Array.isArray(program.materials) ? program.materials : [];
  const phases = Array.isArray(program.phases) ? program.phases : [];
  const learningGoals = Array.isArray(program.learningGoals) && program.learningGoals.length > 0
    ? program.learningGoals
    : [];

  const handleStartProgram = () => {
    navigate(`/onboarding?intent=${intent}`);
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
            <div className="course-type">
              {program.programType?.toUpperCase() || "SKILL"} PROGRAM
            </div>

            <h1 className="course-title">{program.name}</h1>

            <p className="course-description">
              {program.description ||
                "Explore the comprehensive structured curriculum, hands-on practice, and verified learning milestones."}
            </p>

            {/* PROGRAM META */}
            <div className="course-meta">
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">
                  {program.duration || `${program.durationDays || "—"} Days`}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Mode</span>
                <span className="meta-value">
                  {program.availability || "Structured"}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Access</span>
                <span className="meta-value">
                  {program.pricingType === "Free" ? "Free" : "Paid"}
                </span>
              </div>
            </div>

            {/* SKILLS */}
            {program.skillTags && program.skillTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
                {program.skillTags.map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3C83F6]/15 text-[#3C83F6] dark:bg-blue-500/20 dark:text-blue-300"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            )}

            {/* TARGET COMPANIES (Placement programs) */}
            {program.targetCompanies && program.targetCompanies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 mb-2 text-xs opacity-80">
                <span className="font-semibold uppercase tracking-wider text-[9px] opacity-60">
                  Target Companies:
                </span>
                {program.targetCompanies.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded border border-black/10 dark:border-white/10 text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* START / ONBOARDING BUTTON */}
            <button
              className="start-button"
              id="startButton"
              type="button"
              onClick={handleStartProgram}
            >
              <span>CREATE LEARNER PROFILE</span>
              <span className="button-arrow">→</span>
            </button>
          </div>

          {/* HERO VISUAL */}
          <div className="hero-visual">
            <div className="code-card">
              <div className="code-top">
                <div className="code-label">
                  {(program.name || "PROGRAM").toUpperCase()} / CURRICULUM
                </div>
                <div className="code-progress-label">
                  {phases.length > 0 ? `01 / ${String(phases.length).padStart(2, "0")}` : "ACTIVE"}
                </div>
              </div>

              <div className="code-window">
                <div className="code-line">
                  <span className="code-number">01</span>
                  <span>
                    <span className="code-keyword">const</span> program = &#123;
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">02</span>
                  <span>
                    &nbsp;&nbsp;type: <span className="code-accent">"{program.programType}"</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">03</span>
                  <span>
                    &nbsp;&nbsp;duration: <span className="code-accent">"{program.duration || `${program.durationDays || 30} Days`}"</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">04</span>
                  <span>
                    &nbsp;&nbsp;resources: <span className="code-accent">{materials.length}</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">05</span>
                  <span>
                    &nbsp;&nbsp;enrollment: <span className="code-accent">"Open"</span>
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">06</span>
                  <span>&#125;;</span>
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
              {phases.length > 0 ? "Phases & Schedule" : "Resources"}
            </button>

            {materials.length > 0 && phases.length > 0 && (
              <button
                className={`tab ${activeTab === "resources" ? "active" : ""}`}
                data-tab="resources"
                type="button"
                onClick={() => setActiveTab("resources")}
              >
                Materials ({materials.length})
              </button>
            )}

            {learningGoals.length > 0 && (
              <button
                className={`tab ${activeTab === "outcomes" ? "active" : ""}`}
                data-tab="outcomes"
                type="button"
                onClick={() => setActiveTab("outcomes")}
              >
                Outcomes
              </button>
            )}
          </div>

          {/* =====================================
               PHASES / CURRICULUM
          ====================================== */}
          <div
            className={`tab-content ${
              activeTab === "curriculum" ? "active" : ""
            }`}
            id="curriculum"
          >
            <div className="section-eyebrow">
              {phases.length > 0 ? "PROGRAM PHASES" : "PROGRAM RESOURCES"}
            </div>

            <h2 className="section-title">What you'll learn.</h2>

            <div className="curriculum-list">
              {phases.length > 0 ? (
                (() => {
                  const mid = Math.ceil(phases.length / 2);
                  const col1 = phases.slice(0, mid);
                  const col2 = phases.slice(mid);

                  return (
                    <>
                      <div className="curriculum-col">
                        {col1.map((p, idx) => (
                          <div className="curriculum-row" key={p.phase || idx}>
                            <div className="chapter-number">
                              {String(idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{formatPhaseName(p.phase)}</div>
                              <span className="text-xs opacity-60">
                                Day {p.startDay} - Day {p.endDay}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="curriculum-col">
                        {col2.map((p, idx) => (
                          <div className="curriculum-row" key={p.phase || idx}>
                            <div className="chapter-number">
                              {String(mid + idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{formatPhaseName(p.phase)}</div>
                              <span className="text-xs opacity-60">
                                Day {p.startDay} - Day {p.endDay}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()
              ) : materials.length > 0 ? (
                (() => {
                  const mid = Math.ceil(materials.length / 2);
                  const col1 = materials.slice(0, mid);
                  const col2 = materials.slice(mid);

                  return (
                    <>
                      <div className="curriculum-col">
                        {col1.map((mat, idx) => (
                          <div className="curriculum-row" key={mat.id || idx}>
                            <div className="chapter-number">
                              {String(idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{mat.title}</div>
                              <span className="text-xs opacity-60">
                                {mat.type} {mat.description ? `• ${mat.description}` : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="curriculum-col">
                        {col2.map((mat, idx) => (
                          <div className="curriculum-row" key={mat.id || idx}>
                            <div className="chapter-number">
                              {String(mid + idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{mat.title}</div>
                              <span className="text-xs opacity-60">
                                {mat.type} {mat.description ? `• ${mat.description}` : ""}
                              </span>
                            </div>
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
                    <div className="chapter-name">Foundations & Structured Learning</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =====================================
               RESOURCES TAB (when phases exist)
          ====================================== */}
          {materials.length > 0 && phases.length > 0 && (
            <div
              className={`tab-content ${
                activeTab === "resources" ? "active" : ""
              }`}
              id="resources"
            >
              <div className="section-eyebrow">ATTACHED MATERIALS</div>

              <h2 className="section-title">Included learning assets.</h2>

              <div className="curriculum-list">
                {(() => {
                  const mid = Math.ceil(materials.length / 2);
                  const col1 = materials.slice(0, mid);
                  const col2 = materials.slice(mid);

                  return (
                    <>
                      <div className="curriculum-col">
                        {col1.map((mat, idx) => (
                          <div className="curriculum-row" key={mat.id || idx}>
                            <div className="chapter-number">
                              {String(idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{mat.title}</div>
                              <span className="text-xs opacity-60">
                                {mat.type} {mat.description ? `• ${mat.description}` : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="curriculum-col">
                        {col2.map((mat, idx) => (
                          <div className="curriculum-row" key={mat.id || idx}>
                            <div className="chapter-number">
                              {String(mid + idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{mat.title}</div>
                              <span className="text-xs opacity-60">
                                {mat.type} {mat.description ? `• ${mat.description}` : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* =====================================
               OUTCOMES
          ====================================== */}
          {learningGoals.length > 0 && (
            <div
              className={`tab-content ${
                activeTab === "outcomes" ? "active" : ""
              }`}
              id="outcomes"
            >
              <div className="section-eyebrow">AFTER THIS PROGRAM</div>

              <h2 className="section-title">What you'll achieve.</h2>

              <div className="outcomes-grid">
                {learningGoals.map((outcome, index) => (
                  <div className="outcome-card" key={index}>
                    <div className="outcome-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="outcome-title">{outcome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
