import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI } from '../../services/adminApi';
import {
  FiArrowLeft,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiFolder,
  FiUsers,
  FiLayers,
  FiBookOpen,
  FiFileText,
  FiGitCommit,
  FiAward,
  FiClipboard,
  FiCheckCircle,
  FiSearch,
  FiX,
  FiExternalLink,
  FiChevronRight,
  FiAlertCircle,
  FiTag,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';

const SECTIONS = [
  { key: 'batches', label: 'Batches', icon: FiLayers, field: 'batchIds', route: '/batches' },
  { key: 'students', label: 'Students', icon: FiUsers, field: 'studentIds', route: '/students' },
  { key: 'courses', label: 'Courses', icon: FiBookOpen, field: 'courseIds', route: '/admin/courses' },
  { key: 'roadmaps', label: 'Roadmaps', icon: FiFileText, field: 'roadmapIds', route: '/admin/roadmaps' },
  { key: 'track-templates', label: 'Track Templates', icon: FiGitCommit, field: 'trackTemplateIds', route: '/track-templates' },
  { key: 'certificates', label: 'Certificates', icon: FiAward, field: 'certificateTemplateIds', route: '/certificates' },
  { key: 'projects', label: 'Projects', icon: FiClipboard, field: 'projectIds', route: '/admin/projects' },
];

export default function ProgramDetails() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // State
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('attachType') || 'batches');

  // Attach Modal State
  const [attachModalType, setAttachModalType] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [attaching, setAttaching] = useState(false);

  // Detach Confirmation State
  const [detachItem, setDetachItem] = useState(null); // { typeKey, item }
  const [detaching, setDetaching] = useState(false);

  // Success Notification
  const [toastMessage, setToastMessage] = useState(searchParams.get('msg') || '');

  // Fetch Program Details
  const fetchProgramDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getProgramById(programId);
      if (res && res.success && res.program) {
        setProgram(res.program);
      } else {
        setError('Program not found');
      }
    } catch (err) {
      console.error('Error fetching program detail:', err);
      setError(err.message || 'Failed to fetch program detail');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgramDetail();
  }, [fetchProgramDetail]);

  // Handle return parameters from Cross-Module Navigation
  useEffect(() => {
    const returnType = searchParams.get('attachType');
    const autoAttachId = searchParams.get('newId');

    if (returnType && SECTIONS.some((s) => s.key === returnType)) {
      setActiveTab(returnType);

      if (autoAttachId) {
        // Auto attach newly created entity
        adminAPI
          .attachProgramEntities(programId, returnType, [autoAttachId])
          .then(() => {
            setToastMessage(`Newly created item was automatically attached to Program!`);
            fetchProgramDetail();
          })
          .catch((err) => console.error('Auto-attach error:', err));
      }

      // Clear search params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, programId, fetchProgramDetail, setSearchParams]);

  // Fetch Available Entities for Attach Modal
  const fetchAvailableEntities = async (entityType, search = '') => {
    try {
      setAvailableLoading(true);
      const res = await adminAPI.getAvailableProgramEntities(programId, entityType, { search, limit: 50 });
      if (res && res.success) {
        setAvailableItems(res.items || []);
      }
    } catch (err) {
      console.error('Error fetching available entities:', err);
    } finally {
      setAvailableLoading(false);
    }
  };

  // Open Attach Modal
  const handleOpenAttachModal = (entityType) => {
    setAttachModalType(entityType);
    setSelectedIds([]);
    setAvailableSearch('');
    fetchAvailableEntities(entityType, '');
  };

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Confirm Attachment
  const handleConfirmAttach = async () => {
    if (selectedIds.length === 0 || !attachModalType) return;
    try {
      setAttaching(true);
      await adminAPI.attachProgramEntities(programId, attachModalType, selectedIds);
      setAttachModalType(null);
      setSelectedIds([]);
      setToastMessage(`Successfully attached ${selectedIds.length} item(s) to Program!`);
      fetchProgramDetail();
    } catch (err) {
      console.error('Error attaching entities:', err);
      alert(err.message || 'Failed to attach entities');
    } finally {
      setAttaching(false);
    }
  };

  // Confirm Detach
  const handleConfirmDetach = async () => {
    if (!detachItem) return;
    try {
      setDetaching(true);
      await adminAPI.detachProgramEntity(programId, detachItem.typeKey, detachItem.item._id);
      setDetachItem(null);
      setToastMessage(`Successfully detached item from Program.`);
      fetchProgramDetail();
    } catch (err) {
      console.error('Error detaching entity:', err);
      alert(err.message || 'Failed to detach entity');
    } finally {
      setDetaching(false);
    }
  };

  // Create New Resource Redirect
  const handleCreateNewResource = (section) => {
    const returnUrl = encodeURIComponent(`/programs/${programId}?attachType=${section.key}`);
    navigate(`${section.route}?returnTo=${returnUrl}&programId=${programId}&attachType=${section.key}`);
  };

  // Item Title Helper
  const getItemTitle = (item, typeKey) => {
    if (typeKey === 'students') return item.name || item.email || 'Unnamed Student';
    if (typeKey === 'courses') return item.title || 'Untitled Course';
    if (typeKey === 'roadmaps') return item.title || 'Untitled Roadmap';
    if (typeKey === 'track-templates') return item.name || 'Untitled Track Template';
    if (typeKey === 'certificates') return item.name || 'Untitled Certificate';
    if (typeKey === 'projects') return item.title || 'Untitled Project';
    return item.name || item.title || 'Untitled Item';
  };

  // Item Detail Subtitle Helper
  const getItemSubtitle = (item, typeKey) => {
    if (typeKey === 'students') return `${item.email || ''} ${item.rollNo ? `(${item.rollNo})` : ''}`;
    if (typeKey === 'batches') return `Start: ${item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}`;
    if (typeKey === 'courses') return `${item.level || ''} • ${item.courseType || ''}`;
    if (typeKey === 'track-templates') return `Type: ${item.trackType || 'N/A'}`;
    if (typeKey === 'projects') return `Category: ${item.category || 'N/A'} • ${item.duration_days ? `${item.duration_days} Days` : ''}`;
    if (typeKey === 'certificates') return item.description || 'Certificate Template';
    return item.description || '';
  };

  // Item Detail Link Helper
  const getItemLink = (item, typeKey) => {
    if (typeKey === 'batches') return `/batches/${item._id}`;
    if (typeKey === 'students') return `/students`;
    if (typeKey === 'courses') return `/admin/courses`;
    if (typeKey === 'roadmaps') return `/admin/roadmaps`;
    if (typeKey === 'track-templates') return `/track-templates/${item._id}`;
    if (typeKey === 'certificates') return `/certificates`;
    if (typeKey === 'projects') return `/admin/projects/edit/${item._id}`;
    return null;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#00113b]' : 'bg-slate-50'}`}>
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#00113b] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <Sidebar />
        <div className="flex-1 p-8 flex flex-col justify-center items-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">{error || 'Program Not Found'}</h2>
          <button
            onClick={() => navigate('/programs')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const currentSection = SECTIONS.find((s) => s.key === activeTab) || SECTIONS[0];
  const attachedItems = program[currentSection.field] || [];

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#00113b] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-5 h-5" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="p-1 hover:bg-emerald-500/20 rounded-lg">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back Link */}
        <button
          onClick={() => navigate('/programs')}
          className={`flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Programs</span>
        </button>

        {/* Header Hero Card */}
        <div className={`p-6 md:p-8 rounded-3xl mb-8 border shadow-sm ${
          isDarkMode ? 'bg-[#0c1a3a]/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  program.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : program.status === 'Draft'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-700/50 text-slate-300'
                }`}>
                  {program.status}
                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  program.visibility === 'Public'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {program.visibility}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight mb-3">{program.name}</h1>
              {program.description && (
                <p className={`text-base max-w-3xl mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {program.description}
                </p>
              )}

              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium ${
                  isDarkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <FiTag className="w-4 h-4 text-blue-400" />
                  <span>Type: {program.programType}</span>
                </span>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium ${
                  isDarkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <FiClock className="w-4 h-4 text-indigo-400" />
                  <span>Duration: {program.duration}</span>
                </span>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium ${
                  program.pricingType === 'Paid'
                    ? isDarkMode ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isDarkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <FiDollarSign className="w-4 h-4 text-emerald-400" />
                  <span>{program.pricingType === 'Paid' ? `Paid (${program.programFee})` : 'Free Program'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-slate-700/50">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const count = (program[sec.field] || []).length;
            const isActive = activeTab === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? isDarkMode
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-blue-600 text-white shadow-md'
                    : isDarkMode
                    ? 'bg-[#0c1a3a]/60 text-slate-400 hover:text-white hover:bg-[#122449]'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/20 text-white' : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>Attached {currentSection.label}</span>
              <span className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${
                isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {attachedItems.length}
              </span>
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage attached {currentSection.label.toLowerCase()} or attach new resources
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAttachModal(currentSection.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span>Attach Existing</span>
            </button>

            <button
              onClick={() => handleCreateNewResource(currentSection)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                isDarkMode
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <FiExternalLink className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>
        </div>

        {/* Section Attached Items List */}
        {attachedItems.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center ${isDarkMode ? 'bg-[#0c1a3a]/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <currentSection.icon className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-semibold mb-1">No {currentSection.label} Attached</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Attach existing {currentSection.label.toLowerCase()} or create new ones to include in this program.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleOpenAttachModal(currentSection.key)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Attach Existing {currentSection.label}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachedItems.map((item) => {
              const link = getItemLink(item, currentSection.key);
              return (
                <div
                  key={item._id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isDarkMode
                      ? 'bg-[#0c1a3a]/80 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-bold text-base line-clamp-1">
                        {getItemTitle(item, currentSection.key)}
                      </h4>

                      <button
                        onClick={() => setDetachItem({ typeKey: currentSection.key, item })}
                        title="Detach from Program"
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'
                        }`}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className={`text-xs mb-4 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {getItemSubtitle(item, currentSection.key)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      item.status === 'Active' || item.status === 'Published'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {item.status || 'Attached'}
                    </span>

                    {link && (
                      <button
                        onClick={() => navigate(link)}
                        className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <FiChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ATTACH EXISTING MODAL */}
      {attachModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl p-6 shadow-2xl border ${
              isDarkMode ? 'bg-[#0c1a3a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div>
                <h3 className="text-xl font-bold">Attach Existing {currentSection.label}</h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select entities to attach to this Program
                </p>
              </div>
              <button
                onClick={() => setAttachModalType(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="py-4">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search available ${currentSection.label.toLowerCase()}...`}
                  value={availableSearch}
                  onChange={(e) => {
                    setAvailableSearch(e.target.value);
                    fetchAvailableEntities(attachModalType, e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#152449] border-slate-700 text-white focus:border-blue-500 border'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 border'
                  }`}
                />
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
              {availableLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableItems.length === 0 ? (
                <div className={`p-8 text-center rounded-xl border ${isDarkMode ? 'border-slate-800 bg-[#122449]/50' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-sm font-medium">No attachable items found.</p>
                </div>
              ) : (
                availableItems.map((item) => {
                  const isSelected = selectedIds.includes(item._id);
                  return (
                    <div
                      key={item._id}
                      onClick={() => !item.isAttached && handleToggleSelect(item._id)}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        item.isAttached
                          ? isDarkMode
                            ? 'bg-slate-800/40 border-slate-800 opacity-60 cursor-not-allowed'
                            : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? isDarkMode
                            ? 'bg-blue-600/20 border-blue-500/60'
                            : 'bg-blue-50 border-blue-300'
                          : isDarkMode
                          ? 'bg-[#152449]/60 border-slate-800 hover:bg-[#152449]'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          disabled={item.isAttached}
                          checked={item.isAttached || isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold text-sm line-clamp-1">
                            {getItemTitle(item, attachModalType)}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {getItemSubtitle(item, attachModalType)}
                          </p>
                        </div>
                      </div>

                      {item.isAttached && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300">
                          Already Attached
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Submit */}
            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedIds.length} item(s) selected
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAttachModalType(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  disabled={selectedIds.length === 0 || attaching}
                  onClick={handleConfirmAttach}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                >
                  {attaching ? 'Attaching...' : `Attach (${selectedIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETACH CONFIRMATION MODAL */}
      {detachItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isDarkMode ? 'bg-[#0c1a3a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h3 className="text-lg font-bold mb-2">Detach Item from Program?</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to remove <span className="font-semibold text-white">{getItemTitle(detachItem.item, detachItem.typeKey)}</span> from this Program?
            </p>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs mb-6">
              This only detaches the relationship from the Program. The underlying resource will not be deleted from the platform.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={detaching}
                onClick={() => setDetachItem(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={detaching}
                onClick={handleConfirmDetach}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {detaching ? 'Detaching...' : 'Detach Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
