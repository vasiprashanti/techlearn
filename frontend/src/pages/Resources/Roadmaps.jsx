import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, BookOpen, Loader2, Search, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { resourceAPI } from "../../services/api";

const unwrap = (payload) => payload?.data ?? payload;

const getRoadmapId = (roadmap) => roadmap?.id || roadmap?._id;

const formatDuration = (roadmap) => {
  if (roadmap?.durationLabel) {
    return String(roadmap.durationLabel).replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  if (!roadmap?.duration || !roadmap?.durationUnit) return "Duration not set";

  const duration = Number(roadmap.duration);
  const unit = String(roadmap.durationUnit).replace(/s$/, "");
  return `${duration} ${unit}${duration === 1 ? "" : "s"}`.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const extractRoadmapList = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload?.roadmaps)) return payload.roadmaps;
  return [];
};

const roadmapCategories = [
  { id: "all", label: "All Roadmaps" },
  { id: "Skill Based", label: "Skill Based" },
  { id: "Role Based", label: "Role Based" },
  { id: "Company Based", label: "Company Based" },
];

const durationFilters = [
  { id: "all", label: "Any duration" },
  { id: "short", label: "4 weeks or less" },
  { id: "medium", label: "5–12 weeks" },
  { id: "long", label: "13+ weeks" },
];

// These are the same pastel values used for the Jobs page's work-mode and
// job-type tags. Roadmap technologies use the palette by position because the
// roadmap API does not require a fixed technology taxonomy.
const roadmapChipClasses = [
  "bg-[#e6f2ff] text-[#3d638c]",
  "bg-[#eee7ff] text-[#6c5b93]",
  "bg-[#e4f5e9] text-[#347555]",
  "bg-[#fff0d7] text-[#95672a]",
  "bg-[#def2f3] text-[#347678]",
  "bg-[#f2e3f5] text-[#855387]",
  "bg-[#e4efff] text-[#3f6390]",
  "bg-[#ffe4e5] text-[#a25e62]",
];

const technologyMatchers = [
  ["HTML", /\bhtml\b/i],
  ["CSS", /\bcss\b/i],
  ["JavaScript", /\bjavascript\b/i],
  ["TypeScript", /\btypescript\b/i],
  ["React", /\breact\b/i],
  ["Node.js", /\bnode(?:\.js|js)\b/i],
  ["MongoDB", /\bmongodb\b/i],
  ["SQL", /\bsql\b/i],
  ["Python", /\bpython\b/i],
  ["Java", /\bjava\b/i],
  ["Git", /\bgit\b/i],
  ["API", /\b(?:rest\s*)?apis?\b|\bhttp\b/i],
  ["AI", /\bartificial intelligence\b|\bmachine learning\b|\bgenerative ai\b/i],
  ["Projects", /\bproject(?:s)?\b|\bcapstone\b/i],
];

const roleStackDefaults = [
  {
    matcher: /full[- ]?stack/i,
    labels: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"],
  },
  {
    matcher: /front[- ]?end/i,
    labels: ["HTML", "CSS", "JavaScript", "React", "Git"],
  },
];

const toLabels = (value) => {
  if (!value) return [];

  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,|\n]/)
      : [value];

  return values
    .map((entry) => {
      if (entry && typeof entry === "object") return entry.name || entry.label || entry.title || "";
      return String(entry || "");
    })
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const getRoadmapCategory = (roadmap) => {
  const rawCategory = String(
    roadmap?.category || roadmap?.roadmapType || roadmap?.type || roadmap?.kind || ""
  ).toLowerCase();

  if (rawCategory.includes("skill")) return "Skill Based";
  if (rawCategory.includes("company")) return "Company Based";
  return "Role Based";
};

