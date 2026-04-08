import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiDownload, FiEdit2, FiEye, FiPlus, FiSearch, FiTrash2, FiUpload } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyStudents } from '../../data/adminEmptyStates';

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

const normalizeStudent = (student) => ({
  ...student,
  id: student.id || student._id || `${student.email || 'student'}-${student.batch || 'batch'}`,
  name: student.name || 'Unnamed Student',
  email: student.email || '',
  college: student.college || '',
  batch: student.batch || '',
  track: student.track || 'General Track',
  score: Number(student.score || 0),
  streak: Number(student.streak || 0),
  status: student.status || 'Active',
  testsTaken: typeof student.testsTaken === 'number' ? student.testsTaken : null,
  lastActive: student.lastActive || null,
  joined: student.joined || null,
});

const formatDateValue = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#020b23]/90 shadow-2xl">
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
          <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredRoutes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for "{searchQuery}"</div>
          ) : filteredRoutes.map((route) => (
            <button key={route.id} onClick={() => { onClose(); navigate(`/${route.id}`); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-left">
              <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white">{route.title}</h4>
              <span className="text-black/20 dark:text-white/20">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const StudentModal = ({ student, onClose }) => {
  if (!student) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-black/10 bg-[#e8edf4] p-4 text-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px] font-semibold break-words">{student.name}</h2>
          <button onClick={onClose} className="text-xl leading-none text-slate-500 hover:text-slate-700" aria-label="Close student detail">×</button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[15px]">
          <div><span className="text-slate-500">Email:</span> <span className="font-medium break-all">{student.email || 'Not available'}</span></div>
          <div><span className="text-slate-500">College:</span> <span className="font-semibold break-words">{student.college || 'Not available'}</span></div>
          <div><span className="text-slate-500">Batch:</span> <span className="font-medium break-words">{student.batch || 'Not available'}</span></div>
          <div><span className="text-slate-500">Track:</span> <span className="font-semibold break-words">{student.track || 'Not available'}</span></div>
          <div><span className="text-slate-500">Score:</span> <span className="inline-flex rounded-full bg-emerald-600 text-white font-semibold px-2 py-0.5 text-[0.76em]">{student.score}%</span></div>
          <div><span className="text-slate-500">Streak:</span> <span className="font-medium">{student.streak} days</span></div>
          <div><span className="text-slate-500">Tests Taken:</span> <span className="font-medium">{student.testsTaken ?? 'Not available'}</span></div>
          <div><span className="text-slate-500">Last Active:</span> <span className="font-medium">{formatDateValue(student.lastActive)}</span></div>
          <div><span className="text-slate-500">Status:</span> <span className={`inline-flex rounded-full text-white font-semibold px-2 py-0.5 text-[0.76em] ${student.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-500'}`}>{student.status}</span></div>
          <div><span className="text-slate-500">Joined:</span> <span className="font-medium">{formatDateValue(student.joined)}</span></div>
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
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [students, setStudents] = useState(emptyStudents);
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', collegeId: '', batchId: '', track: '', status: 'Active' });
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [trackFilter, setTrackFilter] = useState('All Tracks');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportReport, setBulkImportReport] = useState(null);
  const searchInputRef = useRef(null);
  const bulkImportInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  const loadStudentsData = useCallback(async () => {
    const [remoteStudents, remoteColleges, remoteBatches] = await Promise.all([
      adminAPI.getStudents(),
      adminAPI.getColleges(),
      adminAPI.getBatches(),
    ]);
    setStudents(preferRemoteData(remoteStudents, emptyStudents).map(normalizeStudent));
    setColleges(preferRemoteData(remoteColleges, []).map((college) => ({ id: college.id || college._id, name: college.name || 'Untitled College' })));
    setBatches(preferRemoteData(remoteBatches, []).map((batch) => ({ id: batch.id || batch._id, name: batch.name || batch.id || 'Untitled Batch', college: batch.college || '' })));
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    loadStudentsData().catch(() => {
      if (!cancelled) {
        setStudents(emptyStudents);
        setColleges([]);
        setBatches([]);
      }
    });
    return () => { cancelled = true; };
  }, [loadStudentsData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen((prev) => !prev); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter((route) =>
    route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const uniqueColleges = ['All Colleges', ...new Set(students.map((student) => student.college).filter(Boolean))];
  const uniqueTracks = ['All Tracks', ...new Set(students.map((student) => student.track).filter(Boolean))];
  const filteredStudents = students.filter((student) => {
    const matchesCollege = collegeFilter === 'All Colleges' || student.college === collegeFilter;
    const matchesTrack = trackFilter === 'All Tracks' || student.track === trackFilter;
    const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
    const matchesSearch = !tableSearch || student.name.toLowerCase().includes(tableSearch.toLowerCase()) || student.email.toLowerCase().includes(tableSearch.toLowerCase()) || student.batch.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesCollege && matchesTrack && matchesStatus && matchesSearch;
  });
  const filteredBatchOptions = useMemo(() => {
    if (!studentForm.collegeId) return batches;
    const selectedCollege = colleges.find((college) => college.id === studentForm.collegeId);
    if (!selectedCollege) return batches;
    return batches.filter((batch) => batch.college === selectedCollege.name);
  }, [studentForm.collegeId, batches, colleges]);

  const openAddStudent = () => {
    setEditingStudentId(null);
    setFormError('');
    setStudentForm({ name: '', email: '', collegeId: '', batchId: '', track: '', status: 'Active' });
    setIsAddFormOpen(true);
  };

  const openEditStudent = (student) => {
    const matchingCollege = colleges.find((college) => college.name === student.college);
    const matchingBatch = batches.find((batch) => batch.name === student.batch);
    setEditingStudentId(student.id);
    setFormError('');
    setStudentForm({
      name: student.name || '',
      email: student.email || '',
      collegeId: matchingCollege?.id || '',
      batchId: matchingBatch?.id || '',
      track: student.track || '',
      status: student.status || 'Active',
    });
    setIsAddFormOpen(true);
  };

  const saveStudent = async () => {
    if (!studentForm.name.trim()) return setFormError('Name is required');
    if (!studentForm.email.trim()) return setFormError('Email is required');
    if (!studentForm.collegeId) return setFormError('College is required');
    if (!studentForm.batchId) return setFormError('Batch is required');

    setFormError('');
    setIsSavingStudent(true);
    try {
      const payload = {
        name: studentForm.name.trim(),
        email: studentForm.email.trim().toLowerCase(),
        collegeId: studentForm.collegeId,
        batchId: studentForm.batchId,
        primaryTrack: studentForm.track.trim() || 'General Track',
        status: studentForm.status,
      };
      if (editingStudentId) await adminAPI.updateStudent(editingStudentId, payload);
      else await adminAPI.createStudent(payload);
      await loadStudentsData();
      setIsAddFormOpen(false);
      setEditingStudentId(null);
    } catch (error) {
      setFormError(error.message || 'Failed to save student');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const deleteStudent = async () => {
    if (!pendingDeleteStudent?.id) return;
    setFormError('');
    setIsDeletingStudent(true);
    try {
      await adminAPI.deleteStudent(pendingDeleteStudent.id);
      await loadStudentsData();
      setPendingDeleteStudent(null);
    } catch (error) {
      setFormError(error.message || 'Failed to delete student');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const triggerBulkImport = () => bulkImportInputRef.current?.click();

  const downloadBulkTemplate = () => {
    const templateCsv = [
      'name,email,college,batch,track,status',
      'Jane Doe,jane.doe@example.com,ABC College,Batch 2026,Frontend,Active',
      'John Smith,john.smith@example.com,ABC College,Batch 2026,Backend,Inactive',
    ].join('\n');

    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students-bulk-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvRows = (text) => {
    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        if (current.length > 0 || row.length > 0) {
          row.push(current.trim());
          rows.push(row);
          row = [];
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  };

  const normalizeHeader = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '');

  const handleBulkImportSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      setBulkImportReport({
        type: 'failed',
        imported: 0,
        failed: 1,
        failures: ['Only CSV files are supported for bulk import.'],
      });
      event.target.value = '';
      return;
    }

    setFormError('');
    setIsBulkImporting(true);

    try {
      const rawText = await file.text();
      const parsedRows = parseCsvRows(rawText);

      if (parsedRows.length < 2) {
        throw new Error('CSV must include a header and at least one data row.');
      }

      const [headerRow, ...dataRows] = parsedRows;
      const headerMap = new Map(headerRow.map((header, index) => [normalizeHeader(header), index]));

      const getCell = (row, ...keys) => {
        for (const key of keys) {
          const index = headerMap.get(normalizeHeader(key));
          if (index !== undefined) return String(row[index] || '').trim();
        }
        return '';
      };

      const collegeMap = new Map(
        colleges.map((college) => [String(college.name || '').trim().toLowerCase(), college.id])
      );
      const batchMap = new Map(
        batches.map((batch) => [String(batch.name || '').trim().toLowerCase(), batch.id])
      );

      let successCount = 0;
      const failures = [];

      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
        const row = dataRows[rowIndex];
        const displayRow = rowIndex + 2;

        const name = getCell(row, 'name', 'studentname');
        const email = getCell(row, 'email', 'studentemail');
        const collegeName = getCell(row, 'college', 'collegename');
        const batchName = getCell(row, 'batch', 'batchname');
        const track = getCell(row, 'track', 'primarytrack');
        const status = getCell(row, 'status');

        if (!name || !email || !collegeName || !batchName) {
          failures.push(`Row ${displayRow}: missing required fields (name, email, college, batch).`);
          continue;
        }

        const collegeId = collegeMap.get(collegeName.toLowerCase());
        const batchId = batchMap.get(batchName.toLowerCase());

        if (!collegeId) {
          failures.push(`Row ${displayRow}: college \"${collegeName}\" was not found.`);
          continue;
        }
        if (!batchId) {
          failures.push(`Row ${displayRow}: batch \"${batchName}\" was not found.`);
          continue;
        }

        try {
          await adminAPI.createStudent({
            name,
            email: email.toLowerCase(),
            collegeId,
            batchId,
            primaryTrack: track || 'General Track',
            status: status || 'Active',
          });
          successCount += 1;
        } catch (error) {
          failures.push(`Row ${displayRow}: ${error?.message || 'failed to import.'}`);
        }
      }

      if (successCount > 0) {
        await loadStudentsData();
      }

      if (failures.length > 0) {
        setBulkImportReport({
          type: successCount > 0 ? 'partial' : 'failed',
          imported: successCount,
          failed: failures.length,
          failures,
        });
      } else {
        setBulkImportReport({
          type: 'success',
          imported: successCount,
          failed: 0,
          failures: [],
        });
      }
    } catch (error) {
      setFormError(error?.message || 'Bulk import failed.');
      setBulkImportReport({
        type: 'failed',
        imported: 0,
        failed: 1,
        failures: [error?.message || 'Bulk import failed.'],
      });
    } finally {
      setIsBulkImporting(false);
      event.target.value = '';
    }
  };

  if (!mounted) return null;

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchInputRef={searchInputRef} filteredRoutes={filteredRoutes} navigate={navigate} />
      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />

      <input ref={bulkImportInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkImportSelection} />

      {pendingDeleteStudent && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPendingDeleteStudent(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Delete Student</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">Delete {pendingDeleteStudent.name} from the list?</p>
              {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button onClick={() => setPendingDeleteStudent(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5">Cancel</button>
              <button onClick={deleteStudent} disabled={isDeletingStudent} className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors">{isDeletingStudent ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {bulkImportReport && (
        <div className="fixed inset-0 z-[136] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setBulkImportReport(null)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Bulk Import Report</h3>
              <p className="text-sm text-black/55 dark:text-white/55 mt-1">
                {bulkImportReport.type === 'success' && 'Import completed successfully.'}
                {bulkImportReport.type === 'partial' && 'Import completed with partial failures.'}
                {bulkImportReport.type === 'failed' && 'Import failed.'}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center rounded-full bg-emerald-500 text-white px-2.5 py-1 font-semibold">Imported: {bulkImportReport.imported}</span>
                <span className="inline-flex items-center rounded-full bg-rose-500 text-white px-2.5 py-1 font-semibold">Failed: {bulkImportReport.failed}</span>
              </div>
              {bulkImportReport.failures.length > 0 && (
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 max-h-56 overflow-y-auto">
                  <p className="text-xs font-semibold text-black/65 dark:text-white/65 mb-2">Row Errors</p>
                  <ul className="space-y-1.5 text-xs text-rose-600 dark:text-rose-300">
                    {bulkImportReport.failures.map((failure, index) => (
                      <li key={`${failure}-${index}`}>{failure}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end">
              <button onClick={() => setBulkImportReport(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5">Close</button>
            </div>
          </div>
        </div>
      )}

      {isAddFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsAddFormOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">{editingStudentId ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setIsAddFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={studentForm.name} onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Student name" className="w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5" />
                <input type="email" value={studentForm.email} onChange={(e) => setStudentForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Student email" className="w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <select value={studentForm.collegeId} onChange={(e) => setStudentForm((prev) => ({ ...prev, collegeId: e.target.value, batchId: '' }))} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                    <option value="">Select college</option>
                    {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                </div>
                <div className="relative">
                  <select value={studentForm.batchId} onChange={(e) => setStudentForm((prev) => ({ ...prev, batchId: e.target.value }))} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                    <option value="">Select batch</option>
                    {filteredBatchOptions.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={studentForm.track} onChange={(e) => setStudentForm((prev) => ({ ...prev, track: e.target.value }))} placeholder="Primary track" className="w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5" />
                <div className="relative">
                  <select value={studentForm.status} onChange={(e) => setStudentForm((prev) => ({ ...prev, status: e.target.value }))} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                </div>
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button onClick={() => setIsAddFormOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5">Cancel</button>
                <button onClick={saveStudent} disabled={isSavingStudent} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70">{isSavingStudent ? 'Saving...' : editingStudentId ? 'Save Changes' : 'Add Student'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
        <main onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}>
          <div className="max-w-[1600px] mx-auto space-y-4">
            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div><h1 className="admin-page-title">Students</h1></div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <div className="flex flex-col sm:flex-row sm:flex-wrap xl:flex-nowrap items-stretch sm:items-center justify-end gap-2.5 mt-1">
              <div className="relative w-full sm:min-w-[190px] xl:min-w-[210px] sm:w-auto">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                <input type="text" placeholder="Search students..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="pl-9 pr-3 h-10 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 w-full" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} className="appearance-none h-10 text-sm pl-3.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 w-full sm:w-auto">{uniqueColleges.map((college) => <option key={college} value={college}>{college}</option>)}</select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className="appearance-none h-10 text-sm pl-3.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 w-full sm:w-auto">{uniqueTracks.map((track) => <option key={track} value={track}>{track}</option>)}</select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none h-10 text-sm pl-3.5 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 w-full sm:w-auto"><option value="All">All</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option></select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>
              <button onClick={triggerBulkImport} disabled={isBulkImporting} className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl border border-[#3C83F6]/20 text-[#3C83F6] dark:border-white/10 dark:text-white/60 hover:bg-[#3C83F6]/5 dark:hover:bg-white/5 text-sm font-medium whitespace-nowrap disabled:opacity-60"><FiUpload className="w-3.5 h-3.5" />{isBulkImporting ? 'Importing...' : 'Bulk Import'}</button>
              <button onClick={openAddStudent} className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl bg-[#3C83F6] border border-[#3C83F6]/20 text-white hover:bg-[#2f73e0] text-sm font-medium whitespace-nowrap"><FiPlus className="w-3.5 h-3.5" />Add Student</button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {filteredStudents.map((student) => (
                <article key={student.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1f43] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-black/85 dark:text-white break-words">{student.name}</h3>
                      <p className="mt-1 text-sm text-black/55 dark:text-white/60 break-all">{student.email}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center ${student.status === 'Active' ? 'border-emerald-500/20 text-white bg-emerald-500' : 'border-rose-400/20 text-white bg-rose-500'}`}>{student.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-black/45 dark:text-white/45">College</p><p className="mt-1 font-medium text-black/80 dark:text-white break-words">{student.college || 'Not available'}</p></div>
                    <div><p className="text-black/45 dark:text-white/45">Batch</p><p className="mt-1 font-medium text-black/80 dark:text-white break-words">{student.batch || 'Not available'}</p></div>
                    <div className="col-span-2"><p className="text-black/45 dark:text-white/45">Track</p><p className="mt-1 font-medium text-black/75 dark:text-white/70 break-words">{student.track}</p></div>
                    <div><p className="text-black/45 dark:text-white/45">Score</p><p className="mt-1 font-medium">{student.score}%</p></div>
                    <div><p className="text-black/45 dark:text-white/45">Streak</p><p className="mt-1 font-medium">{student.streak} days</p></div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button onClick={() => setSelectedStudent(student)} className="h-9 rounded-xl px-3 inline-flex items-center justify-center text-black/70 dark:text-white/70 hover:text-[#3C83F6] hover:bg-[#3C83F6]/10" aria-label={`View ${student.name}`}><FiEye className="w-4 h-4" /></button>
                    <button onClick={() => openEditStudent(student)} className="h-9 rounded-xl px-3 inline-flex items-center justify-center text-black/70 dark:text-white/70 hover:text-[#3C83F6] hover:bg-[#3C83F6]/10" aria-label={`Edit ${student.name}`}><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => setPendingDeleteStudent(student)} className="h-9 rounded-xl px-3 inline-flex items-center justify-center text-black/70 dark:text-white/70 hover:text-rose-500 hover:bg-rose-500/10" aria-label={`Delete ${student.name}`}><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </article>
              ))}
              {filteredStudents.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-black/40 dark:text-white/40">No students match your current filters.</div>}
            </div>

            <div className="hidden lg:block bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl overflow-auto max-h-[78vh]">
              <table className="w-full min-w-[1180px] table-fixed">
                <thead className="border-b-2 border-black/12 dark:border-white/12">
                  <tr className="sticky top-0 bg-white/95 dark:bg-[#13264c]/95 backdrop-blur">
                    {['Name', 'Email', 'College', 'Batch', 'Track', 'Score', 'Streak', 'Status', 'Actions'].map((col) => <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60">{col}</th>)}
                  </tr>
                </thead>
                <tbody className="border-t border-black/20 dark:border-white/10">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-black/12 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-sm font-semibold truncate">{student.name}</td>
                      <td className="px-4 py-3 text-[13px] truncate">{student.email}</td>
                      <td className="px-4 py-3 text-sm truncate">{student.college || 'Not available'}</td>
                      <td className="px-4 py-3 text-sm truncate">{student.batch || 'Not available'}</td>
                      <td className="px-4 py-3 text-sm truncate">{student.track}</td>
                      <td className="px-4 py-3 text-sm">{student.score}%</td>
                      <td className="px-4 py-3 text-sm">{student.streak} days</td>
                      <td className="px-4 py-3 text-sm">{student.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedStudent(student)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10" aria-label={`View ${student.name}`}><FiEye className="w-4 h-4" /></button>
                          <button onClick={() => openEditStudent(student)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10" aria-label={`Edit ${student.name}`}><FiEdit2 className="w-4 h-4" /></button>
                          <button onClick={() => setPendingDeleteStudent(student)} className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10" aria-label={`Delete ${student.name}`}><FiTrash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-black/40 dark:text-white/40">No students match your current filters.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-base font-medium text-black/45 dark:text-white/45">Showing {filteredStudents.length} of {students.length} students</p>
              <button onClick={downloadBulkTemplate} className="self-start sm:self-auto sm:ml-auto w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium whitespace-nowrap"><FiDownload className="w-3.5 h-3.5" />Download Template</button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Students;
