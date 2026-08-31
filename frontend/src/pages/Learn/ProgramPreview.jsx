import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Clock, FolderKanban, Layers3, Map } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { programLearningAPI } from "../../services/programLearningApi";

const materialIcon = (type) => {
  if (type === "Course") return BookOpen;
  if (type === "Roadmap") return Map;
  if (type === "Project") return FolderKanban;
  return Layers3;
};

export default function ProgramPreview() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    programLearningAPI.getPublicProgramPreview(programId)
      .then((payload) => {
        if (!cancelled) setProgram(payload.program || null);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "This program is not available.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [programId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 pt-24 text-sm text-[#00113b] dark:text-white">
        Loading program...
      </main>
    );
  }

  if (error || !program) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 pt-24 text-[#00113b] dark:text-white">
        <section className="dashboard-surface max-w-xl p-10 text-center">
          <h1 className="text-2xl font-black">Program not available</h1>
          <p className="mt-3 text-sm text-black/60 dark:text-white/65">{error || "This free program is not currently published."}</p>
          <button type="button" onClick={() => navigate("/learn")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#3c83f6] px-4 py-3 text-sm font-bold text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Learn
          </button>
        </section>
      </main>
    );
  }

  const intent = program.programType === "Skill" ? "skill" : "placement";
  const materials = Array.isArray(program.materials) ? program.materials : [];

  return (
    <div className="min-h-screen px-5 pb-20 pt-28 text-[#00113b] dark:text-white md:px-10 lg:px-16">
      <main className="mx-auto w-full max-w-[1240px]">
        <Link to="/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-black/55 transition hover:text-black dark:text-white/60 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Learn
        </Link>

        <section className="dashboard-surface mt-8 overflow-hidden p-6 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-press-start text-[9px] uppercase tracking-[0.16em] text-[#3c83f6] dark:text-[#bceaff]">
                {program.programType} PROGRAM
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">{program.name}</h1>
              <p className="mt-5 text-base leading-7 text-black/60 dark:text-white/65">
                {program.description || "Explore the published learning path and its available resources."}
              </p>
            </div>
            <Link to={`/onboarding?intent=${intent}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#3c83f6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
              Create a learner profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="dashboard-surface-strong p-4">
              <Clock className="h-5 w-5 text-[#3c83f6] dark:text-[#bceaff]" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/55">Duration</p>
              <p className="mt-1 font-bold">{program.duration || `${program.durationDays || "—"} days`}</p>
            </div>
            <div className="dashboard-surface-strong p-4">
              <BookOpen className="h-5 w-5 text-[#3c83f6] dark:text-[#bceaff]" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/55">Courses</p>
              <p className="mt-1 font-bold">{program.courseCount || 0}</p>
            </div>
            <div className="dashboard-surface-strong p-4">
              <Layers3 className="h-5 w-5 text-[#3c83f6] dark:text-[#bceaff]" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/55">Published resources</p>
              <p className="mt-1 font-bold">{materials.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="font-press-start text-[9px] uppercase tracking-[0.16em] text-[#3c83f6] dark:text-[#bceaff]">LEARNING PATH</p>
            <h2 className="mt-3 text-2xl font-black">Browse the available resources</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/65">You can read public material before deciding whether to create an account.</p>
          </div>

          {materials.length === 0 ? (
            <div className="dashboard-surface p-8 text-sm text-black/60 dark:text-white/65">This program is published, but its resources are being prepared.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {materials.map((material) => {
                const Icon = materialIcon(material.type);
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-[#3c83f6]/10 p-3 text-[#3c83f6] dark:bg-white/5 dark:text-[#bceaff]"><Icon className="h-5 w-5" /></span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#3c83f6] dark:text-[#bceaff]">{material.type}</p>
                          <h3 className="mt-1 font-bold">{material.title}</h3>
                        </div>
                      </div>
                      {material.href && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-black/40 dark:text-white/45" />}
                    </div>
                    {material.description && <p className="mt-4 text-sm leading-6 text-black/60 dark:text-white/65">{material.description}</p>}
                  </>
                );

                return material.href ? (
                  <Link key={`${material.type}-${material.id}`} to={material.href} className="dashboard-surface p-5 transition hover:-translate-y-0.5 hover:border-[#3c83f6]/45">
                    {content}
                  </Link>
                ) : (
                  <article key={`${material.type}-${material.id}`} className="dashboard-surface p-5">
                    {content}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
