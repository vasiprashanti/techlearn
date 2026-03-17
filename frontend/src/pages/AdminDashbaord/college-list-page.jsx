import { useState } from "react";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED = [
  { id:1, name:"Sunrise Engineering College",        code:"SEC-001", city:"Hyderabad", state:"Telangana",   adminEmail:"admin@sunrise.edu.in",  phone:"+91 98765 43210", status:"Active",   students:3240, courses:18, established:2004, avgScore:86, activeStudents:3, totalStudents:4 },
  { id:2, name:"Greenfield Institute of Technology", code:"GIT-002", city:"Pune",      state:"Maharashtra", adminEmail:"admin@greenfield.ac.in", phone:"+91 87654 32109", status:"Active",   students:2890, courses:14, established:2008, avgScore:83, activeStudents:2, totalStudents:3 },
  { id:3, name:"Apex College of Science",            code:"ACS-003", city:"Chennai",   state:"Tamil Nadu",  adminEmail:"admin@apex.edu.in",      phone:"+91 76543 21098", status:"Active",   students:1560, courses:10, established:2011, avgScore:86, activeStudents:3, totalStudents:3 },
  { id:4, name:"National Institute of Management",   code:"NIM-004", city:"Bengaluru", state:"Karnataka",   adminEmail:"admin@nim.edu.in",       phone:"+91 65432 10987", status:"Active",   students:4100, courses:22, established:2000, avgScore:89, activeStudents:2, totalStudents:2 },
  { id:5, name:"Horizon Arts & Commerce",            code:"HAC-005", city:"Ahmedabad", state:"Gujarat",     adminEmail:"admin@horizon.edu.in",   phone:"+91 54321 09876", status:"Disabled", students:2200, courses:12, established:2013, avgScore:0,  activeStudents:0, totalStudents:0 },
  { id:6, name:"Pioneer Medical College",            code:"PMC-006", city:"Mumbai",    state:"Maharashtra", adminEmail:"admin@pioneer.med.in",   phone:"+91 43210 98765", status:"Active",   students:980,  courses:8,  established:1998, avgScore:78, activeStudents:1, totalStudents:2 },
  { id:7, name:"Evergreen Law School",               code:"ELS-007", city:"Delhi",     state:"Delhi",       adminEmail:"admin@evergreen.law.in", phone:"+91 32109 87654", status:"Disabled", students:720,  courses:6,  established:2015, avgScore:0,  activeStudents:0, totalStudents:0 },
  { id:8, name:"Zenith Polytechnic",                 code:"ZPT-008", city:"Jaipur",    state:"Rajasthan",   adminEmail:"admin@zenith.poly.in",   phone:"+91 21098 76543", status:"Active",   students:1890, courses:16, established:2007, avgScore:74, activeStudents:3, totalStudents:4 },
];

const C = {
  pageBg:"#F0F4FF", cardBg:"#FFFFFF", cardBorder:"#E8EEF8",
  primary:"#2563EB", primaryHover:"#1D4ED8",
  textDark:"#0F172A", textMid:"#475569", textLight:"#94A3B8",
  borderLine:"#E2E8F0",
  success:"#16A34A", successBg:"#DCFCE7",
  danger:"#DC2626",  dangerBg:"#FEE2E2",
};

// No sidebar needed

const AVATAR_COLORS = [
  ["#2563EB","#DBEAFE"],["#16A34A","#DCFCE7"],["#7C3AED","#EDE9FE"],["#EA580C","#FFEDD5"],
  ["#0891B2","#CFFAFE"],["#BE185D","#FCE7F3"],["#CA8A04","#FEF9C3"],["#15803D","#DCFCE7"],
];

const EMPTY = { name:"", code:"", city:"", state:"", adminEmail:"", phone:"", established:"", students:"", courses:"", status:"Active" };
const STEPS = ["Basic Info", "Contact & Details", "Review & Submit"];

