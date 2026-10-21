import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, BookOpen, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { resourceAPI } from "../../services/api";
import Sidebar from "../../components/Dashboard/Sidebar";
import "../hiringPage.css";
import FilterDrawer from "../../components/common/FilterDrawer";
import StateFallback from "../../components/common/StateFallback";

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
  const techStackRows = [];
  const rawTitle = String(roadmap.title || "").trim();
  const title = /^(untitled roadmap|roadmap)$/i.test(rawTitle)
    ? roadmap.targetRole || rawTitle || "Untitled roadmap"
    : rawTitle || roadmap.targetRole || "Untitled roadmap";

  for (let index = 0; index < techStack.length; index += 5) {
    techStackRows.push(techStack.slice(index, index + 5));
  }

  return (
    <div className={`grid min-h-[128px] grid-cols-1 items-start sm:items-center gap-4 sm:gap-5 rounded-[16px] border-0 p-4 sm:px-[26px] sm:py-[22px] transition-all duration-200 lg:grid-cols-[366px_minmax(0,1fr)_250px_172px] lg:gap-0 ${
      isDarkMode
        ? "bg-[#0a1238] text-slate-100 hover:bg-[#101b47] hover:-translate-y-[2px] shadow-sm hover:shadow-md"
        : "bg-[#e2f7ff] text-[#00113b] hover:bg-[#d3f1ff] hover:-translate-y-[2px] shadow-sm hover:shadow-md"
    }`}
    >
      <div className="min-w-0 pr-2">
        <div className={`mb-1 sm:mb-[7px] text-base sm:text-[17px] font-bold leading-snug sm:leading-[1.35] ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          {title}
        </div>
        <div className={`text-xs sm:text-[12px] ${isDarkMode ? "text-[#8d9bc4]" : "text-[#5b6b8a]"}`}>
          {getRoadmapCategory(roadmap)}
        </div>
      </div>

      <div className="min-w-0 pr-2">
        <div className={`mb-1.5 sm:mb-[9px] text-xs sm:text-[17px] font-bold leading-[1.35] uppercase sm:normal-case tracking-wide sm:tracking-normal ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          Tech Stack
        </div>
        <div className="flex flex-col gap-[5px]">
          {techStackRows.map((row, rowIndex) => (
            <div key={`tech-stack-row-${rowIndex}`} className="flex flex-wrap gap-[5px]">
              {row.map((technology, index) => (
                <RoadmapChip
                  key={`${technology}-${rowIndex}-${index}`}
                  label={technology}
                  index={rowIndex * 5 + index}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-baseline sm:block gap-2">
        <div className={`text-base sm:text-[18px] font-bold leading-[1.4] ${isDarkMode ? "text-white" : "text-[#00113b]"}`}>
          {formatRoadmapSalary(roadmap)}
        </div>
        <span className={`text-[10px] font-medium ${isDarkMode ? "text-[#8d9bc4]" : "text-[#5b6b8a]"}`}>
          Estimated Salary
        </span>
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={() => onOpen(roadmap)}
          className="inline-flex min-h-[40px] sm:min-h-[45px] w-full items-center justify-center rounded-[10px] border-none bg-[#89c638] px-[10px] py-[11px] sm:py-[13px] font-['Press_Start_2P'] text-[7px] sm:text-[8px] font-bold leading-[1.5] text-[#17230c] transition-all hover:bg-[#a2dc59] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(137,198,56,0.3)] active:translate-y-0 active:shadow-none"
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
  const [reloadKey, setReloadKey] = useState(0);
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
          if (!nextForYou) {
            setActiveTab("all");
          }
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || "Unable to load roadmaps right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [hasUser, roadmapId, user?.targetRole, reloadKey]);

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

  // Parse checkpoints from detail (using markdown sections or structured curriculum)
  const roadmapCheckpoints = useMemo(() => {
    if (!detail) return [];

    const checkpoints = [];
    const body = detail.markdownBody || "";

    // Split markdown by headings (## or ###) to form checkpoints if present
    const sectionRegex = /^#{2,3}\s+(.+)$/gm;
    let match;
    const matches = [];
    while ((match = sectionRegex.exec(body)) !== null) {
      matches.push({ title: match[1].trim(), index: match.index });
    }

    if (matches.length > 0) {
      matches.forEach((m, idx) => {
        const nextIndex = matches[idx + 1] ? matches[idx + 1].index : body.length;
        const rawContent = body.slice(m.index, nextIndex).replace(/^#{2,3}\s+.+$/m, "").trim();
        const firstPara = rawContent.split("\n\n")[0]?.replace(/[#*`_]/g, "").trim() || detail.description || "";

        const dayNum = idx + 1;
        const levelNum = Math.floor(idx / 7) + 1;
        checkpoints.push({
          day: dayNum,
          title: m.title,
          desc: firstPara || `Master ${m.title} core concepts and hands-on implementation.`,
          level: `Level ${levelNum}`,
        });
      });
    }

    // Fallback if markdown has fewer than 3 sections: generate standard checkpoint progression from techStack and duration
    if (checkpoints.length < 3) {
      const techStack = getRoadmapTechStack(detail);
      const totalDays = Math.max(7, Math.min(60, (detail.duration ? Number(detail.duration) : 10) * (detail.durationUnit === "weeks" ? 5 : 1)));
      
      const topics = techStack.length >= 5 ? techStack : [
        "Web Fundamentals & Setup",
        "Core Concepts & Architecture",
        "Database Persistence & CRUD",
        "REST APIs & Core Frameworks",
        "Authentication & Security",
        "Integration & Testing",
        "Capstone Implementation",
        "Advanced Scaling & Microservices",
        "Cloud Infrastructure & Docker",
        "CI/CD Automation",
        "System Architecture & Deployment",
      ];

      for (let i = 0; i < totalDays; i++) {
        const topic = topics[i % topics.length];
        const day = i + 1;
        const levelNum = Math.floor(i / 7) + 1;
        checkpoints.push({
          day,
          title: (day % 7 === 0) ? `Level ${levelNum} Capstone Project` : `${topic} - Part ${Math.floor(i / topics.length) + 1}`,
          desc: `Understand ${topic} and build hands-on competency tailored for ${detail.targetRole || "engineering roles"}.`,
          level: `Level ${levelNum}`,
        });
      }
    }

    return checkpoints;
  }, [detail]);

  const [activeCheckpointModal, setActiveCheckpointModal] = useState(null);
  const [currentViewLevel, setCurrentViewLevel] = useState("Level 1");
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // SVG curved path calculation
  const updateRoadmapPaths = () => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!svg || !container) return;

    const containerRect = container.getBoundingClientRect();
    const width = container.clientWidth;
    const height = container.scrollHeight;
    if (!width || !height) return;

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;

    // Clear previous paths
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const cards = [...container.querySelectorAll("[data-day][data-level]")]
      .sort((a, b) => Number(a.dataset.day) - Number(b.dataset.day));
    if (cards.length >= 2) {
      const points = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      });

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1];
        const current = points[i];
        const middleY = (previous.y + current.y) / 2;
        d += ` C ${previous.x} ${middleY}, ${current.x} ${middleY}, ${current.x} ${current.y}`;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", isDarkMode ? "#3c83f6" : "#529eff");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-dasharray", "10 6");
      svg.appendChild(path);
    }
  };

  useEffect(() => {
    if (!roadmapId || !detail) return;

    const handleResize = () => requestAnimationFrame(updateRoadmapPaths);
    window.addEventListener("resize", handleResize);

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const levelHeaders = container.querySelectorAll("[data-level-header]");
      if (levelHeaders.length > 0) {
        // Find which level section header or its cards are closest to the upper viewport area
        const triggerY = window.innerHeight * 0.35;
        let activeLevel = "Level 1";

        levelHeaders.forEach((header) => {
          const rect = header.getBoundingClientRect();
          if (rect.top <= triggerY) {
            activeLevel = header.dataset.levelHeader;
          }
        });

        setCurrentViewLevel(activeLevel);
        return;
      }

      // Fallback: Check visible cards
      const cards = container.querySelectorAll("[data-day][data-level]");
      if (cards.length > 0) {
        const triggerY = window.innerHeight * 0.4;
        let activeLevel = "Level 1";

        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          if (rect.top <= triggerY) {
            activeLevel = card.dataset.level;
          }
        });

        setCurrentViewLevel(activeLevel);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const timer = setTimeout(() => {
      updateRoadmapPaths();
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [roadmapId, detail, roadmapCheckpoints, isDarkMode]);

  const detailContent = (
    <div className="w-full relative pb-28">
      {/* Top Left Navigation Back */}
      <button
        type="button"
        onClick={() => navigate("/roadmaps")}
        className="mb-4 md:ml-[calc(32px_-_0.07*(100vw_-_90px))] inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white/40 px-3.5 py-1.5 text-xs font-bold text-[#00113b] shadow-sm backdrop-blur-md transition hover:-translate-x-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-[#8fd9ff] dark:hover:bg-white/10"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Roadmaps</span>
      </button>

      {/* Fixed Current Level Indicator Card (Matching Tanvika's reference).
          Rendered inline (not portaled) so it stays inside the app shell's stacking
          context and the navbar dropdown (z-50) opens above it. */}
      <div
        id="level-indicator"
        style={{ top: "5.5rem" }}
        className="fixed right-4 sm:right-8 z-20 bg-[#002D93] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg flex items-center space-x-2 border border-white/20 backdrop-blur-md"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <div className="flex flex-col text-left">
          <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-blue-200 font-bold">Current</span>
          <span className="text-[9px] sm:text-[10px] text-white" style={{ fontFamily: "'Press Start 2P', monospace" }}>{currentViewLevel}</span>
        </div>
      </div>

      {/* Header Container: scoped so it picks up the same .hiring-title styling as /roadmaps */}
      <div
        className={`hiring-page-container md:ml-[calc(32px_-_0.07*(100vw_-_90px))] ${isDarkMode ? "" : "light-mode"}`}
        style={{ background: "transparent", minHeight: 0 }}
      >
        <header className="hiring-header mb-8 text-left">
          <h1 className="hiring-title">ROADMAP</h1>
        </header>
      </div>


      {loading && <LoadingState label="Loading roadmap details..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && detail && (
        <div className="w-full flex flex-col items-center">
          {/* Curved Roadmap Path Container */}
          <div
            ref={containerRef}
            id="roadmap-container"
            className="w-full max-w-4xl relative flex flex-col items-center space-y-10 sm:space-y-12 py-6"
          >
            {/* SVG Connecting Paths */}
            <svg
              ref={svgRef}
              id="roadmap-svg"
              className="absolute inset-0 w-full pointer-events-none z-0 overflow-visible"
              preserveAspectRatio="none"
              aria-hidden="true"
            />

            {/* Checkpoint Cards */}
            {roadmapCheckpoints.map((item, index) => {
              // Highlight the user's active day, fallback to day 1 if no progress is saved yet
              const activeDayNumber = user?.currentDay || detail?.currentDay || user?.progress?.currentDay || 1;
              const isCurrent = item.day === activeDayNumber;

              let alignmentClass = "self-center mx-auto";
              if (index % 3 === 0) {
                alignmentClass = "self-start ml-2 sm:ml-10";
              } else if (index % 3 === 2) {
                alignmentClass = "self-end mr-2 sm:mr-10";
              }

              const isLevelHeaderNeeded = index === 0 || roadmapCheckpoints[index - 1].level !== item.level;

              return (
                <React.Fragment key={item.day}>
                  {isLevelHeaderNeeded && (
                    <div
                      data-level-header={item.level}
                      style={{ fontFamily: "'Press Start 2P', monospace" }}
                      className="w-full text-left text-xs sm:text-sm text-[#002D93] dark:text-[#8fd9ff] tracking-widest pl-4 sm:pl-12 my-4 z-10 select-none"
                    >
                      {item.level.toUpperCase()}
                    </div>
                  )}

                  <div
                    data-day={String(item.day)}
                    data-level={item.level}
                    onClick={() => setActiveCheckpointModal(item)}
                    className={`w-[68%] max-w-[250px] sm:max-w-md transition-all duration-300 cursor-pointer z-10 ${alignmentClass}`}
                  >
                    {isCurrent ? (
                      <div className="bg-[#002D93] text-white p-3.5 sm:p-5 rounded-xl shadow-xl border-2 border-blue-400 flex items-center justify-between transform hover:scale-105 transition">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                              DAY {item.day}
                            </span>
                            <span className="text-[7px] sm:text-[9px] bg-green-400 text-[#0A192F] font-bold px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-base font-bold text-left">{item.title}</h4>
                        </div>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0 ml-2 sm:ml-3 -rotate-90" />
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#071838] hover:bg-blue-50/80 dark:hover:bg-[#0a214d] text-[#002D93] dark:text-white p-3.5 sm:p-5 rounded-xl shadow-md border border-blue-100 dark:border-white/10 flex items-center justify-between transform hover:scale-105 transition">
                        <div>
                          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1 text-left">
                            DAY {item.day}
                          </span>
                          <h4 className="text-xs sm:text-base font-bold text-left">{item.title}</h4>
                        </div>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#002D93] dark:text-blue-300 flex-shrink-0 ml-2 sm:ml-3 opacity-70 -rotate-90" />
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Modal (Matching Tanvika's reference design) */}
      {activeCheckpointModal && (
        <div
          onClick={() => setActiveCheckpointModal(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#081533] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl transform transition-all border border-blue-100 dark:border-white/15 relative text-left"
          >
            <button
              onClick={() => setActiveCheckpointModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#002D93] dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs font-bold text-[#002D93] dark:text-[#7fb1ff] tracking-wider uppercase mb-1">
              DAY {activeCheckpointModal.day}
            </div>

            <h3 className="text-xl font-bold text-[#002D93] dark:text-white mb-3">
              {activeCheckpointModal.title}
            </h3>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
              {activeCheckpointModal.desc}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#002D93] dark:text-blue-300 rounded-md">
                {activeCheckpointModal.level}
              </span>

              <button
                onClick={() => setActiveCheckpointModal(null)}
                className="px-5 py-2 bg-[#002D93] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !detail && <ErrorState message="This roadmap is no longer available." />}
    </div>
  );

  const listContent = (
    <>
      <header className="hiring-header">
        <div className="eyebrow">TECHLEARN</div>
        <h1 className="hiring-title">ROADMAPS</h1>
        <p className="hiring-subtitle">Opportunities matched to your career goals.</p>
      </header>

      {/* SEARCH, SORTING AND FILTERS IN A SINGLE ROW (same size and colours as Hiring) */}
      <div className="hiring-controls-container" style={{ marginBottom: 16 }}>
        <div className="hiring-controls-row">
          <div className="search-wrapper">
            <span className="search-icon" aria-hidden="true"><Search className="w-4 h-4" /></span>
            <input
              id="roadmapSearchInput"
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search roadmaps, skills, roles or companies..."
              aria-label="Search roadmaps"
            />
          </div>

          <div className="relative inline-flex items-center">
            <select
              aria-label="Sort roadmaps"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="filter-button-control roadmap-sort appearance-none pr-8 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="duration">Shortest</option>
              <option value="title">A–Z</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 w-3.5 h-3.5 opacity-60 text-current" />
          </div>

          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={`filter-button-control ${selectedFilterCount ? "active" : ""}`}
            aria-expanded={filterDrawerOpen}
          >
            <span>Filters</span>
            {selectedFilterCount ? <span className="active-dot"></span> : null}
          </button>
        </div>
      </div>

      {/* FOR YOU / ALL ROADMAPS TOGGLE & CATEGORIES */}
      <div className="mb-5 sm:mb-6 space-y-3">
        <div className="tl-tabs">
          {[{ id: "for-you", label: "For You" }, { id: "all", label: "All Roadmaps" }].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`tl-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex max-w-full gap-1.5 sm:gap-[7px] overflow-x-auto scrollbar-none pb-1">
          {roadmapCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap rounded-[100px] border px-3 sm:px-[13px] py-1.5 sm:py-[8px] text-[10px] transition-colors ${
                activeCategory === category.id
                  ? isDarkMode ? "border-[#b2e96a] bg-[#b2e96a] font-bold text-[#0a1128]" : "border-[#00113b] bg-[#00113b] font-semibold text-white shadow-sm"
                  : isDarkMode ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-[#c6e0e6] bg-[#def0f4] text-[#00113b] shadow-xs hover:bg-[#e8f6f8]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <section id="roadmapsView">
        {loading ? (
          <div className="py-[70px] text-center text-slate-500"><p className="text-[14px]">Loading roadmaps...</p></div>
        ) : error ? (
          <StateFallback state="unavailable" onAction={() => setReloadKey((key) => key + 1)} />
        ) : visibleRoadmaps.length === 0 && (searchQuery.trim() || selectedFilterCount > 0) ? (
          <StateFallback
            state="no-matches"
            onAction={() => {
              setSearchQuery("");
              clearFilters();
            }}
          />
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
          <div className="flex flex-col gap-3 sm:gap-[12px]">
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
    <div className={`min-h-screen font-sans antialiased ${isDarkMode ? "text-white" : "text-[#080830]"}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-300 ${isDarkMode ? "bg-[#000b36]" : "bg-[#ceeefd]"}`} />

      {/* Logged-in learners get the dashboard sidebar here too */}
      {hasUser && <Sidebar />}

      {roadmapId ? (
        <main className={`min-h-screen w-full ${hasUser ? "md:pl-[90px]" : ""}`}>
          <div className="mx-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] lg:w-[86%] max-w-none px-0 pb-16 pt-20 sm:pt-28">
            {detailContent}
          </div>
        </main>
      ) : (
        <main className="min-h-screen w-full">
          <div
            className={`hiring-page-container ${isDarkMode ? "" : "light-mode"} ${hasUser ? "has-sidebar" : ""}`}
            style={{ background: "transparent", minHeight: 0 }}
          >
            <div className="page">{listContent}</div>
          </div>
        </main>
      )}

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        groups={[
          { id: "category", label: "Roadmap type", type: "radio", defaultValue: "all", options: roadmapCategories.map((c) => ({ value: c.id, label: c.label })) },
          { id: "duration", label: "Duration", type: "radio", defaultValue: "all", options: durationFilters.map((d) => ({ value: d.id, label: d.label })) },
        ]}
        applied={{ category: activeCategory, duration: durationFilter }}
        onApply={(values) => {
          setActiveCategory(values.category || "all");
          setDurationFilter(values.duration || "all");
          setFilterDrawerOpen(false);
        }}
        onClear={clearFilters}
        description="Find the right roadmap for your learning goals."
      />
    </div>
  );
}