const getRoadmapTechStack = (roadmap) => {
  const explicitStack = toLabels(
    roadmap?.techStack || roadmap?.technologies || roadmap?.skills || roadmap?.tags
  );

  const roadmapText = [
    roadmap?.title,
    roadmap?.targetRole,
    roadmap?.description,
    roadmap?.markdownBody,
  ].filter(Boolean).join(" ");

  const roleDefaultStack = roleStackDefaults.find(({ matcher }) => matcher.test(roadmapText))?.labels || [];

  if (explicitStack.length) {
    return [...new Set([...roleDefaultStack, ...explicitStack])].slice(0, 7);
  }

  const inferredStack = technologyMatchers
    .filter(([, matcher]) => matcher.test(roadmapText))
    .map(([label]) => label);

  const fallbackStack = [roadmap?.targetRole || "Core skills", "Projects"];
  return [...new Set([...inferredStack, ...roleDefaultStack, ...fallbackStack])].slice(0, 7);
};

const getRoadmapLevel = (roadmap) => {
  const value = roadmap?.experienceLevel || roadmap?.level || roadmap?.difficulty;
  if (!value || typeof value === "object") return "";
  return String(value).trim();
};

const getRoadmapStackChips = (roadmap) => {
  const chips = [...getRoadmapTechStack(roadmap)];
  const level = getRoadmapLevel(roadmap);
  const duration = formatDuration(roadmap);

  if (level) chips.push(level);
  if (duration !== "Duration not set") chips.push(duration);

  return [...new Set(chips)].slice(0, 9);
};

const formatRoadmapSalary = (roadmap) => {
  const value = roadmap?.estimatedSalary ?? roadmap?.salaryRange ?? roadmap?.salary;
  if (value && typeof value === "object") {
    const minimum = value.min ?? value.minimum ?? value.from;
    const maximum = value.max ?? value.maximum ?? value.to;
    if (minimum !== undefined && maximum !== undefined) return `₹${minimum}–${maximum} LPA`;
    if (minimum !== undefined) return `₹${minimum} LPA`;
  }

  return value ? String(value) : "—";
};

const durationInWeeks = (roadmap) => {
  const duration = Number(roadmap?.duration);
  if (!Number.isFinite(duration)) return null;

  const unit = String(roadmap?.durationUnit || "").toLowerCase();
  if (unit.startsWith("day")) return duration / 7;
  if (unit.startsWith("month")) return duration * 4;
  return duration;
};

