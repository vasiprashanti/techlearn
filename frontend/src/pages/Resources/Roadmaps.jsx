import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  Loader2,
  Map,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import UserSidebarLayout from "../../components/Dashboard/UserSidebarLayout";
import { useAuth } from "../../context/AuthContext";
import { resourceAPI } from "../../services/api";

const unwrap = (payload) => payload?.data ?? payload;

const getRoadmapId = (roadmap) => roadmap?.id || roadmap?._id;

const formatDuration = (roadmap) => {
  if (roadmap?.durationLabel) return roadmap.durationLabel;
  if (!roadmap?.duration || !roadmap?.durationUnit) return "Duration not set";
  const duration = Number(roadmap.duration);
  const unit = String(roadmap.durationUnit).replace(/s$/, "");
  return `${duration} ${unit}${duration === 1 ? "" : "s"}`;
};

const extractRoadmapList = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.roadmaps)) return payload.roadmaps;
  return [];
};

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-5 mt-8 text-3xl font-black tracking-tight text-[#00113b] dark:text-[#e3f4ff]">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-8 text-2xl font-bold tracking-tight text-[#00113b] dark:text-[#d7efff]">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-bold text-[#00113b] dark:text-[#c5e7ff]">{children}</h3>,
  p: ({ children }) => <p className="mb-5 text-[15px] leading-8 text-[#00113b]/75 dark:text-[#b9d6ed]">{children}</p>,
  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 text-[#00113b]/75 dark:text-[#b9d6ed]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6 text-[#00113b]/75 dark:text-[#b9d6ed]">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7 marker:text-[#3c83f6]">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-6 rounded-xl border-l-4 border-[#3c83f6] bg-[#3c83f6]/10 px-5 py-4 dark:bg-[#3c83f6]/15">{children}</blockquote>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#2563eb] underline underline-offset-4 dark:text-[#8fd3ff]">{children}</a>,
  code: ({ inline, children }) => (
    inline
      ? <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
      : <code className="font-mono text-sm">{children}</code>
  ),
  pre: ({ children }) => <pre className="my-6 overflow-x-auto rounded-xl bg-[#071831] p-5 text-sm leading-6 text-slate-100 shadow-lg">{children}</pre>,
  hr: () => <hr className="my-8 border-black/10 dark:border-white/10" />,
};

const Meta = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.025] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
    {icon}
    <div><p className="text-[10px] uppercase tracking-[0.14em] opacity-50">{label}</p><p className="text-sm font-bold">{value}</p></div>
  </div>
);

const LoadingState = ({ label = "Loading roadmaps..." }) => (
  <div className="flex min-h-48 items-center justify-center gap-3 text-sm opacity-65"><Loader2 className="h-5 w-5 animate-spin text-[#3c83f6]" />{label}</div>
);

const ErrorState = ({ message }) => (
  <div className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-200"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{message}</span></div>
);

