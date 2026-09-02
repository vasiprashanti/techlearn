import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import StudentReportModal from '../../components/AdminDashbaord/StudentReportModal';
import { adminAPI } from '../../services/adminApi';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiUserCheck, 
  FiUsers, FiAward, FiCompass, FiCalendar, FiUpload, FiEye, FiCheckCircle, FiMoreHorizontal, FiX 
} from 'react-icons/fi';

const searchRoutes = [
  { id: "dashboard", title: "Dashboard", category: "Overview" },
  { id: "analytics", title: "Analytics", category: "Overview" },
  { id: "system-health", title: "System Health", category: "Overview" },
  { id: "colleges", title: "Colleges", category: "Organization" },
  { id: "batches", title: "Batches", category: "Organization" },
  { id: "students", title: "Students", category: "Organization" },
  { id: "question-bank", title: "Question Bank", category: "Learning" },
  { id: "track-templates", title: "Track Templates", category: "Learning" },
  { id: "resources", title: "Resources", category: "Learning" },
  { id: "certificates", title: "Certificates", category: "Learning" },
  { id: "submission-monitor", title: "Submission Monitor", category: "Operations" },
  { id: "notifications", title: "Notifications", category: "Operations" },
  { id: "audit-logs", title: "Audit Logs", category: "Operations" },
  { id: "reports", title: "Reports", category: "Operations" },
];

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentMonthLabel = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatDateValue = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
          <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages, tracks, or settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35"
          />
          <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose}>
            <span>ESC</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredRoutes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">
              No results found for "{searchQuery}"
            </div>
          ) : (
            filteredRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => {
                  onClose();
                  navigate(`/${route.id}`);
                }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left"
              >
                <div>
                  <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>
                </div>
                <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default function Students() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Active View & Filter states
  const [activeTab, setActiveTab] = useState('enrolled'); // enrolled | leads | skill | exploring
  const [monthFilter, setMonthFilter] = useState(() => getCurrentMonthValue()); // YYYY-MM or 'all'
  const [accessFilter, setAccessFilter] = useState('all'); // all | paid | college | free
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | completed | expired
  const [programFilter, setProgramFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Selection & Bulk Actions
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Data states
  const [studentsData, setStudentsData] = useState({ items: [], total: 0 });
  const [stats, setStats] = useState({ totalEnrolled: 0, activeThisMonth: 0, collegeCount: 0, individualCount: 0, completedCount: 0 });
  const [filterOptions, setFilterOptions] = useState({ colleges: [], programs: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Actions
  const [selectedReportStudent, setSelectedReportStudent] = useState(null);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Add / Edit Student Form
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', collegeId: '', batchId: '', programId: '', track: '', programSelection: 'Placement Sprint', status: 'Active' });

  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const studentFormInputClass = 'mt-1 w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30';

  const loadGlobalStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getGlobalStudents({
        tab: activeTab,
        month: monthFilter,
        access: accessFilter,
        status: statusFilter,
        programId: programFilter,
        collegeId: collegeFilter,
        search: tableSearch,
      });
      if (response) {
        setStudentsData({ items: response.items || [], total: response.total || 0 });
        if (response.stats) setStats(response.stats);
        if (response.filterOptions) setFilterOptions(response.filterOptions);
      }
    } catch (err) {
      console.error("Failed to load global students:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, monthFilter, accessFilter, statusFilter, programFilter, collegeFilter, tableSearch]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    loadGlobalStudents();
  }, [loadGlobalStudents]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen((prev) => !prev); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bulk Import state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkCollegeId, setBulkCollegeId] = useState('');
  const [bulkBatchId, setBulkBatchId] = useState('');
  const [bulkProgramId, setBulkProgramId] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  const openBulkImport = () => {
    setBulkFile(null);
    setBulkCollegeId(filterOptions.colleges[0]?._id || '');
    setBulkBatchId('');
    setBulkProgramId(filterOptions.programs[0]?._id || '');
    setBulkError('');
    setBulkSuccessMsg('');
    setIsBulkImportOpen(true);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Student ID\nJohn Doe,john.doe@example.com,STU1001\nJane Smith,jane.smith@example.com,STU1002\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_bulk_import_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const rollIdx = headers.findIndex((h) => h.includes('id') || h.includes('roll') || h.includes('student'));

    const parsedStudents = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''));
      if (cols.length === 0 || !cols.join('')) continue;
      
      const name = nameIdx !== -1 ? cols[nameIdx] : cols[0];
      const email = emailIdx !== -1 ? cols[emailIdx] : cols[1];
      const rollNo = rollIdx !== -1 ? cols[rollIdx] : (cols[2] || '');

      if (name && email) {
        parsedStudents.push({ name, email, rollNo });
      }
    }
    return parsedStudents;
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setBulkError('Please select a CSV file to upload.');
      return;
    }
    setBulkImporting(true);
    setBulkError('');
    setBulkSuccessMsg('');

    try {
      const text = await bulkFile.text();
      const studentsList = parseCsvText(text);

      if (studentsList.length === 0) {
        setBulkError('No valid student rows found in the uploaded file. Ensure headers include Name and Email.');
        setBulkImporting(false);
        return;
      }

      const res = await adminAPI.bulkUploadStudents({
        students: studentsList,
        collegeId: bulkCollegeId,
        batchId: bulkBatchId,
        programId: bulkProgramId,
        status: 'Active',
      });

      setBulkSuccessMsg(res.message || `Successfully imported ${studentsList.length} students.`);
      loadGlobalStudents();
      setTimeout(() => {
        setIsBulkImportOpen(false);
      }, 1500);
    } catch (err) {
      setBulkError(err.message || 'Bulk upload failed.');
    } finally {
      setBulkImporting(false);
    }
  };

  const filteredRoutes = searchRoutes.filter((route) =>
    route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddStudent = () => {
    setEditingStudentId(null);
    setFormError('');
    setStudentForm({ name: '', email: '', collegeId: filterOptions.colleges[0]?._id || '', batchId: '', programId: filterOptions.programs[0]?._id || '', track: '', programSelection: 'Placement', status: 'Active' });
    setIsAddFormOpen(true);
  };

  const openEditStudent = (student) => {
    setEditingStudentId(student.id || student._id);
    setFormError('');
    setStudentForm({
      name: student.name || '',
      email: student.email || '',
      collegeId: student.collegeId || '',
      batchId: student.batchId || '',
      programId: student.programId || '',
      track: student.track || '',
      programSelection: student.programSelection || 'Placement',
      status: student.status || 'Active',
    });
    setIsAddFormOpen(true);
  };

  const handleSaveStudent = async (e) => {
    if (e) e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.email.trim()) {
      setFormError('Student Name and Email are required.');
      return;
    }
    setIsSavingStudent(true);
    setFormError('');
    try {
      if (editingStudentId) {
        await adminAPI.updateStudent(editingStudentId, studentForm);
      } else {
        await adminAPI.createStudent(studentForm);
      }
      setIsAddFormOpen(false);
      loadGlobalStudents();
    } catch (err) {
      setFormError(err.message || 'Failed to save student.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!pendingDeleteStudent) return;
    setIsDeletingStudent(true);
    try {
      await adminAPI.deleteStudent(pendingDeleteStudent.id || pendingDeleteStudent._id);
      setPendingDeleteStudent(null);
      loadGlobalStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      for (const id of selectedStudentIds) {
        await adminAPI.deleteStudent(id);
      }
      setSelectedStudentIds([]);
      setIsBulkDeleteConfirmOpen(false);
      loadGlobalStudents();
    } catch (err) {
      alert(err.message || 'Bulk delete failed.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        filteredRoutes={filteredRoutes}
        navigate={navigate}
      />

      {/* Bulk Import Students Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 font-sans">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkImportOpen(false)} />
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-black/80 dark:text-white flex items-center gap-2">
                  <FiUpload className="w-4 h-4 text-[#3C83F6]" />
                  Bulk Import Students
                </h3>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                  Upload a CSV file containing student names and emails.
                </p>
              </div>
              <button onClick={() => setIsBulkImportOpen(false)} className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              {/* College & Program Mapping */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">College*</label>
                  <select
                    value={bulkCollegeId}
                    onChange={(e) => setBulkCollegeId(e.target.value)}
                    className={studentFormInputClass}
                  >
                    <option value="" className={dropdownOptionClass}>Select College</option>
                    {filterOptions.colleges.map((c) => (
                      <option key={c._id} value={c._id} className={dropdownOptionClass}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Program</label>
                  <select
                    value={bulkProgramId}
                    onChange={(e) => setBulkProgramId(e.target.value)}
                    className={studentFormInputClass}
                  >
                    <option value="" className={dropdownOptionClass}>Select Program</option>
                    {filterOptions.programs.map((p) => (
                      <option key={p._id} value={p._id} className={dropdownOptionClass}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CSV Upload Dropzone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">CSV File*</label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="text-[11px] font-bold text-[#3C83F6] dark:text-[#7fb1ff] hover:underline"
                  >
                    Download Sample CSV
                  </button>
                </div>
                <div className="relative border-2 border-dashed border-black/15 dark:border-white/20 rounded-xl p-5 text-center bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] transition-colors">
                  <input
                    type="file"
                    accept=".csv, text/csv"
                    onChange={(e) => setBulkFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FiUpload className="w-6 h-6 text-black/35 dark:text-white/35 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {bulkFile ? bulkFile.name : 'Click or drag CSV file to upload'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Columns: Name, Email, Student ID
                  </p>
                </div>
              </div>

              {bulkError && <p className="text-xs text-rose-500 font-medium">{bulkError}</p>}
              {bulkSuccessMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{bulkSuccessMsg}</p>}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsBulkImportOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkImporting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3C83F6] hover:bg-[#2f73e0] text-white disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkImporting ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 font-sans">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsAddFormOpen(false)} />
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">
                {editingStudentId ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => setIsAddFormOpen(false)} className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="p-6 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Student Name*</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className={studentFormInputClass}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email Address*</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className={studentFormInputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">College*</label>
                  <select
                    value={studentForm.collegeId}
                    onChange={(e) => setStudentForm({ ...studentForm, collegeId: e.target.value })}
                    className={studentFormInputClass}
                  >
                    <option value="" className={dropdownOptionClass}>Select College</option>
                    {filterOptions.colleges.map((c) => (
                      <option key={c._id} value={c._id} className={dropdownOptionClass}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                    className={studentFormInputClass}
                  >
                    <option value="Active" className={dropdownOptionClass}>Active</option>
                    <option value="Inactive" className={dropdownOptionClass}>Inactive</option>
                    <option value="Suspended" className={dropdownOptionClass}>Suspended</option>
                  </select>
                </div>
              </div>

              {formError && <p className="text-xs text-rose-500">{formError}</p>}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3C83F6] hover:bg-[#2f73e0] text-white disabled:opacity-50"
                >
                  {isSavingStudent ? 'Saving...' : editingStudentId ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanently Delete Confirmation Modal */}
      {pendingDeleteStudent && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center px-4 font-sans">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPendingDeleteStudent(null)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Delete Student Permanently</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                Are you sure you want to delete <strong className="text-black/80 dark:text-white">{pendingDeleteStudent.name}</strong>? This will remove all account data, enrollments, and submissions permanently.
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingDeleteStudent(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={isDeletingStudent}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
              >
                {isDeletingStudent ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center px-4 font-sans">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-red-600 dark:text-red-400">Bulk Delete Students</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                Are you sure you want to delete the {selectedStudentIds.length} selected students? This will permanently remove all associated accounts and data.
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-24 pb-6 px-3 sm:px-5 lg:px-8 overflow-y-auto overflow-x-hidden flex flex-col justify-between`}
        >
          <div className="max-w-[1600px] w-full mx-auto space-y-4">
            
            {/* Title Header */}
            <div>
              <h1 className="admin-page-title text-xl sm:text-2xl">Global Students Database</h1>
            </div>

            {/* Dynamic Metric Cards (Compact) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Total Enrolled', count: stats.totalEnrolled, color: 'text-[#3C83F6] dark:text-blue-400' },
                { label: 'Active This Month', count: stats.activeThisMonth, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'College Cohorts', count: stats.collegeCount, color: 'text-[#3C83F6] dark:text-blue-400' },
                { label: 'Individual', count: stats.individualCount, color: 'text-purple-600 dark:text-purple-400' },
                { label: 'Completed', count: stats.completedCount, color: 'text-indigo-600 dark:text-indigo-400' },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-3 py-2 flex flex-col items-start text-left shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">{label}</p>
                  <p className={`text-base sm:text-xl font-semibold tracking-tight mt-0.5 ${color}`}>{count}</p>
                </div>
              ))}
            </div>

            {/* Navigation Tabs (Enrolled, Leads, Skill, Exploring) */}
            <div className="flex border-b border-black/10 dark:border-white/10 gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('enrolled')}
                className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'enrolled'
                    ? 'border-[#3C83F6] text-[#3C83F6] dark:text-[#7fb1ff]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FiUserCheck className="w-3.5 h-3.5" />
                Enrolled
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'leads'
                    ? 'border-[#3C83F6] text-[#3C83F6] dark:text-[#7fb1ff]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FiUsers className="w-3.5 h-3.5" />
                Leads
              </button>

              <button
                onClick={() => setActiveTab('skill')}
                className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'skill'
                    ? 'border-[#3C83F6] text-[#3C83F6] dark:text-[#7fb1ff]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FiAward className="w-3.5 h-3.5" />
                Skill
              </button>

              <button
                onClick={() => setActiveTab('exploring')}
                className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'exploring'
                    ? 'border-[#3C83F6] text-[#3C83F6] dark:text-[#7fb1ff]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FiCompass className="w-3.5 h-3.5" />
                Exploring
              </button>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Select All, Search, Add Student */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 w-full">
                  {/* Select All */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-8 shrink-0">
                    <input
                      type="checkbox"
                      checked={studentsData.items.length > 0 && studentsData.items.every(s => selectedStudentIds.includes(s.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelections = new Set([...selectedStudentIds, ...studentsData.items.map(s => s.id)]);
                          setSelectedStudentIds(Array.from(newSelections));
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => !studentsData.items.some(s => s.id === id)));
                        }
                      }}
                      className="w-3 h-3 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                    />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Select All</span>
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1 min-w-0">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                    <input
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Search students..."
                      className="w-full h-8 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-8 pr-3 text-xs text-black/80 dark:text-white placeholder:text-black/35 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={openBulkImport}
                    className="h-8 px-3.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                  >
                    <FiUpload className="w-3.5 h-3.5" />
                    Bulk Import
                  </button>
                  <button
                    onClick={openAddStudent}
                    className="h-8 px-3.5 rounded-xl bg-[#3C83F6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2f73e0] transition-colors whitespace-nowrap"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Add Student
                  </button>
                </div>
              </div>

              {/* Row 2: Secondary Dropdown Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* Month Filter */}
                <div className="relative min-w-0">
                  <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43]">
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="appearance-none w-full h-8 rounded-xl bg-transparent px-2.5 pr-7 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                    >
                      <option className={dropdownOptionClass} value={getCurrentMonthValue()}>Current Month ({getCurrentMonthLabel().slice(0, 3)})</option>
                      <option className={dropdownOptionClass} value="all">All Time</option>
                      <option className={dropdownOptionClass} value="2026-07">July 2026</option>
                      <option className={dropdownOptionClass} value="2026-06">June 2026</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                {/* Access Filter */}
                <div className="relative min-w-0">
                  <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43]">
                    <select
                      value={accessFilter}
                      onChange={(e) => setAccessFilter(e.target.value)}
                      className="appearance-none w-full h-8 rounded-xl bg-transparent px-2.5 pr-7 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                    >
                      <option className={dropdownOptionClass} value="all">Access: All</option>
                      <option className={dropdownOptionClass} value="paid">Paid</option>
                      <option className={dropdownOptionClass} value="college">College</option>
                      <option className={dropdownOptionClass} value="free">Free</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                {/* Program Filter */}
                <div className="relative min-w-0">
                  <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43]">
                    <select
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value)}
                      className="appearance-none w-full h-8 rounded-xl bg-transparent px-2.5 pr-7 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer truncate"
                    >
                      <option className={dropdownOptionClass} value="">All Programs</option>
                      {filterOptions.programs.map((p) => (
                        <option className={dropdownOptionClass} key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative min-w-0">
                  <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43]">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none w-full h-8 rounded-xl bg-transparent px-2.5 pr-7 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                    >
                      <option className={dropdownOptionClass} value="all">Status: All</option>
                      <option className={dropdownOptionClass} value="active">Active</option>
                      <option className={dropdownOptionClass} value="completed">Completed</option>
                      <option className={dropdownOptionClass} value="expired">Expired</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                {/* College Filter */}
                <div className="relative min-w-0">
                  <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43]">
                    <select
                      value={collegeFilter}
                      onChange={(e) => setCollegeFilter(e.target.value)}
                      className="appearance-none w-full h-8 rounded-xl bg-transparent px-2.5 pr-7 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer truncate"
                    >
                      <option className={dropdownOptionClass} value="">All Colleges</option>
                      {filterOptions.colleges.map((c) => (
                        <option className={dropdownOptionClass} key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Container (Compact for viewport fit) */}
            <div className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl shadow-sm overflow-hidden flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading student records...</div>
              ) : studentsData.items.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No students found in this view.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[calc(100vh-360px)] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    
                    {/* TAB Headers */}
                    {activeTab === 'enrolled' && (
                      <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#0b1736]/90 backdrop-blur-md">
                        <tr className="border-b border-black/10 dark:border-white/10 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wider whitespace-nowrap">
                          <th className="py-2.5 px-3 w-8"></th>
                          <th className="py-2.5 px-2 w-8">#</th>
                          <th className="py-2.5 px-3 max-w-[220px]">Student</th>
                          <th className="py-2.5 px-3">College</th>
                          <th className="py-2.5 px-3">Access</th>
                          <th className="py-2.5 px-3">Program</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Enrolled On</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                    )}

                    {activeTab === 'leads' && (
                      <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#0b1736]/90 backdrop-blur-md">
                        <tr className="border-b border-black/10 dark:border-white/10 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wider whitespace-nowrap">
                          <th className="py-2.5 px-3 w-8"></th>
                          <th className="py-2.5 px-2 w-8">#</th>
                          <th className="py-2.5 px-3 max-w-[220px]">Student</th>
                          <th className="py-2.5 px-3">Goal / Target Role</th>
                          <th className="py-2.5 px-3">Target Companies</th>
                          <th className="py-2.5 px-3">Source</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Last Activity</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                    )}

                    {activeTab === 'skill' && (
                      <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#0b1736]/90 backdrop-blur-md">
                        <tr className="border-b border-black/10 dark:border-white/10 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wider whitespace-nowrap">
                          <th className="py-2.5 px-3 w-8"></th>
                          <th className="py-2.5 px-2 w-8">#</th>
                          <th className="py-2.5 px-3 max-w-[220px]">Student</th>
                          <th className="py-2.5 px-3">College</th>
                          <th className="py-2.5 px-3">Access</th>
                          <th className="py-2.5 px-3">Skill Program</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Enrolled On</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                    )}

                    {activeTab === 'exploring' && (
                      <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-[#0b1736]/90 backdrop-blur-md">
                        <tr className="border-b border-black/10 dark:border-white/10 text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wider whitespace-nowrap">
                          <th className="py-2.5 px-3 w-8"></th>
                          <th className="py-2.5 px-2 w-8">#</th>
                          <th className="py-2.5 px-3 max-w-[220px]">Student</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">College</th>
                          <th className="py-2.5 px-3">Goal</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Joined On</th>
                          <th className="py-2.5 px-3 whitespace-nowrap">Last Activity</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                    )}

                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {studentsData.items.map((student, idx) => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                          <tr
                            key={student.id}
                            onClick={(e) => {
                              // Don't trigger modal if user clicks directly on interactive inputs/buttons
                              if (e.target.closest('input, button')) return;
                              setSelectedReportStudent(student);
                            }}
                            className="hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                          >
                            
                            {/* Checkbox */}
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectToggle(student.id)}
                                className="w-3 h-3 rounded border-black/15 dark:border-white/20 text-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                              />
                            </td>

                            <td className="py-2.5 px-2 font-medium text-black/40 dark:text-white/40 text-[11px]">{idx + 1}</td>

                            {/* Student Info */}
                            <td className="py-2.5 px-3 max-w-[220px]">
                              <div
                                className="text-left group block truncate max-w-full"
                              >
                                <span className="font-bold text-slate-800 dark:text-white group-hover:text-[#3C83F6] dark:group-hover:text-[#7fb1ff] transition-colors truncate block">
                                  {student.name}
                                </span>
                                <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate">
                                  {student.email}
                                </span>
                              </div>
                            </td>

                            {/* ENROLLED TAB COLUMNS */}
                            {activeTab === 'enrolled' && (
                              <>
                                <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  {student.college}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    student.access === 'Paid' ? 'bg-[#efe6d2] text-[#d17d00] dark:bg-[#4f4228] dark:text-[#fcd34d]' :
                                    student.access === 'College' ? 'bg-[#dbe7ff] text-[#3c83f6]' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                  }`}>
                                    {student.access}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  {student.programs.length > 0 ? (
                                    student.programs.length === 1 ? student.programs[0] : `${student.programs.length} Programs`
                                  ) : 'Placement Sprint'}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {formatDateValue(student.enrolledOn)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    student.status === 'Active' ? 'bg-[#16a34a] text-white' :
                                    student.status === 'Completed' ? 'bg-[#efe6d2] text-[#d17d00] dark:bg-[#4f4228] dark:text-[#fcd34d]' :
                                    'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                                  }`}>
                                    {student.status}
                                  </span>
                                </td>
                              </>
                            )}

                            {/* LEADS TAB COLUMNS */}
                            {activeTab === 'leads' && (
                              <>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                  {student.targetRole || student.goal}
                                </td>
                                <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {student.targetCompanies && student.targetCompanies.length > 0 ? student.targetCompanies.join(', ') : '—'}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                                    {student.source}
                                  </span>
                                  {student.pricingExitReason && (
                                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                      {student.pricingExitReason}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {student.lastActivity}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe7ff] text-[#3c83f6]">
                                    Interested
                                  </span>
                                </td>
                              </>
                            )}

                            {/* SKILL TAB COLUMNS */}
                            {activeTab === 'skill' && (
                              <>
                                <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                                  {student.college}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    student.skillAccess === 'Paid' ? 'bg-[#efe6d2] text-[#d17d00] dark:bg-[#4f4228] dark:text-[#fcd34d]' : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                  }`}>
                                    {student.skillAccess}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                  {student.programs.find(p => p.toLowerCase().includes('skill')) || 'Java Full Stack Skill'}
                                </td>
                                <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatDateValue(student.enrolledOn)}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#16a34a] text-white">
                                    {student.status}
                                  </span>
                                </td>
                              </>
                            )}

                            {/* EXPLORING TAB COLUMNS */}
                            {activeTab === 'exploring' && (
                              <>
                                <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {student.email}
                                </td>
                                <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                                  {student.college}
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                  {student.goal}
                                </td>
                                <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatDateValue(student.enrolledOn)}
                                </td>
                                <td className="py-2.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                                  {student.lastActivity}
                                </td>
                              </>
                            )}

                            {/* Actions Column */}
                            <td className="py-2.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedReportStudent(student)}
                                title="View Student Report"
                                className="p-1 rounded-lg text-black/40 hover:text-[#3C83F6] dark:text-white/40 dark:hover:text-[#7fb1ff] hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-block"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditStudent(student)}
                                title="Edit Student"
                                className="p-1 rounded-lg text-black/40 hover:text-[#3C83F6] dark:text-white/40 dark:hover:text-[#7fb1ff] hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-block"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPendingDeleteStudent(student)}
                                title="Permanently Delete Student"
                                className="p-1 rounded-lg text-black/40 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors inline-block"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedStudentIds.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43]/85 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-300">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'student' : 'students'} selected
                </span>
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <button
                  onClick={handleClearSelection}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="px-3.5 py-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <FiTrash2 className="w-3 h-3" />
                  Delete Selected
                </button>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Student Report Modal (Shared with Program Students) */}
      {selectedReportStudent && (
        <StudentReportModal
          isOpen={Boolean(selectedReportStudent)}
          studentId={selectedReportStudent.id || selectedReportStudent._id}
          studentBasic={selectedReportStudent}
          onClose={() => setSelectedReportStudent(null)}
        />
      )}
    </>
  );
}