const validate = (f) => {
  const e = {};
  if (!f.name.trim())       e.name       = "College name is required";
  if (!f.code.trim())       e.code       = "College code is required";
  if (!f.city.trim())       e.city       = "City is required";
  if (!f.state.trim())      e.state      = "State is required";
  if (!f.adminEmail.trim()) e.adminEmail = "Admin email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.adminEmail)) e.adminEmail = "Enter a valid email";
  if (!f.established)       e.established = "Year is required";
  else if (+f.established < 1800 || +f.established > new Date().getFullYear()) e.established = "Enter a valid year";
  return e;
};

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.content.map(b => b.text || "").join("");
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  Building:    ({s=16,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1"/></svg>,
  Users:       ({s=16,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Book:        ({s=16,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Check:       ({s=16,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  XCircle:     ({s=16,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Search:      ({s=15,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus:        ({s=16,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ArrowUpRight:({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  MoreHoriz:   ({s=18,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>,
  ChevronLeft: ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight:({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronDown: ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  X:           ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Edit:        ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Power:       ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  Spark:       ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>,
  Alert:       ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Mail:        ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone:       ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09A16 16 0 0 0 14 14l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>,
  MapPin:      ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Hash:        ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Cal:         ({s=14,c="currentColor"})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function CollegeListPage() {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [collegeList,  setCollegeList]  = useState(SEED);
  const [toast,        setToast]        = useState(null);
  const [modal,        setModal]        = useState(null);
  const [menuId,       setMenuId]       = useState(null);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [errors,       setErrors]       = useState({});
  const [step,         setStep]         = useState(0);
  const [aiState,      setAiState]      = useState("idle");
  const [aiHints,      setAiHints]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [newId,        setNewId]        = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const filtered = collegeList.filter(c => {
    const q = search.toLowerCase();
    const hit = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) || c.adminEmail.toLowerCase().includes(q);
    return hit && (statusFilter === "All" || c.status === statusFilter);
  });

  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  const openAdd = () => { setForm(EMPTY); setErrors({}); setStep(0); setAiState("idle"); setAiHints(null); setModal("add"); };
  const openEdit = (c) => { setForm({ ...c, established: String(c.established), students: String(c.students), courses: String(c.courses) }); setErrors({}); setEditId(c.id); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditId(null); setSaving(false); setMenuId(null); };

  const fetchAI = async () => {
    if (!form.name.trim()) return;
    setAiState("loading");
    try {
      const raw = await callClaude(`You are a helpful assistant for an Indian college admin system called TRACE.
Given the college name "${form.name}", suggest realistic values for a college code (3 uppercase letters + dash + 3-digit number), city, state, admin email (admin@<shortname>.edu.in), phone (+91 format), established year, student count (500-8000), courses (5-30).
Respond ONLY with JSON, no markdown:
{"code":"XYZ-010","city":"Mumbai","state":"Maharashtra","adminEmail":"admin@xyz.edu.in","phone":"+91 98000 00000","established":"2005","students":"2500","courses":"15"}`);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setAiHints(parsed); setAiState("done");
    } catch { setAiState("error"); }
  };

  const applyAll = () => { if (aiHints) { setForm(p => ({ ...p, ...aiHints })); setErrors({}); } };

  const nextStep = async () => {
    if (step === 0) {
      const e = {};
      if (!form.name.trim()) e.name = "College name is required";
      if (!form.code.trim()) e.code = "College code is required";
      if (Object.keys(e).length) { setErrors(e); return; }
      if (aiState === "idle") fetchAI();
    }
    if (step === 1) { const e = validate(form); if (Object.keys(e).length) { setErrors(e); return; } }
    setStep(s => Math.min(2, s + 1));
  };

  const handleSubmit = async () => {
    const e = validate(form); if (Object.keys(e).length) { setErrors(e); setStep(1); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    const nc = {
      id: Date.now(), ...form,
      code: form.code.trim().toUpperCase(),
      students: +form.students || 0, courses: +form.courses || 0, established: +form.established,
      avgScore: 0, activeStudents: 0, totalStudents: 0,
    };
    setCollegeList(p => [nc, ...p]);
    setNewId(nc.id); setTimeout(() => setNewId(null), 3000);
    setStatusFilter("All"); setSearch("");
    closeModal(); showToast(`"${nc.name}" added successfully.`);
  };

  const handleEditSave = async () => {
    const e = validate(form); if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setCollegeList(p => p.map(c => c.id === editId ? { ...c, ...form, students: +form.students, courses: +form.courses, established: +form.established } : c));
    closeModal(); showToast("College updated successfully.");
  };

  const toggleStatus = (id) => {
    const col = collegeList.find(c => c.id === id);
    setCollegeList(p => p.map(c => c.id === id ? { ...c, status: c.status === "Active" ? "Disabled" : "Active" } : c));
    showToast(`${col.name} ${col.status === "Active" ? "disabled" : "enabled"}.`);
    closeModal();
  };

  // ─── Reusable field ───────────────────────────────────────────────────────
  const Field = ({ label, fkey, type = "text", icon, placeholder, hint, wide = false }) => {
    const hasErr = !!errors[fkey];
    const hasHint = aiHints?.[fkey] && form[fkey] !== aiHints[fkey];
    return (
      <div style={{ gridColumn: wide ? "span 2" : "span 1" }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</label>
        <div style={{ position: "relative" }}>
          {icon && <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>{icon}</span>}
          <input type={type} placeholder={placeholder || label} value={form[fkey]} onChange={e => setF(fkey, e.target.value)}
            style={{ width: "100%", padding: icon ? "9px 12px 9px 36px" : "9px 12px", border: `1.5px solid ${hasErr ? "#EF4444" : "#E2E8F0"}`, borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", color: C.textDark, outline: "none", background: hasErr ? "#FFF5F5" : "#F8FAFF", transition: "border-color .15s, box-shadow .15s" }}
            onFocus={e => { e.target.style.borderColor = hasErr ? "#EF4444" : C.primary; e.target.style.boxShadow = `0 0 0 3px ${hasErr ? "rgba(239,68,68,.1)" : "rgba(37,99,235,.12)"}`; e.target.style.background = "white"; }}
            onBlur={e => { e.target.style.borderColor = hasErr ? "#EF4444" : "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = hasErr ? "#FFF5F5" : "#F8FAFF"; }}
          />
        </div>
        {hasErr && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><Ic.Alert s={12} c="#EF4444" /><span style={{ fontSize: 11.5, color: "#EF4444", fontWeight: 500 }}>{errors[fkey]}</span></div>}
        {!hasErr && hasHint && hint && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Ic.Spark s={11} c={C.primary} />
            <span style={{ fontSize: 11.5, color: "#64748B" }}>AI suggests: </span>
            <button onClick={() => setF(fkey, aiHints[fkey])} style={{ fontSize: 11.5, color: C.primary, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>{aiHints[fkey]}</button>
          </div>
        )}
      </div>
    );
  };

  const totalActive   = collegeList.filter(c => c.status === "Active").length;
  const totalDisabled = collegeList.filter(c => c.status === "Disabled").length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: C.pageBg, color: C.textDark }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(148,163,184,.3); border-radius: 4px; }

        .card { background: white; border: 1px solid ${C.cardBorder}; border-radius: 14px; transition: box-shadow .2s, transform .2s; }
        .card:hover { box-shadow: 0 6px 24px rgba(37,99,235,.1); transform: translateY(-2px); }
        .card.new-card { animation: cardFlash 3s ease forwards; }
        @keyframes cardFlash { 0% { box-shadow: 0 0 0 3px rgba(37,99,235,.4); } 60% { box-shadow: 0 0 0 2px rgba(37,99,235,.15); } 100% { box-shadow: none; } }

        .btn-pri { background: ${C.primary}; color: white; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-family: inherit; transition: background .15s, box-shadow .15s; }
        .btn-pri:hover { background: ${C.primaryHover}; box-shadow: 0 3px 10px rgba(37,99,235,.3); }
        .btn-pri:disabled { opacity: .6; cursor: not-allowed; }
        .btn-sec { background: white; color: ${C.textMid}; border: 1.5px solid #E2E8F0; border-radius: 9px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-family: inherit; transition: all .15s; }
        .btn-sec:hover { border-color: ${C.primary}; color: ${C.primary}; }

        .view-btn { width: 100%; background: ${C.primary}; color: white; border: none; border-radius: 9px; padding: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; font-family: inherit; transition: background .15s; margin-top: 18px; }
        .view-btn:hover { background: ${C.primaryHover}; }

        .stat-card { background: white; border: 1px solid ${C.cardBorder}; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; flex: 1; min-width: 200px; }

        .badge-a { background: #DCFCE7; color: #15803D; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
        .badge-d { background: #FEE2E2; color: #DC2626; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }

        .menu-pop { position: absolute; top: 100%; right: 0; margin-top: 4px; background: white; border: 1px solid #E2E8F0; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.12); z-index: 100; min-width: 155px; overflow: hidden; animation: fadeIn .15s ease; }
        .menu-item { display: flex; align-items: center; gap: 9px; padding: 10px 14px; font-size: 13.5px; font-weight: 500; cursor: pointer; color: ${C.textDark}; transition: background .12s; }
        .menu-item:hover { background: #F8FAFF; }
        .menu-item.danger { color: #DC2626; } .menu-item.danger:hover { background: #FEF2F2; }

        .ov { position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeIn .2s ease; }
        .mdl { background: white; border-radius: 18px; width: 620px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,.2); animation: slideUp .22s ease; display: flex; flex-direction: column; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        .step-dot { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; transition: all .25s; flex-shrink: 0; }
        .step-line { flex: 1; height: 2px; transition: background .25s; margin: 0 6px; margin-bottom: 18px; }
        .ai-banner { border-radius: 10px; padding: 11px 14px; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
        .spinner { width: 16px; height: 16px; border: 2.5px solid rgba(37,99,235,.2); border-top-color: ${C.primary}; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
        .saving-spin { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tst { position: fixed; bottom: 28px; right: 28px; padding: 12px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 300; animation: slideUp .28s ease; box-shadow: 0 6px 20px rgba(0,0,0,.12); display: flex; align-items: center; gap: 8px; }
        .tst-success { background: #0F172A; color: white; } .tst-error { background: #DC2626; color: white; }

        .srch-input { border: 1px solid #E2E8F0; border-radius: 9px; padding: 8px 14px 8px 36px; font-size: 13.5px; font-family: inherit; color: ${C.textDark}; outline: none; width: 230px; transition: border .15s, box-shadow .15s; background: white; }
        .srch-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
        .status-sel { border: 1px solid #E2E8F0; border-radius: 9px; padding: 8px 36px 8px 12px; font-size: 13.5px; font-family: inherit; color: ${C.textDark}; outline: none; background: white; cursor: pointer; appearance: none; -webkit-appearance: none; font-weight: 500; transition: border .15s; }
        .status-sel:focus { border-color: ${C.primary}; }
      `}</style>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`tst tst-${toast.type}`}>
          {toast.type === "success" ? <Ic.Check s={14} c="white" /> : <Ic.XCircle s={14} c="white" />}
          {toast.msg}
        </div>
      )}

      {/* ── Click outside to close dot-menu ───────────────────────────────── */}
      {menuId && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setMenuId(null)} />}

      {/* ══════════ ADD MODAL ════════════════════════════════════════════════ */}
      {modal === "add" && (
        <div className="ov" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="mdl">
            <div style={{ padding: "26px 30px 0", borderBottom: `1px solid ${C.borderLine}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textDark }}>Add New College</h2>
                  <p style={{ fontSize: 13, color: C.textLight, marginTop: 3 }}>Register a new institution in the TRACE platform</p>
                </div>
                <button onClick={closeModal} style={{ background: "#F1F5F9", border: "none", width: 30, height: 30, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic.X s={14} c={C.textMid} />
                </button>
              </div>
              {/* Steps */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                {STEPS.map((label, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div className="step-dot" style={{ background: i < step ? C.success : i === step ? C.primary : "#E2E8F0", color: i <= step ? "white" : C.textLight }}>
                        {i < step ? <Ic.Check s={12} c="white" /> : i + 1}
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: i === step ? C.primary : i < step ? C.success : C.textLight, whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className="step-line" style={{ background: i < step ? C.success : "#E2E8F0" }} />}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "22px 30px", flex: 1 }}>
              {/* Step 0 */}
              {step === 0 && (
                <div>
                  <p style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>Enter the college name and code. AI will help fill in the rest.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="College Name *" fkey="name" wide icon={<Ic.Building s={14} c={C.textLight} />} placeholder="e.g. Sunrise Engineering College" />
                    <Field label="College Code *" fkey="code" icon={<Ic.Hash s={14} c={C.textLight} />} placeholder="e.g. SEC-001" />
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</label>
                      <select value={form.status} onChange={e => setF("status", e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", color: C.textDark, outline: "none", background: "#F8FAFF", cursor: "pointer" }}>
                        <option>Active</option><option>Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  {aiState === "loading" && <div className="ai-banner" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}><div className="spinner" /><div><div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>Analysing "{form.name}"…</div><div style={{ fontSize: 12, color: C.textLight, marginTop: 1 }}>Generating smart suggestions</div></div></div>}
                  {aiState === "done" && aiHints && <div className="ai-banner" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}><Ic.Spark s={15} c={C.primary} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>AI suggestions ready</div><div style={{ fontSize: 12, color: C.textLight, marginTop: 1 }}>Click any underlined hint to apply, or apply all at once.</div></div><button onClick={applyAll} style={{ background: C.primary, color: "white", border: "none", borderRadius: 7, padding: "6px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}><Ic.Spark s={11} c="white" /> Apply All</button></div>}
                  {aiState === "error" && <div className="ai-banner" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}><Ic.Alert s={15} c="#D97706" /><span style={{ fontSize: 13, color: "#92400E" }}>AI unavailable. Please fill fields manually.</span></div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="City *"             fkey="city"        icon={<Ic.MapPin s={14} c={C.textLight} />} hint />
                    <Field label="State *"            fkey="state"       icon={<Ic.MapPin s={14} c={C.textLight} />} hint />
                    <Field label="Admin Email *"      fkey="adminEmail"  icon={<Ic.Mail   s={14} c={C.textLight} />} type="email" hint wide />
                    <Field label="Phone"              fkey="phone"       icon={<Ic.Phone  s={14} c={C.textLight} />} hint />
                    <Field label="Established Year *" fkey="established" icon={<Ic.Cal    s={14} c={C.textLight} />} type="number" hint placeholder="e.g. 2005" />
                    <Field label="No. of Students"    fkey="students"    icon={<Ic.Users  s={14} c={C.textLight} />} type="number" hint placeholder="e.g. 2500" />
                    <Field label="No. of Courses"     fkey="courses"     icon={<Ic.Book   s={14} c={C.textLight} />} type="number" hint placeholder="e.g. 15" />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <p style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>Review all details before submitting.</p>
                  <div style={{ background: "#F8FAFF", border: `1px solid ${C.borderLine}`, borderRadius: 10, padding: "4px 18px", marginBottom: 14 }}>
                    {[["College Name", form.name], ["College Code", form.code.toUpperCase()], ["Status", form.status], ["City", form.city], ["State", form.state], ["Admin Email", form.adminEmail], ["Phone", form.phone || "—"], ["Established", form.established], ["Students", form.students || "—"], ["Courses", form.courses || "—"]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.borderLine}`, fontSize: 13.5 }}>
                        <span style={{ color: C.textLight, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em" }}>{k}</span>
                        <span style={{ color: C.textDark, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Ic.Alert s={14} c={C.primary} />
                    <span style={{ fontSize: 12.5, color: C.primary, fontWeight: 500 }}>The college will appear in the list immediately and can be edited anytime.</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "18px 30px 26px", borderTop: `1px solid ${C.borderLine}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textLight }}>Step {step + 1} of {STEPS.length}</span>
              <div style={{ display: "flex", gap: 10 }}>
                {step > 0
                  ? <button className="btn-sec" onClick={() => setStep(s => s - 1)} disabled={saving}><Ic.ChevronLeft s={14} c={C.textMid} /> Back</button>
                  : <button className="btn-sec" onClick={closeModal}>Cancel</button>}
                {step < 2
                  ? <button className="btn-pri" onClick={nextStep}>Next <Ic.ChevronRight s={14} c="white" /></button>
                  : <button className="btn-pri" onClick={handleSubmit} disabled={saving} style={{ minWidth: 140 }}>
                      {saving ? <><div className="saving-spin" /> Submitting…</> : <><Ic.Check s={14} c="white" /> Submit College</>}
                    </button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EDIT MODAL ═══════════════════════════════════════════════ */}
      {modal === "edit" && (
        <div className="ov" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="mdl">
            <div style={{ padding: "26px 30px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div><h2 style={{ fontSize: 18, fontWeight: 700, color: C.textDark }}>Edit College</h2><p style={{ fontSize: 13, color: C.textLight, marginTop: 3 }}>Update the institution's information</p></div>
                <button onClick={closeModal} style={{ background: "#F1F5F9", border: "none", width: 30, height: 30, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic.X s={14} c={C.textMid} /></button>
              </div>
              <div style={{ height: 1, background: C.borderLine, marginBottom: 22 }} />
            </div>
            <div style={{ padding: "0 30px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <Field label="College Name *"      fkey="name"        wide icon={<Ic.Building s={14} c={C.textLight} />} />
                <Field label="College Code *"      fkey="code"             icon={<Ic.Hash    s={14} c={C.textLight} />} />
                <Field label="City *"              fkey="city"             icon={<Ic.MapPin  s={14} c={C.textLight} />} />
                <Field label="State *"             fkey="state"            icon={<Ic.MapPin  s={14} c={C.textLight} />} />
                <Field label="Admin Email *"       fkey="adminEmail" wide  icon={<Ic.Mail    s={14} c={C.textLight} />} type="email" />
                <Field label="Phone"               fkey="phone"            icon={<Ic.Phone   s={14} c={C.textLight} />} />
                <Field label="Established Year *"  fkey="established"      icon={<Ic.Cal     s={14} c={C.textLight} />} type="number" />
                <Field label="No. of Students"     fkey="students"         icon={<Ic.Users   s={14} c={C.textLight} />} type="number" />
                <Field label="No. of Courses"      fkey="courses"          icon={<Ic.Book    s={14} c={C.textLight} />} type="number" />
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</label>
                  <select value={form.status} onChange={e => setF("status", e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", color: C.textDark, outline: "none", background: "#F8FAFF", cursor: "pointer" }}>
                    <option>Active</option><option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding: "18px 30px 26px", borderTop: `1px solid ${C.borderLine}`, display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
              <button className="btn-sec" onClick={closeModal}>Cancel</button>
              <button className="btn-pri" onClick={handleEditSave} disabled={saving} style={{ minWidth: 130 }}>
                {saving ? <><div className="saving-spin" /> Saving…</> : <><Ic.Check s={14} c="white" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ PAGE ═════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px" }}>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textDark, letterSpacing: "-.3px" }}>Colleges</h1>
            <p style={{ fontSize: 13.5, color: C.textLight, marginTop: 5 }}>Overview of all partner colleges and cohort performance</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Ic.Search s={15} c={C.textLight} /></span>
              <input className="srch-input" placeholder="Search colleges…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Status filter */}
            <div style={{ position: "relative" }}>
              <select className="status-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Ic.ChevronDown s={13} c={C.textLight} /></span>
            </div>
            <button className="btn-pri" onClick={openAdd}><Ic.Plus s={15} c="white" /> Add College</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { label: "Total Colleges",  value: collegeList.length,  icon: <Ic.Building s={22} c={C.primary} />,  bg: "#EFF6FF" },
            { label: "Active Colleges", value: totalActive,          icon: <Ic.Check   s={22} c={C.success} />,  bg: "#F0FDF4" },
            { label: "Disabled",        value: totalDisabled,        icon: <Ic.XCircle s={22} c={C.danger}  />,  bg: "#FEF2F2" },
            { label: "Total Students",  value: collegeList.reduce((a, c) => a + c.students, 0).toLocaleString(), icon: <Ic.Users s={22} c="#7C3AED" />, bg: "#EDE9FE" },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.textDark, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <Ic.Search s={36} c={C.textLight} />
            <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: C.textMid }}>No colleges found</div>
            <div style={{ marginTop: 6, fontSize: 13.5, color: C.textLight }}>Try adjusting your search or filter.</div>
          </div>
        )}

        {/* College Card Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {filtered.map((c, idx) => {
            const [fg, bg] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const pct = c.totalStudents > 0 ? Math.round((c.activeStudents / c.totalStudents) * 100) : 0;
            return (
              <div key={c.id} className={`card${c.id === newId ? " new-card" : ""}`} style={{ padding: "22px 24px", position: "relative" }}>

                {/* Card header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: fg, flexShrink: 0 }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.textDark, lineHeight: 1.25 }}>{c.name}</div>
                      <div style={{ fontSize: 12.5, color: C.textLight, marginTop: 3 }}>{c.code}</div>
                    </div>
                  </div>

                  {/* ⋯ menu */}
                  <div style={{ position: "relative" }}>
                    <button onClick={e => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", color: C.textLight, transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <Ic.MoreHoriz s={18} c={C.textLight} />
                    </button>
                    {menuId === c.id && (
                      <div className="menu-pop" onClick={e => e.stopPropagation()}>
                        <div className="menu-item" onClick={() => openEdit(c)}><Ic.Edit s={14} c={C.textMid} /> Edit College</div>
                        <div className={`menu-item${c.status === "Active" ? " danger" : ""}`} onClick={() => toggleStatus(c.id)}>
                          <Ic.Power s={14} c={c.status === "Active" ? C.danger : C.success} />
                          {c.status === "Active" ? "Disable" : "Enable"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{ marginBottom: 16 }}>
                  <span className={c.status === "Active" ? "badge-a" : "badge-d"}>
                    {c.status === "Active" ? <Ic.Check s={10} c="#15803D" /> : <Ic.XCircle s={10} c={C.danger} />}
                    {c.status}
                  </span>
                </div>

                {/* Avg Score + Activity Rate */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.textLight, fontWeight: 500, marginBottom: 4 }}>Avg Score</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.textDark }}>{c.avgScore > 0 ? `${c.avgScore}%` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: C.textLight, fontWeight: 500, marginBottom: 4 }}>Activity Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.textDark }}>
                      {c.totalStudents > 0
                        ? <span>{c.activeStudents} / {c.totalStudents} <span style={{ fontSize: 13, fontWeight: 500, color: C.textMid }}>({pct}%)</span></span>
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Footer info row */}
                <div style={{ borderTop: `1px solid ${C.borderLine}`, paddingTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Ic.MapPin s={12} c={C.textLight} /><span style={{ fontSize: 12, color: C.textLight }}>{c.city}, {c.state}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Ic.Users s={12} c={C.textLight} /><span style={{ fontSize: 12, color: C.textLight }}>{c.students.toLocaleString()} students</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Ic.Book s={12} c={C.textLight} /><span style={{ fontSize: 12, color: C.textLight }}>{c.courses} courses</span></div>
                </div>

                {/* View College button */}
                <button className="view-btn" onClick={() => openEdit(c)}>
                  View College <Ic.ArrowUpRight s={14} c="white" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