export default function Roadmaps() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const hasUser = Boolean(!authLoading && isAuthenticated && user);

  const [activeTab, setActiveTab] = useState("for-you");
  const [forYouRoadmap, setForYouRoadmap] = useState(null);
  const [publishedRoadmaps, setPublishedRoadmaps] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (roadmapId) {
          const payload = await resourceAPI.getPublishedRoadmapById(roadmapId);
          if (!cancelled) setDetail(unwrap(payload));
          return;
        }

        setDetail(null);
        const publishedPayload = await resourceAPI.getPublishedRoadmaps();
        const nextPublished = extractRoadmapList(publishedPayload);
        let nextForYou = null;
        if (hasUser) {
          const forYouPayload = await resourceAPI.getRoadmapsForYou();
          nextForYou = unwrap(forYouPayload) || null;
        }

        if (!cancelled) {
          setPublishedRoadmaps(nextPublished);
          setForYouRoadmap(nextForYou);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || "Unable to load roadmaps right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [hasUser, roadmapId]);

  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return publishedRoadmaps;
    return publishedRoadmaps.filter((roadmap) => [roadmap.title, roadmap.targetRole, roadmap.description]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [publishedRoadmaps, searchQuery]);

  const openRoadmap = (roadmap) => {
    const id = getRoadmapId(roadmap);
    if (id) navigate(`/roadmaps/${id}`);
  };

  const content = roadmapId ? (
    <div className="space-y-6 pb-12">
      <button type="button" onClick={() => navigate("/roadmaps")} className="inline-flex items-center gap-2 text-sm font-bold opacity-65 transition hover:text-[#2563eb] hover:opacity-100 dark:hover:text-[#8fd3ff]"><ArrowLeft className="h-4 w-4" /> Back to Roadmaps</button>
      {loading && <LoadingState label="Loading roadmap details..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && detail && (
        <article className="overflow-hidden rounded-2xl border border-black/10 bg-white/75 shadow-xl shadow-[#3c83f6]/5 dark:border-white/10 dark:bg-[#071a39]/85">
          <header className="border-b border-black/10 bg-gradient-to-br from-[#3c83f6] to-[#6366f1] px-6 py-8 text-white sm:px-10 sm:py-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">Personal learning roadmap</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{detail.title}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold"><span className="rounded-full bg-white/15 px-3 py-1.5">{detail.targetRole || "Target role"}</span><span className="rounded-full bg-white/15 px-3 py-1.5">{formatDuration(detail)}</span></div>
          </header>
          <div className="px-6 py-8 sm:px-10">
            {detail.description && <p className="mb-8 max-w-3xl text-lg leading-8 opacity-75">{detail.description}</p>}
            <div className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{detail.markdownBody || "No roadmap content is available yet."}</ReactMarkdown></div>
          </div>
        </article>
      )}
      {!loading && !error && !detail && <ErrorState message="This roadmap is no longer available." />}
    </div>
  ) : (
    <div className="space-y-7 pb-12">
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-black/10 bg-white/70 p-6 shadow-lg shadow-[#3c83f6]/5 dark:border-white/10 dark:bg-[#071a39]/80 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#3c83f6]">Your learning paths</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Roadmaps</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 opacity-65">Choose a clear path toward your target role, with every step organized in one place.</p>
        </div>
        <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#3c83f6]/10 text-[#3c83f6] sm:flex"><Map className="h-8 w-8" /></div>
      </section>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="inline-flex w-fit rounded-xl border border-black/10 bg-white/60 p-1 dark:border-white/10 dark:bg-white/[0.04]">
          <button type="button" onClick={() => setActiveTab("for-you")} className={`rounded-lg px-5 py-2.5 text-sm font-bold transition ${activeTab === "for-you" ? "bg-[#3c83f6] text-white shadow" : "opacity-60 hover:opacity-100"}`}>For You</button>
          <button type="button" onClick={() => setActiveTab("all")} className={`rounded-lg px-5 py-2.5 text-sm font-bold transition ${activeTab === "all" ? "bg-[#3c83f6] text-white shadow" : "opacity-60 hover:opacity-100"}`}>All Roadmaps</button>
        </div>
        {activeTab === "all" && <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-45" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search roadmaps..." className="dashboard-input-surface w-full pl-9" /></div>}
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && activeTab === "for-you" && (
        <section className="space-y-4">
          {!hasUser && <div className="rounded-2xl border border-[#3c83f6]/20 bg-[#3c83f6]/10 p-8 text-center"><Sparkles className="mx-auto h-8 w-8 text-[#3c83f6]" /><h2 className="mt-4 text-xl font-black">Sign in to see your roadmap</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 opacity-70">Your personalized roadmap is selected from the target role in your profile.</p><button type="button" onClick={() => navigate("/onboarding")} className="dashboard-primary-btn mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm">Choose your target role <ArrowRight className="h-4 w-4" /></button></div>}
          {hasUser && forYouRoadmap && <div className="rounded-2xl border border-[#3c83f6]/25 bg-white/75 p-6 shadow-lg shadow-[#3c83f6]/5 dark:bg-[#071a39]/85 sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c83f6]">Based on your target role</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">{forYouRoadmap.title}</h2><div className="mt-4 flex flex-wrap gap-3"><Meta icon={<Target className="h-4 w-4 text-[#3c83f6]" />} label="Target role" value={forYouRoadmap.targetRole || user?.targetRole || "—"} /><Meta icon={<Clock3 className="h-4 w-4 text-[#3c83f6]" />} label="Duration" value={formatDuration(forYouRoadmap)} /></div></div><button type="button" onClick={() => openRoadmap(forYouRoadmap)} className="dashboard-primary-btn inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm">View Roadmap <ArrowRight className="h-4 w-4" /></button></div>{forYouRoadmap.description && <p className="mt-6 max-w-3xl text-sm leading-7 opacity-70">{forYouRoadmap.description}</p>}</div>}
          {hasUser && !forYouRoadmap && <div className="rounded-2xl border border-dashed border-black/20 p-10 text-center dark:border-white/20"><BookOpen className="mx-auto h-9 w-9 opacity-45" /><h2 className="mt-4 text-xl font-black">No roadmap is available for your target role yet.</h2><p className="mt-2 text-sm opacity-65">Explore the active roadmaps available to you while more personalized paths are added.</p><button type="button" onClick={() => setActiveTab("all")} className="dashboard-secondary-btn mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm">View All Roadmaps <ArrowRight className="h-4 w-4" /></button></div>}
        </section>
      )}

      {!loading && !error && activeTab === "all" && (
        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-[#071a39]/80">
          <div className="border-b border-black/10 px-5 py-5 dark:border-white/10"><h2 className="text-xl font-black">All Roadmaps</h2><p className="mt-1 text-sm opacity-60">Active learning paths available to you.</p></div>
          <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(120px,0.7fr)_auto] gap-4 border-b border-black/10 bg-black/[0.025] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] opacity-55 dark:border-white/10 dark:bg-white/[0.03] sm:grid"><span>Roadmap</span><span>Target role</span><span>Duration</span><span /></div>
          {filteredRoadmaps.map((roadmap) => <div key={getRoadmapId(roadmap)} className="grid gap-4 border-b border-black/10 px-5 py-5 last:border-b-0 dark:border-white/10 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(120px,0.7fr)_auto] sm:items-center"><div><p className="font-bold">{roadmap.title}</p><p className="mt-1 text-xs opacity-50">{roadmap.roadmapId || "Roadmap"}</p></div><div className="text-sm opacity-75"><span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] opacity-50 sm:hidden">Role</span>{roadmap.targetRole || "—"}</div><div className="text-sm font-semibold"><span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] opacity-50 sm:hidden">Duration</span>{formatDuration(roadmap)}</div><button type="button" onClick={() => openRoadmap(roadmap)} className="dashboard-secondary-btn inline-flex w-fit items-center gap-2 px-4 py-2 text-sm">View <ArrowRight className="h-4 w-4" /></button></div>)}
          {!filteredRoadmaps.length && <div className="px-5 py-14 text-center text-sm opacity-60">No active roadmaps match your search.</div>}
        </section>
      )}
    </div>
  );

  if (hasUser) return <UserSidebarLayout maxWidthClass="max-w-[1220px]">{content}</UserSidebarLayout>;
  return <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] px-5 pt-28 text-[#00113b] dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:text-slate-100 sm:px-8"><div className="mx-auto max-w-[1220px]">{content}</div></div>;
}
