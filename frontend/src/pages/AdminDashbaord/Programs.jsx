import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI } from '../../services/adminApi';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiFolder,
  FiUsers,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiGrid,
  FiCheckSquare,
  FiMoreHorizontal,
} from 'react-icons/fi';

const PROGRAM_TYPES = ['Placement', 'Skill'];

const getProgramType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'placement' || normalized.includes('placement') ? 'Placement' : 'Skill';
};

const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';

const statusBadgeClass = (status) => {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (status === 'Draft') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (status === 'Archived') return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
};

export default function Programs() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('programType') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedMonth] = useState(searchParams.get('month') || '');
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');

  // Bulk Selection State
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    programType: 'Placement',
    duration: '',
    status: 'Draft',
    visibility: 'Public',
    pricingType: 'Free',
    programFee: '0',
    learningGoalsText: '',
    placementCategoriesText: '',
    targetCompaniesText: '',
    skillTagsText: '',
    targetRolesText: '',
    accessTier: 'Both',
  });

  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: searchTerm,
        programType: selectedType,
        status: selectedStatus,
        month: selectedMonth,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      };
      const res = await adminAPI.getPrograms(params);
      if (res && res.success) {
        setPrograms(res.programs || []);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err.message || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedStatus, selectedMonth, sortBy, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSelectToggle = (id) => {
    setSelectedProgramIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedProgramIds([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedProgramIds.map((id) => adminAPI.deleteProgram(id)));
      await fetchPrograms();
      setSelectedProgramIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to bulk delete programs:', err);
      alert(err.message || 'Failed to bulk delete selected programs.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      description: '',
      programType: 'Placement',
      duration: '30 Days',
      status: 'Draft',
      visibility: 'Public',
      pricingType: 'Free',
      programFee: '0',
      learningGoalsText: 'Get Placed',
      placementCategoriesText: 'Product Based, Service Based',
      targetCompaniesText: '',
      skillTagsText: '',
      targetRolesText: '',
      accessTier: 'Both',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (program, e) => {
    if (e) e.stopPropagation();
    setEditingProgram(program);
    setFormData({
      name: program.name || '',
      description: program.description || '',
      programType: getProgramType(program.programType),
      duration: program.duration || '',
      status: program.status || 'Draft',
      visibility: program.visibility || 'Public',
      pricingType: program.pricingType || 'Free',
      programFee: String(program.programFee || 0),
      learningGoalsText: Array.isArray(program.learningGoals) ? program.learningGoals.join(', ') : '',
      placementCategoriesText: Array.isArray(program.placementCategories) ? program.placementCategories.join(', ') : '',
      targetCompaniesText: Array.isArray(program.targetCompanies) ? program.targetCompanies.join(', ') : '',
      skillTagsText: Array.isArray(program.skillTags) ? program.skillTags.join(', ') : '',
      targetRolesText: Array.isArray(program.targetRoles) ? program.targetRoles.join(', ') : '',
      accessTier: program.accessTier || 'Both',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    setModalError('');

    const finalType = formData.programType.trim();

    if (!formData.name.trim()) { setModalError('Program name is required'); return; }
    if (!finalType) { setModalError('Program type is required'); return; }
    if (!formData.duration.trim()) { setModalError('Duration is required'); return; }
    if (formData.pricingType === 'Paid') {
      const feeNum = Number(formData.programFee);
      if (isNaN(feeNum) || feeNum < 0) { setModalError('Valid non-negative fee is required for Paid programs'); return; }
    }

    const parseCommaString = (str) =>
      (str || '').split(',').map((item) => item.trim()).filter(Boolean);

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        programType: finalType,
        duration: formData.duration.trim(),
        status: formData.status,
        visibility: formData.visibility,
        pricingType: formData.pricingType,
        programFee: formData.pricingType === 'Paid' ? Number(formData.programFee) : 0,
        learningGoals: parseCommaString(formData.learningGoalsText),
        placementCategories: parseCommaString(formData.placementCategoriesText),
        targetCompanies: parseCommaString(formData.targetCompaniesText),
        skillTags: parseCommaString(formData.skillTagsText),
        targetRoles: parseCommaString(formData.targetRolesText),
        accessTier: formData.accessTier || 'Both',
      };

      if (editingProgram) {
        await adminAPI.updateProgram(editingProgram._id, payload);
      } else {
        await adminAPI.createProgram(payload);
      }

      setIsModalOpen(false);
      fetchPrograms();
    } catch (err) {
      console.error('Error saving program:', err);
      setModalError(err.message || 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    try {
      setDeleting(true);
      await adminAPI.deleteProgram(programToDelete._id);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (err) {
      console.error('Error deleting program:', err);
      alert(err.message || 'Failed to delete program');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setSearchParams({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const programFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  const activeCount = programs.filter(p => p.status === 'Active').length;
  const draftCount = programs.filter(p => p.status === 'Draft').length;
  const totalStudents = programs.reduce((sum, p) => sum + (p.studentCount || 0), 0);

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Background Gradient — matches Question Bank exactly */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      <Sidebar />

      {/* Single Delete Confirmation Modal */}
      {programToDelete && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setProgramToDelete(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">Delete Program?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{programToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setProgramToDelete(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProgram}
                disabled={deleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Bulk Delete Programs?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the {selectedProgramIds.length} selected programs? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Program Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                {editingProgram ? 'Edit Program' : 'Create Program'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sm text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmitProgram} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 min-h-0">
                {modalError && (
                  <p className="text-sm text-red-500 dark:text-red-400">{modalError}</p>
                )}

                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Program Name*</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. 30-Day Placement Sprint – August 2026"
                    value={formData.name}
                    onChange={handleFormChange}
                    className={programFormInputClass}
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Provide an overview of this learning program..."
                    value={formData.description}
                    onChange={handleFormChange}
                    className={programFormInputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Program Type*</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="programType"
                        value={formData.programType}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        {PROGRAM_TYPES.map((t) => (
                          <option key={t} className={dropdownOptionClass} value={t}>{t}</option>
                        ))}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Duration*</label>
                    <input
                      type="text"
                      name="duration"
                      required
                      placeholder="e.g. 30 Days, 6 Months"
                      value={formData.duration}
                      onChange={handleFormChange}
                      className={programFormInputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="Active">Active</option>
                        <option className={dropdownOptionClass} value="Draft">Draft</option>
                        <option className={dropdownOptionClass} value="Archived">Archived</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Visibility</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="Public">Public</option>
                        <option className={dropdownOptionClass} value="Private">Private</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Pricing</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="pricingType"
                        value={formData.pricingType}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="Free">Free</option>
                        <option className={dropdownOptionClass} value="Paid">Paid</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  {formData.pricingType === 'Paid' && (
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Program Fee (₹)*</label>
                      <input
                        type="number"
                        name="programFee"
                        min="0"
                        step="any"
                        required
                        placeholder="e.g. 4999"
                        value={formData.programFee}
                        onChange={handleFormChange}
                        className={programFormInputClass}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-1 border-t border-black/5 dark:border-white/5 space-y-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#3C83F6] dark:text-[#bceaff] pt-1">Student Matching Metadata</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Skill Tags</label>
                      <input
                        type="text"
                        name="skillTagsText"
                        placeholder="Java, Python, React"
                        value={formData.skillTagsText}
                        onChange={handleFormChange}
                        className={programFormInputClass}
                      />
                    </div>

                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Target Companies</label>
                      <input
                        type="text"
                        name="targetCompaniesText"
                        placeholder="Google, Amazon, TCS"
                        value={formData.targetCompaniesText}
                        onChange={handleFormChange}
                        className={programFormInputClass}
                      />
                    </div>

                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Placement Categories</label>
                      <input
                        type="text"
                        name="placementCategoriesText"
                        placeholder="Product Based, Service Based"
                        value={formData.placementCategoriesText}
                        onChange={handleFormChange}
                        className={programFormInputClass}
                      />
                    </div>

                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Access Tier</label>
                      <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                        <select
                          name="accessTier"
                          value={formData.accessTier}
                          onChange={handleFormChange}
                          className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                        >
                          <option className={dropdownOptionClass} value="Both">Both (Free &amp; Member)</option>
                          <option className={dropdownOptionClass} value="Free">Free Tier Only</option>
                          <option className={dropdownOptionClass} value="Member">Member Tier Only</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-[#0a1737]/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] hover:bg-[#2f73e0] text-white transition-colors disabled:opacity-70 shadow-sm"
                >
                  {saving ? 'Saving...' : editingProgram ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-screen transition-all duration-700 ease-in-out z-10 lg:ml-64 pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              <div className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <button onClick={fetchPrograms} className="font-semibold underline underline-offset-2">Retry</button>
              </div>
            </div>
          )}

          {/* Page Title */}
          <div>
            <h1 className="admin-page-title">Programs</h1>
          </div>

          {/* Stat Cards — match the Program Details layout */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{pagination.total || programs.length}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Total Programs</span>
                <FiFolder className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{activeCount}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Active Programs</span>
                <FiCheckSquare className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{draftCount}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Draft Programs</span>
                <FiGrid className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{totalStudents}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Total Students</span>
                <FiUsers className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>
          </section>

          {/* Program Listing Section */}
          <section className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              {/* Left Column: Title, Select All & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">All Programs</h2>

                <div className="flex items-center gap-2 px-2.5 py-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-9 shrink-0">
                  <input
                    type="checkbox"
                    checked={programs.length > 0 && programs.every(p => selectedProgramIds.includes(p._id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newSelections = new Set([...selectedProgramIds, ...programs.map(p => p._id)]);
                        setSelectedProgramIds(Array.from(newSelections));
                      } else {
                        setSelectedProgramIds(selectedProgramIds.filter(id => !programs.some(p => p._id === id)));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                  />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">Select All</span>
                </div>

                {/* Search Bar cleanly placed on left */}
                <div className="relative w-44 sm:w-60">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-9 pr-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[11px] font-bold text-slate-800 dark:text-white placeholder:font-normal placeholder:text-black/40 dark:placeholder:text-white/40 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 w-full"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <FiX className="w-3 h-3 text-black/40 dark:text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Dropdowns + Clear + Add Button */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter Dropdown */}
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="appearance-none h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-2.5 pr-7 text-[11px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 cursor-pointer max-w-[130px] text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    <option className={dropdownOptionClass} value="">All Types</option>
                    {PROGRAM_TYPES.map((t) => (
                      <option key={t} className={dropdownOptionClass} value={t}>{t}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-black/45 dark:text-white/60" />
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-2.5 pr-7 text-[11px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 cursor-pointer"
                  >
                    <option className={dropdownOptionClass} value="">All Statuses</option>
                    <option className={dropdownOptionClass} value="Active">Active</option>
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                    <option className={dropdownOptionClass} value="Archived">Archived</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-black/45 dark:text-white/60" />
                </div>

                {(searchTerm || selectedType || selectedStatus || selectedMonth) && (
                  <button
                    onClick={handleClearFilters}
                    className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <FiX className="w-3 h-3" /> Clear
                  </button>
                )}

                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-4 text-xs font-bold transition-colors shadow-sm shrink-0"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Program
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <LoadingScreen />
              </div>
            ) : programs.length === 0 ? (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-16 text-center shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
                <div className="w-14 h-14 rounded-2xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center mx-auto mb-4">
                  <FiFolder className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  {searchTerm || selectedType || selectedStatus ? 'No Programs Found' : 'No Programs Yet'}
                </h3>
                <p className="text-sm text-black/45 dark:text-white/45 mb-6">
                  {searchTerm || selectedType || selectedStatus
                    ? 'Try adjusting your filters or search criteria.'
                    : 'Create a program to start building structured learning pathways.'}
                </p>
                {searchTerm || selectedType || selectedStatus ? (
                  <button
                    onClick={handleClearFilters}
                    className="h-9 px-5 rounded-xl border border-[#3C83F6]/30 bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#bceaff] text-xs font-semibold hover:bg-[#3C83F6]/20 transition-colors"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-5 text-xs font-bold transition-colors shadow-sm"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Add Program
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Program Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {programs.map((program) => (
                    <ProgramCard
                      key={program._id}
                      program={program}
                      selected={selectedProgramIds.includes(program._id)}
                      onSelectToggle={handleSelectToggle}
                      onEdit={handleOpenEditModal}
                      onDelete={setProgramToDelete}
                      onView={() => navigate(`/programs/${program._id}`)}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-xs font-medium text-black/50 dark:text-white/50">
                      Page {pagination.page} of {pagination.totalPages} · {pagination.total} programs
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FiChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Floating Bulk Action Bar — identical to Question Bank */}
          {selectedProgramIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3.5 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43]/85 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-300">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {selectedProgramIds.length} {selectedProgramIds.length === 1 ? 'program' : 'programs'} selected
              </span>
              <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
              <button
                onClick={handleClearSelection}
                className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Clear
              </button>
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── ProgramCard ─── styled after CategoryCard with Checkbox selection */
function ProgramCard({ program, selected, onSelectToggle, onEdit, onDelete, onView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.program-actions-container')) setMenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const statusColor = statusBadgeClass(program.status);

  return (
    <article className={`relative rounded-xl overflow-hidden border ${selected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] h-full flex flex-col justify-between hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group`}>
      {/* Checkbox — top-left */}
      <div className="absolute left-3 top-2.5 z-20">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectToggle(program._id)}
          className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30"
        />
      </div>

      {/* Three-dot menu — top-right */}
      <div className="absolute right-2 top-2 z-20 program-actions-container">
        <button
          type="button"
          className="w-6 h-6 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          aria-label="Open program actions"
        >
          <FiMoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 w-36 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => { setMenuOpen(false); onView(); }}
              className="w-full text-left px-3 py-2 text-xs text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => { setMenuOpen(false); onEdit(program); }}
              className="w-full text-left px-3 py-2 text-xs text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(program); }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Tinted Top Panel — Fixed height for 100% uniform card grid layout */}
      <div
        className="px-4 pt-2.5 pb-2 min-h-[92px] border-b border-black/10 dark:border-white/15 bg-[#dbe7f3]/90 dark:bg-[#1a2d48] pl-10 pr-9 flex flex-col justify-between cursor-pointer"
        onClick={onView}
      >
        <span className={`inline-flex self-start px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColor}`}>
          {program.status}
        </span>
        <div className="min-h-[30px] flex items-center py-0.5">
          <h3 className="text-xs md:text-sm leading-tight font-bold text-slate-900 dark:text-white line-clamp-2">{program.name}</h3>
        </div>
        <p className="text-[10px] md:text-[11px] leading-snug text-slate-500 dark:text-slate-400 truncate pb-0.5">
          {getProgramType(program.programType)}
        </p>
      </div>

      {/* Bottom Panel */}
      <div className="px-4 py-3.5 flex-1 flex flex-col justify-between gap-3 text-left bg-white/70 dark:bg-transparent">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400">
            <span>Duration</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate max-w-[100px]">{program.duration || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400">
            <span>Students</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{program.studentCount || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400">
            <span>Pricing</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {program.pricingType === 'Paid' ? `₹${program.programFee}` : 'Free'}
            </span>
          </div>
        </div>

        <button
          onClick={onView}
          className="w-full h-9 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <FiEye className="w-3.5 h-3.5" /> View Program
        </button>
      </div>
    </article>
  );
}
