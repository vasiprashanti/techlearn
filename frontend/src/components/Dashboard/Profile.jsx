import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/client";
import ScrollProgress from "../../components/ScrollProgress";
import UserSidebarLayout from "./UserSidebarLayout";
import { FiEdit2, FiChevronDown } from "react-icons/fi";
import "./Profile.css";

const AVATAR_COUNT = 8;
const AVATAR_PATH = "/profile_avatars";
const DEFAULT_AVATAR = `${AVATAR_PATH}/default-avatar.png`;
const avatarUrls = [DEFAULT_AVATAR, ...Array.from({ length: AVATAR_COUNT }, (_, i) => `${AVATAR_PATH}/nobackgroundavatar${i + 1}.png`)];

// Always show the background-free artwork; fall back to the default avatar.
const resolveAvatar = (url) => {
  if (!url || !String(url).includes("/profile_avatars/")) return DEFAULT_AVATAR;
  return String(url).replace("/profile_avatars/avatar", "/profile_avatars/nobackgroundavatar");
};

const SKILL_CATALOG = ["C / C++", "Java", "Python", "JavaScript", "Web Development", "DSA", "SQL", "AI/ML", "Generative AI", "Aptitude", "Other"];
const COMPANY_CATALOG = ["TCS", "Infosys", "Accenture", "Wipro", "Cognizant", "Capgemini", "Amazon", "Deloitte", "Microsoft", "Google", "IBM", "Tech Mahindra", "HCLTech", "Oracle", "Other"];
const ROLE_OPTIONS = ["Software Developer", "Java Developer", "Full Stack Developer", "Python Developer", "Data Analyst", "QA / Test Engineer", "Other"];
const DEGREES = ["B.Tech / B.E.", "BCA", "B.Sc.", "MCA", "M.Tech / M.E.", "MBA", "B.Com.", "Other"];
const LEVELS = ["Beginner", "Basic", "Intermediate", "Advanced"];
const DELETE_REASONS = ["I'm not using TechLearn", "I'm switching to another platform", "I'm having technical issues", "Privacy concerns", "Other"];

const normalizeName = (value) => {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  return (SKILL_CATALOG.concat(COMPANY_CATALOG)).find((s) => s.toLowerCase() === clean.toLowerCase()) || clean;
};
const normalizeList = (list) => {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((item) => {
    const name = normalizeName(item);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  });
  return out;
};

const apiError = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const formatDob = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
};