const filterRoadmaps = (roadmaps, { searchQuery, activeCategory, durationFilter, sortBy }) => {
  const query = searchQuery.trim().toLowerCase();
  const filtered = roadmaps.filter((roadmap) => {
    const techStack = getRoadmapTechStack(roadmap);
    const searchableText = [
      roadmap?.title,
      roadmap?.targetRole,
      roadmap?.description,
      getRoadmapCategory(roadmap),
      ...techStack,
    ].filter(Boolean).join(" ").toLowerCase();

    if (query && !searchableText.includes(query)) return false;
    if (activeCategory !== "all" && getRoadmapCategory(roadmap) !== activeCategory) return false;

    const weeks = durationInWeeks(roadmap);
    if (durationFilter === "short" && (weeks === null || weeks > 4)) return false;
    if (durationFilter === "medium" && (weeks === null || weeks < 5 || weeks > 12)) return false;
    if (durationFilter === "long" && (weeks === null || weeks < 13)) return false;

    return true;
  });

  return [...filtered].sort((first, second) => {
    if (sortBy === "title") return String(first?.title || "").localeCompare(String(second?.title || ""));
    if (sortBy === "duration") return (durationInWeeks(first) || Number.MAX_SAFE_INTEGER) - (durationInWeeks(second) || Number.MAX_SAFE_INTEGER);

    return new Date(second?.updatedAt || second?.createdAt || 0).getTime()
      - new Date(first?.updatedAt || first?.createdAt || 0).getTime();
  });
};

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-5 mt-8 text-3xl font-black tracking-tight text-[#00113b] dark:text-[#e3f4ff]">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-8 text-2xl font-bold tracking-tight text-[#00113b] dark:text-[#d7efff]">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-bold text-[#00113b] dark:text-[#c5e7ff]">{children}</h3>,
  p: ({ children }) => <p className="mb-5 text-[15px] leading-8 text-[#00113b]/75 dark:text-[#b9d6ed]">{children}</p>,
  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 text-[#00113b]/75 dark:text-[#b9d6ed]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6 text-[#00113b]/75 dark:text-[#b9d6ed]">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7 marker:text-[#3c83f6]">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-6 rounded-[14px] border-l-4 border-[#3c83f6] bg-[#3c83f6]/10 px-5 py-4 dark:bg-[#3c83f6]/15">{children}</blockquote>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#2563eb] underline underline-offset-4 dark:text-[#8fd3ff]">{children}</a>,
  code: ({ inline, children }) => (
    inline
      ? <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
      : <code className="font-mono text-sm">{children}</code>
  ),
  pre: ({ children }) => <pre className="my-6 overflow-x-auto rounded-[14px] bg-[#071831] p-5 text-sm leading-6 text-slate-100 shadow-lg">{children}</pre>,
  hr: () => <hr className="my-8 border-black/10 dark:border-white/10" />,
};

const LoadingState = ({ label = "Loading roadmaps..." }) => (
  <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
    <Loader2 className="h-5 w-5 animate-spin text-[#3c83f6]" />
    {label}
  </div>
);

const ErrorState = ({ message }) => (
  <div className="flex items-start gap-3 rounded-[14px] border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-200">
    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
    <span>{message}</span>
  </div>
);

const RoadmapChip = ({ label, index }) => (
  <span className={`inline-flex items-center rounded-[6px] px-[9px] py-[5px] text-[10px] font-bold whitespace-nowrap ${roadmapChipClasses[index % roadmapChipClasses.length]}`}>
    {label}
  </span>
);

function RoadmapRow({ roadmap, isDarkMode, onOpen }) {
  const techStack = getRoadmapStackChips(roadmap);
  const rawTitle = String(roadmap.title || "").trim();
  const title = /^(untitled roadmap|roadmap)$/i.test(rawTitle)
    ? roadmap.targetRole || rawTitle || "Untitled roadmap"
    : rawTitle || roadmap.targetRole || "Untitled roadmap";

  return (
    <div className={`grid min-h-[128px] grid-cols-1 items-center gap-5 rounded-[15px] border px-[26px] py-[22px] transition-all duration-200 lg:grid-cols-[365px_minmax(0,1fr)_250px_172px] lg:gap-0 ${
      isDarkMode
        ? "border-white/10 bg-white/5 hover:-translate-y-[1px] hover:border-white/20 hover:bg-white/10"
        : "border-[#c5dfe6] bg-[#d9eef3] shadow-sm hover:-translate-y-[1px] hover:border-[#00113b]/20 hover:bg-[#e0f2f5] hover:shadow-md"
    }`}
    >
      <div className="min-w-0 pr-2">
        <div className={`mb-[7px] truncate text-[17px] font-bold leading-[1.35] ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          {title}
        </div>
        <div className={`truncate text-[12px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          {getRoadmapCategory(roadmap)}
        </div>
      </div>

      <div className="min-w-0 pr-2">
        <div className={`mb-[9px] text-[17px] font-bold leading-[1.35] ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          Tech Stack
        </div>
        <div className="flex flex-wrap gap-[5px]">
          {techStack.map((technology, index) => (
            <RoadmapChip key={`${technology}-${index}`} label={technology} index={index} />
          ))}
        </div>
      </div>

      <div>
        <div className={`text-[18px] font-bold leading-[1.4] ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          {formatRoadmapSalary(roadmap)}
        </div>
        <span className={`mt-[3px] block text-[10px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          Estimated Salary
        </span>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onOpen(roadmap)}
          className="inline-flex min-h-[45px] w-full items-center justify-center rounded-[8px] border-none bg-[#b2e96a] px-[10px] py-[13px] font-['Press_Start_2P'] text-[8px] font-bold leading-[1.5] text-[#0a1128] transition-all hover:-translate-y-[2px] hover:shadow-[0_5px_0_rgba(0,17,59,0.15)] active:translate-y-0 active:shadow-none"
        >
          SHOW ROADMAP
        </button>
      </div>
    </div>
  );
}

export default function Roadmaps() {
  const { theme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const isDarkMode = theme === "dark";
  const hasUser = Boolean(!authLoading && isAuthenticated && user);

  const [activeTab, setActiveTab] = useState("for-you");
  const [activeCategory, setActiveCategory] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [forYouRoadmap, setForYouRoadmap] = useState(null);
  const [publishedRoadmaps, setPublishedRoadmaps] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setActiveTab("all");
  }, [authLoading, isAuthenticated]);

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
  }, [hasUser, roadmapId, user?.targetRole]);

  const filterOptions = useMemo(
    () => ({ searchQuery, activeCategory, durationFilter, sortBy }),
    [activeCategory, durationFilter, searchQuery, sortBy]
  );
  const filteredRoadmaps = useMemo(
    () => filterRoadmaps(publishedRoadmaps, filterOptions),
    [filterOptions, publishedRoadmaps]
  );
  const filteredForYouRoadmaps = useMemo(
    () => filterRoadmaps(forYouRoadmap ? [forYouRoadmap] : [], filterOptions),
    [filterOptions, forYouRoadmap]
  );
  const visibleRoadmaps = activeTab === "for-you" ? filteredForYouRoadmaps : filteredRoadmaps;
  const selectedFilterCount = Number(activeCategory !== "all") + Number(durationFilter !== "all");

  const openRoadmap = (roadmap) => {
    const id = getRoadmapId(roadmap);
    if (id) navigate(`/roadmaps/${id}`);
  };

  const clearFilters = () => {
    setActiveCategory("all");
    setDurationFilter("all");
    setFilterDrawerOpen(false);
  };

  const detailContent = (
    <div className="space-y-6 pb-12">
      <button
        type="button"
        onClick={() => navigate("/roadmaps")}
        className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white/40 px-4 py-2 text-xs font-bold text-[#00113b] shadow-sm backdrop-blur-md transition hover:-translate-x-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-[#8fd9ff] dark:hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Roadmaps</span>
      </button>

      {loading && <LoadingState label="Loading roadmap details..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && detail && (
        <article className={`overflow-hidden rounded-[14px] border shadow-xl shadow-[#3c83f6]/5 ${isDarkMode ? "border-white/10 bg-[#071a39]/85" : "border-white/80 bg-white/70"}`}>
          <header className="border-b border-white/15 bg-gradient-to-br from-[#3c83f6] to-[#6366f1] px-6 py-8 text-white sm:px-10 sm:py-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">Roadmap learning path</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{detail.title}</h1>
            <div className="mt-5 flex flex-wrap gap-2">
              {[getRoadmapCategory(detail), detail.targetRole || "Target role", formatDuration(detail)].map((label) => (
                <span key={label} className="rounded-[8px] bg-white/15 px-3 py-1.5 text-sm font-semibold">{label}</span>
              ))}
            </div>
          </header>

          <div className="px-6 py-8 sm:px-10">
            <div className="mb-8 flex flex-wrap gap-[5px]">
              {getRoadmapTechStack(detail).map((technology, index) => (
                <RoadmapChip key={`${technology}-${index}`} label={technology} index={index} />
              ))}
            </div>
            {detail.description && <p className="mb-8 max-w-3xl text-lg leading-8 opacity-75">{detail.description}</p>}
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {detail.markdownBody || "No roadmap content is available yet."}
              </ReactMarkdown>
            </div>
          </div>
        </article>
      )}
      {!loading && !error && !detail && <ErrorState message="This roadmap is no longer available." />}
    </div>
  );

  const listContent = (
    <>
      <header className="mb-[34px]">
        <h1 className={`font-['Press_Start_2P'] text-[28px] leading-[1.35] tracking-[-1px] sm:text-[32px] ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          Roadmaps
        </h1>
        <p className={`mt-[10px] text-[15px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          Opportunities matched to your career goals.
        </p>
      </header>

      <div className={`mb-[29px] flex h-[62px] w-full items-center rounded-[13px] border px-[20px] transition-colors ${isDarkMode ? "border-white/10 bg-white/5 text-white focus-within:border-white/20 focus-within:bg-white/10" : "border-[#c4dfe6] bg-[#def0f4] text-[#00113b] shadow-sm focus-within:border-[#00113b]/30 focus-within:bg-[#e5f4f7]"}`}>
        <Search className={`mr-[12px] h-5 w-5 shrink-0 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
        <input
          id="roadmapSearchInput"
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search roadmaps, skills, roles or companies..."
          className={`w-full border-none bg-transparent text-[13px] outline-none placeholder:text-slate-400 ${isDarkMode ? "text-white" : "text-[#00113b]"}`}
        />
      </div>

      <div className={`mb-[20px] flex items-center gap-[7px] border-b ${isDarkMode ? "border-white/10" : "border-[#00113b]/15"}`}>
        {[{ id: "for-you", label: "For You" }, { id: "all", label: "All Roadmaps" }].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-[1px] cursor-pointer border-b-2 px-[14px] py-[11px] text-[11px] font-bold transition-colors ${
              activeTab === tab.id
                ? isDarkMode ? "border-white text-white" : "border-[#00113b] text-[#00113b]"
                : isDarkMode ? "border-transparent text-slate-400 hover:text-white" : "border-transparent text-slate-500 hover:text-[#00113b]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-[28px] flex flex-wrap items-center justify-between gap-[15px] md:flex-nowrap">
        <div className="flex max-w-full gap-[7px] overflow-x-auto scrollbar-none">
          {roadmapCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap rounded-[100px] border px-[13px] py-[9px] text-[10px] transition-colors ${
                activeCategory === category.id
                  ? isDarkMode ? "border-[#b2e96a] bg-[#b2e96a] font-bold text-[#0a1128]" : "border-[#00113b] bg-[#00113b] font-semibold text-white shadow-sm"
                  : isDarkMode ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-[#c6e0e6] bg-[#def0f4] text-[#00113b] shadow-xs hover:bg-[#e8f6f8]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[8px] sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={`flex h-[42px] cursor-pointer items-center gap-1.5 rounded-[8px] border px-[12px] text-[10px] transition-colors ${
              selectedFilterCount
                ? isDarkMode ? "border-[#b2e96a] bg-[#b2e96a]/20 font-bold text-[#b2e96a]" : "border-[#00113b] bg-[#00113b] font-bold text-white shadow-sm"
                : isDarkMode ? "border-white/10 bg-white/5 text-white hover:bg-white/15" : "border-[#c6e0e6] bg-[#def0f4] text-[#00113b] shadow-xs hover:bg-[#e8f6f8]"
            }`}
          >
            Filters{selectedFilterCount ? " •" : ""}
          </button>

          <select
            aria-label="Sort roadmaps"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className={`h-[42px] cursor-pointer rounded-[8px] border pl-[10px] pr-[28px] text-[10px] outline-none transition-colors ${isDarkMode ? "border-white/10 bg-[#071532] text-white" : "border-[#c6e0e6] bg-[#def0f4] text-[#00113b] shadow-xs hover:bg-[#e8f6f8]"}`}
          >
            <option value="newest">Newest</option>
            <option value="duration">Shortest</option>
            <option value="title">A–Z</option>
          </select>
        </div>
      </div>

      <section id="roadmapsView">
        {loading ? (
          <div className="py-[70px] text-center text-slate-500"><p className="text-[14px]">Loading roadmaps...</p></div>
        ) : error ? (
          <div className="py-[70px] text-center text-red-500"><p className="text-[14px] font-semibold">{error}</p></div>
        ) : visibleRoadmaps.length === 0 ? (
          <div className="py-[70px] text-center text-slate-500">
            <BookOpen className={`mx-auto mb-4 h-9 w-9 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
            <h3 className={`mb-[7px] text-[16px] font-bold ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
              {activeTab === "for-you" && !hasUser ? "Personalized For You" : activeTab === "for-you" ? "No roadmap available" : "No matching roadmaps"}
            </h3>
            <p className="mx-auto mb-4 max-w-md text-[12px]">
              {activeTab === "for-you" && !hasUser
                ? "Log in or sign up to get a roadmap tailored to your target role."
                : activeTab === "for-you"
                  ? "No personalized roadmap matches these filters. Try All Roadmaps to explore every active path."
                  : "Try changing your search or filters."}
            </p>
            {activeTab === "for-you" && !hasUser && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-[8px] bg-[#b2e96a] px-5 py-2.5 font-['Press_Start_2P'] text-[8px] font-bold text-[#0a1128] shadow-md transition-all hover:bg-[#a6e257]"
              >
                Sign In to Personalize
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {visibleRoadmaps.map((roadmap) => (
              <RoadmapRow
                key={getRoadmapId(roadmap) || roadmap.title}
                roadmap={roadmap}
                isDarkMode={isDarkMode}
                onOpen={openRoadmap}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className={`min-h-screen font-sans antialiased ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-300 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-[#d6eef4]"}`} />

      <main className="min-h-screen w-full">
        <div className="mx-auto w-[calc(100%-2rem)] max-w-none px-0 pb-16 pt-[64px] sm:w-[calc(100%-3rem)] lg:w-[86%]">
          {roadmapId ? detailContent : listContent}
        </div>
      </main>

      <div
        onClick={() => setFilterDrawerOpen(false)}
        className={`fixed inset-0 z-[150] bg-black/40 backdrop-blur-xs transition-opacity duration-250 ${filterDrawerOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
      />
      <aside
        aria-label="Roadmap filters"
        className={`fixed bottom-0 right-0 top-0 z-[160] flex w-[390px] max-w-[90%] flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isDarkMode ? "bg-[#0b1934] text-white" : "bg-[#daf0fa] text-[#00113b]"} ${filterDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-black/10 p-[22px] dark:border-white/10">
          <h3 className="font-['Press_Start_2P'] text-[11px] leading-[1.6]">Filters</h3>
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(false)}
            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[7px] border-none bg-white/60 text-[18px] text-[#00113b] shadow-xs dark:bg-white/10 dark:text-white"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-[27px] overflow-y-auto p-[22px]">
          <div>
            <h4 className="mb-[11px] text-[10px] font-bold uppercase tracking-[1px]">Roadmap type</h4>
            {roadmapCategories.map((category) => (
              <label key={category.id} className="flex cursor-pointer items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300">
                <input
                  type="radio"
                  name="roadmap-category"
                  checked={activeCategory === category.id}
                  onChange={() => setActiveCategory(category.id)}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {category.label}
              </label>
            ))}
          </div>

          <div>
            <h4 className="mb-[11px] text-[10px] font-bold uppercase tracking-[1px]">Duration</h4>
            {durationFilters.map((duration) => (
              <label key={duration.id} className="flex cursor-pointer items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300">
                <input
                  type="radio"
                  name="roadmap-duration"
                  checked={durationFilter === duration.id}
                  onChange={() => setDurationFilter(duration.id)}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {duration.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className={`rounded-[8px] border px-4 py-2 text-[10px] font-bold transition ${isDarkMode ? "border-white/15 text-white hover:bg-white/10" : "border-[#00113b]/20 text-[#00113b] hover:bg-white/60"}`}
          >
            Clear filters
          </button>
        </div>
      </aside>
    </div>
  );
}
