import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { FiSearch, FiPlus, FiUpload, FiBell, FiChevronDown, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

const searchRoutes = [
  { id: "dashboard",          title: "Dashboard",          category: "Overview"     },
  { id: "analytics",          title: "Analytics",          category: "Overview"     },
  { id: "system-health",      title: "System Health",      category: "Overview"     },
  { id: "colleges",           title: "Colleges",           category: "Organization" },
  { id: "batches",            title: "Batches",            category: "Organization" },
  { id: "students",           title: "Students",           category: "Organization" },
  { id: "question-bank",      title: "Question Bank",      category: "Learning"     },
  { id: "track-templates",    title: "Track Templates",    category: "Learning"     },
  { id: "resources",          title: "Resources",          category: "Learning"     },
  { id: "certificates",       title: "Certificates",       category: "Learning"     },
  { id: "submission-monitor", title: "Submission Monitor", category: "Operations"   },
  { id: "notifications",      title: "Notifications",      category: "Operations"   },
  { id: "audit-logs",         title: "Audit Logs",         category: "Operations"   },
  { id: "reports",            title: "Reports",            category: "Operations"   },
];

const initialStudentsData = [
  { name: "Alex Johnson",   email: "alex@mit.edu",        college: "MIT",                 batch: "CS-2024A",  track: "Data Structures & Algorithms", score: 92, streak: 15, status: "Active"   },
  { name: "Sarah Williams", email: "sarah@stanford.edu",  college: "Stanford University", batch: "DS-2024A",  track: "Python Programming",           score: 88, streak: 12, status: "Active"   },
  { name: "Mike Chen",      email: "mike@mit.edu",        college: "MIT",                 batch: "CS-2024B",  track: "Web Development",              score: 95, streak: 22, status: "Active"   },
  { name: "Emily Davis",    email: "emily@iitd.ac.in",    college: "IIT Delhi",           batch: "WD-2024A",  track: "Web Development",              score: 79, streak: 8,  status: "Active"   },
  { name: "James Wilson",   email: "james@stanford.edu",  college: "Stanford University", batch: "DS-2024A",  track: "Python Programming",           score: 67, streak: 3,  status: "Inactive" },
  { name: "Lisa Anderson",  email: "lisa@mit.edu",        college: "MIT",                 batch: "CS-2024A",  track: "Data Structures & Algorithms", score: 85, streak: 10, status: "Active"   },
  { name: "David Kim",      email: "david@iitd.ac.in",    college: "IIT Delhi",           batch: "WD-2024B",  track: "Database Management",          score: 91, streak: 18, status: "Active"   },
  { name: "Rachel Green",   email: "rachel@stanford.edu", college: "Stanford University", batch: "DS-2024A",  track: "Python Programming",           score: 94, streak: 20, status: "Active"   },
  { name: "Tom Brown",      email: "tom@mit.edu",         college: "MIT",                 batch: "CS-2024B",  track: "Web Development",              score: 72, streak: 5,  status: "Inactive" },
  { name: "Priya Patel",    email: "priya@iitd.ac.in",    college: "IIT Delhi",           batch: "DSA-2024C", track: "Data Structures & Algorithms", score: 89, streak: 14, status: "Active"   },
  { name: "Kevin Zhang",    email: "kevin@harvard.edu",   college: "Harvard University",  batch: "ML-2024A",  track: "Machine Learning",             score: 96, streak: 25, status: "Active"   },
  { name: "Anna Martinez",  email: "anna@harvard.edu",    college: "Harvard University",  batch: "ML-2024A",  track: "Machine Learning",             score: 82, streak: 9,  status: "Active"   },
];

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
          <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
          <input
            ref={searchInputRef} type="text"
            placeholder="Search pages, tracks, or settings..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
          />
          <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose}>
            <span>ESC</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredRoutes.length === 0
            ? <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for "{searchQuery}"</div>
            : filteredRoutes.map(route => (
              <button key={route.id} onClick={() => { onClose(); navigate(`/${route.id}`); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                <div>
                  <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>

                </div>
                <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
};

const Students = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState(initialStudentsData);
  const [mounted, setMounted]           = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingStudentKey, setEditingStudentKey] = useState(null);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState(null);
  const [addError, setAddError] = useState('');
  const [addStudentForm, setAddStudentForm] = useState({
    name: '',
    email: '',
    college: '',
    batch: '',
    track: '',
    status: 'Active',
  });
  const [searchQuery, setSearchQuery]   = useState('');
  const [tableSearch, setTableSearch]   = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [trackFilter, setTrackFilter]     = useState('All Tracks');
  const [statusFilter, setStatusFilter]   = useState('All');
  const searchInputRef = useRef(null);
  const bulkImportInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const uniqueColleges = ['All Colleges', ...new Set(students.map((s) => s.college))];
  const uniqueTracks = ['All Tracks', ...new Set(students.map((s) => s.track).filter(Boolean))];
  const uniqueBatches = [...new Set(students.map((s) => s.batch))];
  const formTrackOptions = uniqueTracks.filter((track) => track !== 'All Tracks');

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStudents = students.filter(s => {
    const matchCollege = collegeFilter === 'All Colleges' || s.college === collegeFilter;
    const matchTrack   = trackFilter   === 'All Tracks'   || s.track   === trackFilter;
    const matchStatus  = statusFilter  === 'All'          || s.status  === statusFilter;
    const matchSearch  = !tableSearch  ||
      s.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.batch.toLowerCase().includes(tableSearch.toLowerCase());
    return matchCollege && matchTrack && matchStatus && matchSearch;
  });

  const getStudentKey = (student) => `${student.email}__${student.batch}`;

  const openAddStudent = () => {
    setEditingStudentKey(null);
    setAddError('');
    setAddStudentForm({
      name: '',
      email: '',
      college: '',
      batch: '',
      track: '',
      status: 'Active',
    });
    setIsAddFormOpen(true);
  };

  const openEditStudent = (student) => {
    setEditingStudentKey(getStudentKey(student));
    setAddError('');
    setAddStudentForm({
      name: student.name || '',
      email: student.email || '',
      college: student.college || '',
      batch: student.batch || '',
      track: student.track || '',
      status: student.status || 'Active',
    });
    setIsAddFormOpen(true);
  };

  const addStudent = () => {
    if (!addStudentForm.name.trim()) {
      setAddError('Name is required');
      return;
    }
    if (!addStudentForm.email.trim()) {
      setAddError('Email is required');
      return;
    }
    if (!addStudentForm.college) {
      setAddError('College is required');
      return;
    }
    if (!addStudentForm.batch.trim()) {
      setAddError('Batch is required');
      return;
    }

    const studentPayload = {
      name: addStudentForm.name.trim(),
      email: addStudentForm.email.trim().toLowerCase(),
      college: addStudentForm.college,
      batch: addStudentForm.batch.trim().toUpperCase(),
      track: addStudentForm.track.trim() || 'General Track',
      status: addStudentForm.status,
    };

    if (editingStudentKey) {
      setStudents((prev) => prev.map((student) => (
        getStudentKey(student) === editingStudentKey
          ? { ...student, ...studentPayload }
          : student
      )));
    } else {
      const newStudent = {
        ...studentPayload,
        score: 0,
        streak: 0,
      };
      setStudents((prev) => [newStudent, ...prev]);
    }

    setEditingStudentKey(null);
    setIsAddFormOpen(false);
  };

  const deleteStudent = () => {
    if (!pendingDeleteStudent) return;
    const deleteKey = getStudentKey(pendingDeleteStudent);
    setStudents((prev) => prev.filter((student) => getStudentKey(student) !== deleteKey));
    setPendingDeleteStudent(null);
  };

  const triggerBulkImport = () => {
    bulkImportInputRef.current?.click();
  };

  const handleBulkImportSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // File picker integration for now; parsing/import mapping can be added next.
    window.alert(`Selected file: ${file.name}`);
    event.target.value = '';
  };

  const dropdownClass = `
    appearance-none h-10 text-sm pl-3.5 pr-9 rounded-xl
    border border-black/10 dark:border-white/10
    bg-white/60 dark:bg-black/40
    text-black/60 dark:text-white/60
    focus:outline-none focus:border-black/20 dark:focus:border-white/20
    transition-colors cursor-pointer
  `;

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef} filteredRoutes={filteredRoutes} navigate={navigate}
      />

      <input
        ref={bulkImportInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleBulkImportSelection}
      />

      {selectedStudent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-full max-w-xl bg-[#e8edf4] dark:bg-[#e8edf4] border border-black/10 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
            <div className="px-4 py-3 flex items-start justify-between">
              <h2 className="text-[22px] leading-none font-semibold text-slate-900">{selectedStudent.name}</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-xl leading-none text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close student detail"
              >
                ×
              </button>
            </div>
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[15px] leading-snug">
              <div>
                <span className="text-slate-500 font-normal">Email:</span>{' '}
                <span className="text-slate-900 font-medium">{selectedStudent.email}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">College:</span>{' '}
                <span className="text-slate-900 font-semibold">{selectedStudent.college}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Batch:</span>{' '}
                <span className="text-slate-900 font-medium">{selectedStudent.batch}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Track:</span>{' '}
                <span className="text-slate-900 font-semibold">{selectedStudent.track}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Score:</span>{' '}
                <span className="inline-flex items-center rounded-full bg-emerald-600 text-white font-semibold px-2 py-0.5 text-[0.76em] leading-none">{selectedStudent.score}%</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Streak:</span>{' '}
                <span className="text-slate-900 font-medium">{selectedStudent.streak} days</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Tests Taken:</span>{' '}
                <span className="text-slate-900 font-medium">{selectedStudent.testsTaken ?? Math.max(4, Math.floor(selectedStudent.score / 8))}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Last Active:</span>{' '}
                <span className="text-slate-900 font-medium">{selectedStudent.lastActive ?? `${Math.max(1, Math.floor(selectedStudent.streak / 2))} days ago`}</span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Status:</span>{' '}
                <span className={`inline-flex items-center rounded-full text-white font-semibold px-2 py-0.5 text-[0.76em] leading-none ${selectedStudent.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                  {selectedStudent.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-normal">Joined:</span>{' '}
                <span className="text-slate-900 font-medium">{selectedStudent.joined ?? '2024-06-01'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteStudent && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPendingDeleteStudent(null)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Delete Student</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">Delete {pendingDeleteStudent.name} from the list?</p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingDeleteStudent(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={deleteStudent}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsAddFormOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">{editingStudentKey ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setIsAddFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Name*</label>
                  <input
                    value={addStudentForm.name}
                    onChange={(e) => setAddStudentForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Enter student name"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Email*</label>
                  <input
                    type="email"
                    value={addStudentForm.email}
                    onChange={(e) => setAddStudentForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Enter student email"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">College*</label>
                  <div className="relative mt-1">
                    <select
                      value={addStudentForm.college}
                      onChange={(e) => setAddStudentForm((p) => ({ ...p, college: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                    >
                      <option value="">Select college</option>
                      {uniqueColleges.filter((college) => college !== 'All Colleges').map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Batch*</label>
                  <div className="relative mt-1">
                    <select
                      value={addStudentForm.batch}
                      onChange={(e) => setAddStudentForm((p) => ({ ...p, batch: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                    >
                      <option value="">Select batch</option>
                      {uniqueBatches.map((batch) => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Track</label>
                  <div className="relative mt-1">
                    <select
                      value={addStudentForm.track}
                      onChange={(e) => setAddStudentForm((p) => ({ ...p, track: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                    >
                      <option value="">Select track</option>
                      {formTrackOptions.map((track) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                  <div className="relative mt-1">
                    <select
                      value={addStudentForm.status}
                      onChange={(e) => setAddStudentForm((p) => ({ ...p, status: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                  </div>
                </div>
              </div>

              {addError && <p className="text-xs text-red-500">{addError}</p>}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addStudent}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition-colors"
                >
                  {editingStudentKey ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-10 lg:px-14 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-4">

            {/* Header */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Students</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Top controls */}
            <div className="flex items-center justify-end gap-1.5 flex-wrap xl:flex-nowrap mt-1">
              <div className="relative min-w-[190px] xl:min-w-[210px]">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="pl-9 pr-3 h-10 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors w-full"
                />
              </div>

              <div className="relative min-w-[145px]">
                <select value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)} className={`${dropdownClass} w-full`}>
                  {uniqueColleges.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>

              <div className="relative min-w-[140px]">
                <select value={trackFilter} onChange={e => setTrackFilter(e.target.value)} className={`${dropdownClass} w-full`}>
                  {uniqueTracks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>

              <div className="relative min-w-[110px]">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${dropdownClass} w-full`}>
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>

              <button
                onClick={triggerBulkImport}
                className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#3C83F6]/20 text-[#3C83F6] dark:border-white/10 dark:text-white/60 hover:bg-[#3C83F6]/5 dark:hover:bg-white/5 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <FiUpload className="w-3.5 h-3.5" />Bulk Import
              </button>

              <button
                onClick={openAddStudent}
                className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#3C83F6] border border-[#3C83F6]/20 text-white hover:bg-[#2f73e0] transition-colors text-sm font-medium whitespace-nowrap"
              >
                <FiPlus className="w-3.5 h-3.5" />Add Student
              </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-white backdrop-blur-xl border border-black/5 dark:border-black/10 rounded-2xl overflow-auto max-h-[78vh]">
              <table className="w-full min-w-[1320px] table-fixed">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[18%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="border-b-2 border-black/12 dark:border-black/15">
                  <tr className="sticky top-0 bg-white/95 dark:bg-white/95 backdrop-blur">
                    {['Name', 'Email', 'College', 'Batch', 'Track', 'Score', 'Streak', 'Status', 'Actions'].map((col, i) => (
                      <th key={i} className={`${i === 0 ? 'pl-4 pr-2' : 'px-4'} py-3 text-left text-sm font-semibold text-black/55 dark:text-black/55`}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="border-t border-black/20 dark:border-black/25">
                  {filteredStudents.map((student, i) => (
                    <tr key={i} className="border-b border-black/12 dark:border-black/15 hover:bg-white/30 dark:hover:bg-white/[0.03] transition-colors group">
                      <td className="pl-4 pr-2 py-3 align-middle">
                        <p className="text-sm font-semibold text-black/85 dark:text-white truncate leading-tight">{student.name}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-[13px] text-black/55 dark:text-white/55 truncate block leading-tight">{student.email}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm text-black/75 dark:text-white/75 truncate block">{student.college}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-[10px] font-semibold text-black/70 dark:text-white/70 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 whitespace-nowrap inline-block">
                          {student.batch}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm text-black/60 dark:text-white/55 truncate block">{student.track}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`text-sm leading-none font-semibold rounded-full px-2.5 py-0.5 inline-flex items-center ${student.score >= 90 ? 'text-white bg-emerald-500' : student.score >= 75 ? 'text-white bg-[#3C83F6]' : 'text-white bg-amber-500'}`}>
                          {student.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm font-medium text-black/85 dark:text-white/85">{student.streak} days</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center
                          ${student.status === 'Active'
                            ? 'border-emerald-500/20 text-white bg-emerald-500'
                            : 'border-rose-400/20 text-white bg-rose-500'
                          }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-black/70 dark:text-white/70 hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 dark:hover:bg-white/10 transition-colors"
                            aria-label={`View ${student.name}`}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditStudent(student)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-black/70 dark:text-white/70 hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 dark:hover:bg-white/10 transition-colors"
                            aria-label={`Edit ${student.name}`}
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPendingDeleteStudent(student)}
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-black/70 dark:text-white/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            aria-label={`Delete ${student.name}`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Result count */}
            <p className="text-base font-medium text-black/45 dark:text-white/45">
              Showing {filteredStudents.length} of {students.length} students
            </p>

          </div>
        </main>
      </div>
    </>
  );
};

export default Students;