/* ---------- Single-select dropdown (shows at most 7 rows, then scrolls) ---------- */
function SelectField({ id, value, onChange, options, placeholder = "Select", ariaLabel }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const label = selected ? selected.label : value !== "" && value != null ? String(value) : "";

  return (
    <div className="select-wrap" ref={wrapRef} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <button type="button" id={id} className="skill-trigger select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        <span className={label ? "" : "select-placeholder"}>{label || placeholder}</span>
        <span className="trigger-icons"><FiChevronDown size={18} aria-hidden="true" className={open ? "flip" : ""} /></span>
      </button>
      {open && (
        <ul className="select-list" role="listbox">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <li key={option.value}>
                <button type="button" role="option" aria-selected={isSelected} className={`select-option ${isSelected ? "selected" : ""}`}
                  onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Multi-select picker (skills / companies) ---------- */
function ChipPicker({ id, label, placeholder, catalog, values, onChange, addPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const options = normalizeList([...catalog, ...values]);
  const has = (item) => values.some((v) => v.toLowerCase() === item.toLowerCase());
  const toggle = (item) => onChange(has(item) ? values.filter((v) => v.toLowerCase() !== item.toLowerCase()) : normalizeList([...values, item]));
  const addCustom = () => {
    const name = normalizeName(custom);
    if (!name) return;
    onChange(normalizeList([...values, name]));
    setCustom("");
  };

  return (
    <div className="field full" ref={wrapRef}>
      <label htmlFor={`${id}-trigger`}>{label}</label>
      <button className="skill-trigger" id={`${id}-trigger`} type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="skill-trigger-content">
          {values.length ? values.map((v) => <span className="skill-summary-chip" key={v}>{v}</span>) : placeholder}
        </span>
        <span className="trigger-icons">
          {values.length > 0 && <FiEdit2 size={15} aria-hidden="true" />}
          <FiChevronDown size={18} aria-hidden="true" className={open ? "flip" : ""} />
        </span>
      </button>
      {open && (
        <div className="skill-picker">
          <div className="skill-picker-heading">Select all that apply</div>
          <div className="skill-options">
            {options.map((item) => (
              <button key={item} type="button" className="skill-option" aria-pressed={has(item)} onClick={() => toggle(item)}>{item}</button>
            ))}
          </div>
          <div className="skill-add">
            <input
              value={custom}
              placeholder={addPlaceholder}
              aria-label={addPlaceholder}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            />
            <button className="small-button" type="button" onClick={addCustom}>+ Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- College picker with "Add College +" ---------- */
function CollegePicker({ value, locked, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(!value);
  const wrapRef = useRef(null);

  useEffect(() => { setEditing(!value); }, [value]);

  useEffect(() => {
    if (!editing || !open) return undefined;
    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get("/api/colleges/search", { params: { q: query.trim() } });
        setResults(data.colleges || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, editing]);

  useEffect(() => {
    const close = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const choose = (college, note = "") => {
    onChange({ id: college.id, name: college.name });
    setQuery("");
    setSuggestion(null);
    setOpen(false);
    setMessage(note);
  };

  const resolve = async (confirmNew = false) => {
    const name = query.trim();
    if (!name) return;
    setBusy(true);
    setMessage("");
    try {
      const { data } = await API.post("/api/colleges/resolve", { name, confirmNew });
      if (data.action === "existing") choose(data.college, "This college is already in our list, so we selected it for you.");
      else if (data.action === "suggest") { setSuggestion(data.college); setOpen(false); }
      else choose(data.college, "College added to the list.");
    } catch (error) {
      setMessage(apiError(error, "Could not add the college."));
    } finally {
      setBusy(false);
    }
  };

  const typed = query.trim();
  const exactInResults = results.some((c) => c.name.toLowerCase() === typed.toLowerCase());

  return (
    <div className="field full" ref={wrapRef}>
      <label htmlFor="college-input">College / Institution</label>
      {value && !editing ? (
        <div className="college-chip">
          <strong>{value.name}</strong>
          {!locked && (
            <button className="icon-edit" type="button" aria-label="Edit college" title="Edit college" onClick={() => setEditing(true)}>
              <FiEdit2 size={15} />
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            id="college-input"
            autoComplete="off"
            placeholder="Search your college, or add a new one"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setSuggestion(null); setOpen(true); }}
          />
          {open && (
            <div className="college-list" role="listbox">
              {results.map((college) => (
                <button key={college.id} type="button" className="college-option" onClick={() => choose(college)}>
                  {college.name}{college.city ? ` · ${college.city}` : ""}
                </button>
              ))}
              {typed.length >= 3 && !exactInResults && (
                <button type="button" className="college-option add" disabled={busy} onClick={() => resolve(false)}>
                  {busy ? "Checking…" : `Add College +  “${typed}”`}
                </button>
              )}
              {results.length === 0 && typed.length < 3 && <div className="college-option">Type at least 3 letters to search</div>}
            </div>
          )}
          {suggestion && (
            <div className="college-suggest" role="status">
              Did you mean <strong>{suggestion.name}</strong>? It's already in our list.
              <div className="row">
                <button className="button button-primary" type="button" onClick={() => choose(suggestion, "Selected the existing college.")}>Yes, use {suggestion.name}</button>
                <button className="button" type="button" onClick={() => resolve(true)}>No, add mine</button>
              </div>
            </div>
          )}
          {value && <button className="small-button" type="button" style={{ marginTop: 8 }} onClick={() => { setEditing(false); setQuery(""); }}>Cancel</button>}
        </>
      )}
      {message && <span className="field-hint">{message}</span>}
    </div>
  );
}

/* ---------- Date of birth picker ---------- */
function DobPicker({ value, onChange }) {
  // Users must be at least 18: nothing after today's day and month in (this year - 18) can be chosen.
  const maxDob = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return new Date(t.getFullYear() - 18, t.getMonth(), t.getDate());
  }, []);
  const maxYear = maxDob.getFullYear();
  const [open, setOpen] = useState(false);
  const startMonth = () => {
    const base = value ? new Date(`${value}T00:00:00`) : maxDob;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  };
  const [month, setMonth] = useState(startMonth);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthNames = Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleDateString(undefined, { month: "long" }));
  const lastMonth = month.getFullYear() === maxYear ? maxDob.getMonth() : 11;
  const monthOptions = monthNames.slice(0, lastMonth + 1).map((name, m) => ({ value: m, label: name }));
  const yearOptions = Array.from({ length: maxYear - 1899 }, (_, i) => ({ value: maxYear - i, label: String(maxYear - i) }));

  const pickYear = (y) => {
    const year = Number(y);
    const cap = year === maxYear ? maxDob.getMonth() : 11;
    setMonth(new Date(year, Math.min(month.getMonth(), cap), 1));
  };

  return (
    <>
      <button type="button" className={`date-trigger ${value ? "" : "placeholder"}`} onClick={() => { setMonth(startMonth()); setOpen(true); }} aria-label="Choose date of birth">
        {value ? formatDob(value) : "Select your date of birth"}
      </button>
      {open && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div><h3>Choose date of birth</h3></div>
              <button className="close-button" type="button" aria-label="Close date picker" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="calendar-selectors">
              <SelectField ariaLabel="Select month" value={month.getMonth()} options={monthOptions} onChange={(m) => setMonth(new Date(month.getFullYear(), Number(m), 1))} />
              <SelectField ariaLabel="Select year" value={month.getFullYear()} options={yearOptions} onChange={pickYear} />
            </div>
            <div className="calendar-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <span key={d}>{d}</span>)}</div>
            <div className="calendar-grid">
              {Array.from({ length: first }, (_, i) => <span key={`b${i}`} className="calendar-day outside" aria-hidden="true" />)}
              {Array.from({ length: count }, (_, i) => {
                const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
                return (
                  <button key={i} type="button" disabled={date > maxDob} className={`calendar-day ${value === iso(date) ? "selected" : ""}`}
                    onClick={() => { onChange(iso(date)); setOpen(false); }}>{i + 1}</button>
                );
              })}
            </div>
            <div className="calendar-actions">
              <button className="button" type="button" onClick={() => { onChange(""); setOpen(false); }}>Clear date</button>
              <span className="calendar-footnote">You must be at least 18</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Page ---------- */
const VIEW_HEADINGS = {
  personal: ["Personal Information", "Update how your profile appears on TechLearn."],
  academic: ["Academic & Career", "Help TechLearn understand your background and goals."],
  preferences: ["Learning Preferences", "Customize your learning experience to suit your routine."],
  account: ["Account & Security", "Review your account information and security options."],
};

const Profile = () => {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const { refetchUserData } = useUser();
  const isLight = theme !== "dark";

  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editingGoals, setEditingGoals] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteDetails, setDeleteDetails] = useState("");
  const [customRole, setCustomRole] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await API.get("/api/users/profile/details");
      setProfile(data.profile);
      setDraft(null);
    } catch (error) {
      setLoadError(apiError(error, "We couldn't load your profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Browser back button returns from a section to the overview.
  useEffect(() => {
    const onPop = () => {
      const hash = window.location.hash.replace("#profile-", "");
      setView(VIEW_HEADINGS[hash] ? hash : "overview");
      setNotice(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const roleIsPreset = (role) => !role || ROLE_OPTIONS.includes(role);

  const openView = (next) => {
    setNotice(null);
    setEditingGoals(false);
    const base = profile || {};
    setDraft({
      ...base,
      level: base.level || "",
      targetRoleSelect: roleIsPreset(base.targetRole) ? base.targetRole || "" : "Other",
      targetCompanies: base.targetCompanies || [],
      currentSkills: base.currentSkills || [],
      skillsOfInterest: base.skillsOfInterest || [],
    });
    setCustomRole(roleIsPreset(base.targetRole) ? "" : base.targetRole);
    setView(next);
    window.scrollTo({ top: 0 });
    if (next === "overview") {
      if (window.location.hash.startsWith("#profile-")) window.history.replaceState({}, "", window.location.pathname);
    } else {
      window.history.pushState({ profileView: next }, "", `${window.location.pathname}#profile-${next}`);
    }
  };

  const goBack = () => {
    if (window.location.hash.startsWith("#profile-")) window.history.back();
    else { setView("overview"); setNotice(null); }
  };

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async (keys) => {
    if (!draft) return;
    setNotice(null);
    const payload = {};
    keys.forEach((key) => { payload[key] = draft[key]; });
    if (keys.includes("targetRole")) {
      payload.targetRole = draft.targetRoleSelect === "Other" ? customRole.trim() : draft.targetRoleSelect;
      if (draft.targetRoleSelect === "Other" && !payload.targetRole) {
        setNotice({ error: true, text: "Enter your target role." });
        return;
      }
    }
    if (keys.includes("college")) {
      delete payload.college;
      payload.collegeId = draft.college?.id || null;
    }
    if (keys.includes("daysPerWeek") && (!draft.daysPerWeek || !draft.hoursPerDay)) {
      setNotice({ error: true, text: "Select both days per week and hours per day." });
      return;
    }
    setSaving(true);
    try {
      const { data } = await API.put("/api/users/profile/details", payload);
      setProfile(data.profile);
      setDraft((d) => ({ ...d, ...data.profile, targetRoleSelect: d.targetRoleSelect }));
      setEditingGoals(false);
      setNotice({ text: "Changes saved successfully." });
      if (refetchUserData) refetchUserData();
    } catch (error) {
      setNotice({ error: true, text: apiError(error, "Could not save your changes. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const chooseAvatar = async (url) => {
    setAvatarOpen(false);
    try {
      const { data } = await API.put("/api/users/profile/details", { avatar: url });
      setProfile(data.profile);
      try {
        const stored = JSON.parse(localStorage.getItem("userData") || "{}");
        localStorage.setItem("userData", JSON.stringify({ ...stored, photoUrl: url, avatar: url }));
      } catch { /* cache only */ }
      if (refetchUserData) refetchUserData();
    } catch (error) {
      setNotice({ error: true, text: apiError(error, "Could not update your avatar.") });
    }
  };

  const resetPassword = async () => {
    setNotice(null);
    try {
      await API.post("/api/auth/forgot-password", { email: profile.email });
      setNotice({ text: `If an account exists for ${profile.email}, a password reset link has been sent.` });
    } catch (error) {
      setNotice({ error: true, text: apiError(error, "Could not send the reset email.") });
    }
  };

  const submitDelete = async (event) => {
    event.preventDefault();
    if (!deleteReason) return;
    try {
      const { data } = await API.post("/api/users/account-deletion-request", { reason: deleteReason, details: deleteDetails });
      setDeleteOpen(false);
      setDeleteReason("");
      setDeleteDetails("");
      setNotice({ text: data.message || "Deletion request received." });
    } catch (error) {
      setDeleteOpen(false);
      setNotice({ error: true, text: apiError(error, "Could not submit your request.") });
    }
  };

  const completion = useMemo(() => {
    if (!profile) return { percent: 0, personal: false, academic: false, prefs: false };
    const checks = [profile.fullName, profile.country, profile.college?.name, profile.degree, profile.graduationYear, profile.level, profile.targetRole, profile.daysPerWeek, profile.hoursPerDay];
    const done = checks.filter(Boolean).length;
    return {
      percent: Math.round((done / checks.length) * 100),
      personal: Boolean(profile.fullName && profile.country),
      academic: Boolean(profile.college?.name && profile.degree && profile.level && profile.targetRole),
      prefs: Boolean(profile.daysPerWeek && profile.hoursPerDay),
    };
  }, [profile]);

  const thisYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 19 }, (_, i) => thisYear + 6 - i);
  const noticeBox = notice && <div className={`notice ${notice.error ? "error" : ""}`} role="status">{notice.text}</div>;

  const shell = (children) => (
    <>
      <ScrollProgress />
      <UserSidebarLayout maxWidthClass="max-w-[1080px]">
        <div className={`tl-profile ${isLight ? "is-light" : ""}`}>{children}</div>
      </UserSidebarLayout>
    </>
  );

  if (loading) return shell(<div className="page-state"><div>Loading your profile…</div></div>);
  if (loadError || !profile) {
    return shell(
      <div className="page-state">
        <div role="alert">{loadError || "We couldn't load your profile."}</div>
        <button className="button button-primary" type="button" onClick={load}>Try again</button>
      </div>
    );
  }

  const avatarSrc = resolveAvatar(profile.avatar);

  const hero = (
    <section className="panel profile-hero" aria-label="Profile summary">
      <div className="avatar-wrap">
        <div className="avatar"><img src={avatarSrc} alt="Profile avatar" /></div>
        <button className="avatar-edit" type="button" aria-label="Choose avatar" title="Edit avatar" onClick={() => setAvatarOpen(true)}><FiEdit2 size={14} /></button>
      </div>
      <div className="hero-info">
        <h2>{profile.fullName || "Student"}</h2>
        <p>{profile.email}</p>
      </div>
      <div className="completion">
        <div className="completion-top"><span>Profile completion</span><strong>{completion.percent}%</strong></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${completion.percent}%` }} /></div>
      </div>
    </section>
  );

  const cards = [
    { id: "personal", title: "Personal Information", text: "Your name, contact details, location and profile photo.", status: completion.personal ? "Completed" : "In progress",
      icon: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></> },
    { id: "academic", title: "Academic & Career", text: "Your education, skills, experience level and career goals.", status: completion.academic ? "Completed" : "In progress",
      icon: <><path d="m2 10 10-5 10 5-10 5-10-5Z" /><path d="M6 12v5c3.5 3 8.5 3 12 0v-5" /><path d="M22 10v6" /></> },
    { id: "preferences", title: "Learning Preferences", text: "Choose how you learn and set your weekly learning goal.", status: completion.prefs ? "Goals set" : "In progress",
      icon: <><path d="M12 3v3m0 12v3M3 12h3m12 0h3" /><circle cx="12" cy="12" r="6" /><path d="m9.5 12 1.7 1.7 3.5-3.8" /></> },
    { id: "account", title: "Account & Security", text: "Manage your account details and review security options.", status: "Account settings",
      icon: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></> },
  ];

  const heading = VIEW_HEADINGS[view];
  const formActions = (keys) => (
    <div className="form-actions">
      <div className="action-buttons">
        <button className="button" type="button" onClick={goBack}>Cancel</button>
        <button className="button button-primary" type="button" disabled={saving} onClick={() => save(keys)}>{saving ? "Saving…" : "Save Changes"}</button>
      </div>
    </div>
  );


  return shell(
    <>
      <header className="user-page-header"><h1 className="user-page-title">PROFILE</h1></header>
      {hero}

      {view === "overview" && (
        <section>
          <div className="overview-grid">
            {cards.map((card) => (
              <button key={card.id} className="category-card" type="button" onClick={() => openView(card.id)}>
                <div className="card-top">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{card.icon}</svg>
                  </div>
                  <span className="arrow-icon">↗</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <div className="card-footer"><span className="card-status">{card.status}</span></div>
              </button>
            ))}
          </div>
          {noticeBox}
        </section>
      )}

      {view !== "overview" && draft && (
        <section className="detail-view">
          <div className="detail-heading">
            <div><h2>{heading[0]}</h2><p>{heading[1]}</p></div>
          </div>

          {view === "personal" && (
            <div className="panel form-panel">
              <h3 className="form-section-title">Basic details</h3>
              <p className="form-section-description">Keep your contact information up to date.</p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="fullName">Full name <span className="required">*</span></label>
                  <input id="fullName" value={draft.fullName || ""} placeholder="Enter your full name" autoComplete="name" onChange={(e) => setField("fullName", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input id="email" type="email" value={draft.email || ""} readOnly />
                </div>
                <div className="field">
                  <label>Date of birth</label>
                  <DobPicker value={draft.dob || ""} onChange={(v) => setField("dob", v)} />
                  <span className="field-hint">Users must be at least 18 years of age to access or use this service</span>
                </div>
                <div className="field">
                  <label htmlFor="country">Country</label>
                  <input id="country" value={draft.country || ""} placeholder="e.g. India" autoComplete="country-name" onChange={(e) => setField("country", e.target.value)} />
                </div>
              </div>
              {formActions(["fullName", "dob", "country"])}
              {noticeBox}
            </div>
          )}

          {view === "academic" && (
            <div className="panel form-panel">
              <h3 className="form-section-title">Education</h3>
              <p className="form-section-description">Tell us about your academic background.</p>
              <div className="form-grid">
                <CollegePicker value={draft.college} locked={draft.collegeLocked} onChange={(college) => setField("college", college)} />
                <div className="field">
                  <label htmlFor="degree">Degree</label>
                  <SelectField id="degree" value={draft.degree || ""} placeholder="Select degree" onChange={(v) => setField("degree", v)}
                    options={[...new Set([...DEGREES, draft.degree].filter(Boolean))].map((d) => ({ value: d, label: d }))} />
                </div>
                <div className="field">
                  <label htmlFor="branch">Branch / Specialization</label>
                  <input id="branch" value={draft.branch || ""} placeholder="e.g. Computer Science" onChange={(e) => setField("branch", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="gradYear">Graduation year</label>
                  <SelectField id="gradYear" value={draft.graduationYear || ""} placeholder="Select year" onChange={(v) => setField("graduationYear", v)}
                    options={[...new Set([...gradYears, Number(draft.graduationYear) || null].filter(Boolean))].sort((a, b) => b - a).map((y) => ({ value: y, label: String(y) }))} />
                </div>
                <div className="field">
                  <label htmlFor="level">Current skill level</label>
                  <SelectField id="level" value={draft.level || ""} placeholder="Select level" onChange={(v) => setField("level", v)}
                    options={LEVELS.map((l) => ({ value: l, label: l }))} />
                </div>
                <div className="field">
                  <label htmlFor="targetRole">Target role</label>
                  <SelectField id="targetRole" value={draft.targetRoleSelect || ""} placeholder="Select target role" onChange={(v) => setField("targetRoleSelect", v)}
                    options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))} />
                  {draft.targetRoleSelect === "Other" && (
                    <input style={{ marginTop: 8 }} value={customRole} placeholder="Enter your target role" onChange={(e) => setCustomRole(e.target.value)} />
                  )}
                </div>
                <ChipPicker id="targetCompanies" label="Target companies" placeholder="Select companies you are targeting" catalog={COMPANY_CATALOG}
                  values={draft.targetCompanies} onChange={(v) => setField("targetCompanies", v)} addPlaceholder="Add another company" />
                <ChipPicker id="currentSkills" label="Current Skills" placeholder="Select skills you already know" catalog={SKILL_CATALOG}
                  values={draft.currentSkills} onChange={(v) => setField("currentSkills", v)} addPlaceholder="Add another skill" />
                <ChipPicker id="skillsOfInterest" label="Skills of Interest" placeholder="Select skills you want to learn" catalog={SKILL_CATALOG}
                  values={draft.skillsOfInterest} onChange={(v) => setField("skillsOfInterest", v)} addPlaceholder="Add another skill" />
              </div>
              <div className="form-actions">
                <div className="action-buttons">
                  <button className="button" type="button" onClick={goBack}>Cancel</button>
                  <button className="button button-primary" type="button" disabled={saving}
                    onClick={() => save(["college", "degree", "branch", "graduationYear", "level", "targetRole", "targetCompanies", "currentSkills", "skillsOfInterest"])}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
              {noticeBox}
            </div>
          )}

          {view === "preferences" && (
            <div className="panel form-panel">
              <h3 className="form-section-title">Your learning goals</h3>
              <p className="form-section-description">Set a realistic routine you can maintain. These goals help us create your schedule.</p>
              {draft.daysPerWeek && draft.hoursPerDay && !editingGoals ? (
                <div className="goal-summary">
                  <div className="goal-summary-card"><div><span className="goal-label">Weekly Learning Goal</span><strong>{draft.daysPerWeek} {Number(draft.daysPerWeek) === 1 ? "day" : "days"}/week</strong></div><button className="small-button" type="button" onClick={() => setEditingGoals(true)}>Edit</button></div>
                  <div className="goal-summary-card"><div><span className="goal-label">Daily Learning Goal</span><strong>{draft.hoursPerDay} {Number(draft.hoursPerDay) === 1 ? "hour" : "hours"}/day</strong></div><button className="small-button" type="button" onClick={() => setEditingGoals(true)}>Edit</button></div>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="daysPerWeek">Days per week <span className="required">*</span></label>
                    <SelectField id="daysPerWeek" value={draft.daysPerWeek || ""} placeholder="Select days" onChange={(v) => setField("daysPerWeek", v)}
                      options={[3, 4, 5, 6, 7].map((d) => ({ value: d, label: `${d} days/week` }))} />
                  </div>
                  <div className="field">
                    <label htmlFor="hoursPerDay">Hours per day <span className="required">*</span></label>
                    <SelectField id="hoursPerDay" value={draft.hoursPerDay || ""} placeholder="Select hours" onChange={(v) => setField("hoursPerDay", v)}
                      options={[["0.5", "0.5 hours (30 mins)"], ["1", "1 hour/day"], ["1.5", "1.5 hours/day"], ["2", "2 hours/day"], ["3", "3 hours/day"], ["4", "4 hours/day"], ["5", "5 hours/day"], ["6", "6 hours/day"], ["8", "8 hours/day"]].map(([v, l]) => ({ value: v, label: l }))} />
                  </div>
                </div>
              )}
              <p className="field-hint">{draft.daysPerWeek && draft.hoursPerDay && !editingGoals ? "Your goals are saved to your account." : "Choose both values and save to set your goals."}</p>

              <div className="preference-divider" />
              <div className="form-grid">
                <div className="field">
                  <label>Learning mode</label>
                  <div className="readonly-mode"><span className="mode-indicator" /><span>{draft.learningMode || "Not enrolled in a Program yet"}</span></div>
                  <span className="field-hint">Set by the Program you're enrolled in.</span>
                </div>
                <div className="field">
                  <label htmlFor="reminders">Learning reminders</label>
                  <SelectField id="reminders" value={draft.remindersEnabled ? "On" : "Off"} onChange={(v) => setField("remindersEnabled", v === "On")}
                    options={[{ value: "On", label: "Enabled" }, { value: "Off", label: "Disabled" }]} />
                </div>
              </div>
              <div className="form-actions">
                <div className="action-buttons">
                  <button className="button" type="button" onClick={goBack}>Cancel</button>
                  <button className="button button-primary" type="button" disabled={saving} onClick={() => save(["daysPerWeek", "hoursPerDay", "remindersEnabled"])}>{saving ? "Saving…" : "Save Changes"}</button>
                </div>
              </div>
              {noticeBox}
            </div>
          )}

          {view === "account" && (
            <div className="panel form-panel">
              <h3 className="form-section-title">Account information</h3>
              <p className="form-section-description">Your account details and current status.</p>
              <div className="status-summary" aria-label="Current account, program and payment statuses">
                <div className="status-card"><span className="status-title">Account Status</span><strong className="status-value">{profile.accountStatus}</strong></div>
                <div className="status-card"><span className="status-title">Program Status</span><strong className="status-value">{profile.programStatus}</strong></div>
                <div className="status-card"><span className="status-title">Payment Status</span><strong className="status-value">{profile.paymentStatus || "Not available"}</strong></div>
              </div>
              <div className="security-row">
                <div><h4>Password &amp; sign-in</h4></div>
                <button className="button button-primary" type="button" onClick={resetPassword}>Reset password</button>
              </div>
              <div className="security-row">
                <div><h4>Delete account</h4><p>Send a request to remove your account and data. Our team confirms by email.</p></div>
                <button className="button button-danger" type="button" onClick={() => setDeleteOpen(true)}>Delete account</button>
              </div>
              <div className="security-row">
                <div><h4>Sign out</h4><p>Sign out of your current TechLearn session.</p></div>
                <button className="button" type="button" onClick={logout}>Sign out</button>
              </div>
              {noticeBox}
              <div className="account-back"><button className="button" type="button" onClick={goBack}>Back to Profile</button></div>
            </div>
          )}
        </section>
      )}

      {avatarOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setAvatarOpen(false); }}>
          <div className="modal-card">
            <div className="modal-header">
              <div><h3>Choose your avatar</h3><p>Select an avatar for your TechLearn profile.</p></div>
              <button className="close-button" type="button" aria-label="Close avatar picker" onClick={() => setAvatarOpen(false)}>×</button>
            </div>
            <div className="avatar-grid">
              {avatarUrls.map((url) => (
                <button key={url} type="button" className={`avatar-option ${avatarSrc === url ? "selected" : ""}`} onClick={() => chooseAvatar(url)} aria-label="Select avatar">
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="modal-backdrop delete-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setDeleteOpen(false); }}>
          <form className="modal-card wide" onSubmit={submitDelete}>
            <div className="modal-header"><div><h3>Delete your TechLearn account?</h3><p>This sends a deletion request. Nothing is removed until our team confirms it with you.</p></div></div>
            <label htmlFor="deleteReason">Why are you leaving? <span className="required">*</span></label>
            <select id="deleteReason" required value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}>
              <option value="">Select a reason</option>
              {DELETE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <label htmlFor="deleteDetails">Anything else you'd like us to know? (optional)</label>
            <textarea id="deleteDetails" maxLength={500} value={deleteDetails} onChange={(e) => setDeleteDetails(e.target.value)} placeholder="Share a little more, if you'd like" />
            <div className="delete-actions">
              <button className="button" type="button" onClick={() => setDeleteOpen(false)}>Keep account</button>
              <button className="button button-danger" type="submit">Send request</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Profile;
