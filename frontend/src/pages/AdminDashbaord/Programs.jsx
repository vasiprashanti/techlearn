import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI } from '../../services/adminApi';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiUsers,
  FiLayers,
  FiClock,
  FiEye,
  FiTag,
  FiDollarSign,
  FiFilter,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiAlertTriangle,
} from 'react-icons/fi';

const PREDEFINED_PROGRAM_TYPES = [
  'Placement Sprint',
  'Full Stack Project Program',
  'Java Full Stack Skill Program',
  'AI & Machine Learning Program',
  'Data Science & Analytics',
  'Cybersecurity Bootcamp',
];

const statusBadgeClass = (status, isDarkMode) => {
  if (status === 'Active') {
    return isDarkMode
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      : 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }
  if (status === 'Draft') {
    return isDarkMode
      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      : 'bg-amber-100 text-amber-800 border border-amber-200';
  }
  if (status === 'Archived') {
    return isDarkMode
      ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
      : 'bg-slate-100 text-slate-700 border border-slate-200';
  }
  return isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800';
};

export default function Programs() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('programType') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get('month') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    programType: 'Placement Sprint',
    customType: '',
    duration: '',
    status: 'Draft',
    visibility: 'Public',
    pricingType: 'Free',
    programFee: '0',
  });

  // Delete modal
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Programs
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

  // Handle Form Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      description: '',
      programType: 'Placement Sprint',
      customType: '',
      duration: '30 Days',
      status: 'Draft',
      visibility: 'Public',
      pricingType: 'Free',
      programFee: '0',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (program, e) => {
    if (e) e.stopPropagation();
    setEditingProgram(program);
    const isCustom = !PREDEFINED_PROGRAM_TYPES.includes(program.programType);
    setFormData({
      name: program.name || '',
      description: program.description || '',
      programType: isCustom ? 'Other' : program.programType,
      customType: isCustom ? program.programType : '',
      duration: program.duration || '',
      status: program.status || 'Draft',
      visibility: program.visibility || 'Public',
      pricingType: program.pricingType || 'Free',
      programFee: String(program.programFee || 0),
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Save Program (Create or Update)
  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    setModalError('');

    const finalType =
      formData.programType === 'Other'
        ? formData.customType.trim()
        : formData.programType.trim();

    if (!formData.name.trim()) {
      setModalError('Program name is required');
      return;
    }
    if (!finalType) {
      setModalError('Program type is required');
      return;
    }
    if (!formData.duration.trim()) {
      setModalError('Duration is required');
      return;
    }

    if (formData.pricingType === 'Paid') {
      const feeNum = Number(formData.programFee);
      if (isNaN(feeNum) || feeNum < 0) {
        setModalError('Valid non-negative program fee is required for Paid programs');
        return;
      }
    }

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

  // Confirm Delete
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

  // Clear Filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedMonth('');
    setSearchParams({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#00113b] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                <FiFolder className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage learning programs, attach resources, and configure journeys
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shrink-0"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Program</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className={`p-4 rounded-2xl mb-6 shadow-sm border ${isDarkMode ? 'bg-[#0c1a3a]/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search programs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                }`}
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                }`}
              >
                <option value="">All Program Types</option>
                {PREDEFINED_PROGRAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                }`}
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                }`}
              />
              {(searchTerm || selectedType || selectedStatus || selectedMonth) && (
                <button
                  onClick={handleClearFilters}
                  title="Clear filters"
                  className={`p-2 rounded-xl border shrink-0 transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800 border-slate-700 text-slate-300' : 'hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingScreen />
          </div>
        ) : error ? (
          <div className={`p-6 rounded-2xl border text-center ${isDarkMode ? 'bg-red-950/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchPrograms}
              className="mt-3 px-4 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : programs.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDarkMode ? 'bg-[#0c1a3a]/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <FiFolder className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Programs Found</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {searchTerm || selectedType || selectedStatus || selectedMonth
                ? 'Try adjusting your filters or search criteria.'
                : 'Get started by creating your first platform Program.'}
            </p>
            {searchTerm || selectedType || selectedStatus || selectedMonth ? (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Create Program
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid of Programs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {programs.map((program) => (
                <div
                  key={program._id}
                  onClick={() => navigate(`/programs/${program._id}`)}
                  className={`group rounded-2xl p-6 border transition-all duration-200 shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between ${
                    isDarkMode
                      ? 'bg-[#0c1a3a]/90 hover:bg-[#122449] border-slate-800 hover:border-blue-500/50'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    {/* Program Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(program.status, isDarkMode)}`}>
                        {program.status}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditModal(program, e)}
                          title="Edit Program"
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgramToDelete(program);
                          }}
                          title="Delete Program"
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'
                          }`}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight mb-2 group-hover:text-blue-500 transition-colors line-clamp-1">
                      {program.name}
                    </h2>

                    {program.description && (
                      <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {program.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <FiTag className="w-3 h-3 text-blue-400" />
                        <span>{program.programType}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <FiClock className="w-3 h-3 text-indigo-400" />
                        <span>{program.duration}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        program.pricingType === 'Paid'
                          ? isDarkMode ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <FiDollarSign className="w-3 h-3 text-emerald-400" />
                        <span>{program.pricingType === 'Paid' ? `Fee: ${program.programFee}` : 'Free'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Resource Counts Footer */}
                  <div className={`pt-4 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1" title="Attached Students">
                        <FiUsers className="w-3.5 h-3.5 text-blue-400" />
                        <span>{program.studentCount} Students</span>
                      </span>
                      <span className="flex items-center gap-1" title="Attached Batches">
                        <FiLayers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{program.batchCount} Batches</span>
                      </span>
                    </div>

                    <span className="flex items-center gap-1 font-medium text-blue-500 group-hover:translate-x-1 transition-transform">
                      <span>View</span>
                      <FiArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between py-4">
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total programs)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className={`p-2 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className={`p-2 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* CREATE / EDIT PROGRAM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl border ${
              isDarkMode ? 'bg-[#0c1a3a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <h3 className="text-xl font-bold">
                {editingProgram ? 'Edit Program' : 'Create New Program'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitProgram} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Program Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. 30-Day Placement Sprint - August 2026"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Provide an overview of this learning program..."
                  value={formData.description}
                  onChange={handleFormChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                  }`}
                />
              </div>

              {/* Program Type & Custom Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                    Program Type *
                  </label>
                  <select
                    name="programType"
                    value={formData.programType}
                    onChange={handleFormChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                    }`}
                  >
                    {PREDEFINED_PROGRAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>

                {formData.programType === 'Other' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Custom Program Type *
                    </label>
                    <input
                      type="text"
                      name="customType"
                      required
                      placeholder="Specify program type"
                      value={formData.customType}
                      onChange={handleFormChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                      }`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      required
                      placeholder="e.g. 30 Days, 6 Months"
                      value={formData.duration}
                      onChange={handleFormChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                      }`}
                    />
                  </div>
                )}
              </div>

              {formData.programType === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                    Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    required
                    placeholder="e.g. 30 Days, 6 Months"
                    value={formData.duration}
                    onChange={handleFormChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                    }`}
                  />
                </div>
              )}

              {/* Status & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                    }`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleFormChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                    }`}
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                    Program Pricing
                  </label>
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="pricingType"
                        value="Free"
                        checked={formData.pricingType === 'Free'}
                        onChange={handleFormChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Free</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="pricingType"
                        value="Paid"
                        checked={formData.pricingType === 'Paid'}
                        onChange={handleFormChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Paid</span>
                    </label>
                  </div>
                </div>

                {formData.pricingType === 'Paid' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Program Fee *
                    </label>
                    <input
                      type="number"
                      name="programFee"
                      min="0"
                      step="any"
                      required
                      placeholder="e.g. 4999"
                      value={formData.programFee}
                      onChange={handleFormChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDarkMode ? 'bg-[#0c1a3a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Delete Program?</h3>
            </div>

            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to delete <span className="font-semibold text-white">{programToDelete.name}</span>?
            </p>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs mb-6 flex items-start gap-2">
              <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Deleting a Program removes only the Program record. Attached batches, courses, roadmaps, students, track templates, certificates, and projects will <strong>not</strong> be deleted.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() => setProgramToDelete(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteProgram}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Program'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
