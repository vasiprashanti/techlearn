import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiChevronDown,
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { adminAPI, preferRemoteData } from '../../services/adminApi';

const difficultyPillClass = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-[#16a34a] text-white';
  if (difficulty === 'Medium') return 'bg-[#dbe7ff] text-[#3c83f6]';
  return 'bg-[#fee2e2] text-[#b91c1c]';
};

const statusPillClass = (status) =>
  status === 'Active'
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

const createTestCase = () => ({ input: '', output: '', explanation: '' });

const dynamicCategoryFallback = (slug) => ({
  id: slug,
  slug,
  title: slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
  subtitle: 'Category details',
  total: 0,
  active: 0,
  icon: 'chart',
});

const createQuestionForm = (track = '') => ({
  title: '',
  trackType: track,
  difficulty: 'Easy',
  tags: [],
  tagInput: '',
  problemDescription: '',
  inputFormat: '',
  outputFormat: '',
  timeLimit: '1',
  memoryLimit: '256',
  visibleTestCases: [createTestCase()],
  hiddenTestCases: [createTestCase()],
  referenceLanguage: 'C++',
  solutionCode: '',
  editorial: '',
});

const formFromQuestion = (question) => ({
  title: question.title || '',
  trackType: question.track || '',
  difficulty: question.difficulty || 'Easy',
  tags: Array.isArray(question.tags) ? question.tags : [],
  tagInput: '',
  problemDescription: question.description || '',
  inputFormat: question.inputFormat || '',
  outputFormat: question.outputFormat || '',
  timeLimit: String(question.timeLimit || '1'),
  memoryLimit: String(question.memoryLimit || '256'),
  visibleTestCases:
    Array.isArray(question.visibleTestCases) && question.visibleTestCases.length
      ? question.visibleTestCases
      : [createTestCase()],
  hiddenTestCases:
    Array.isArray(question.hiddenTestCases) && question.hiddenTestCases.length
      ? question.hiddenTestCases
      : [createTestCase()],
  referenceLanguage: question.referenceLanguage || 'C++',
  solutionCode: question.solutionCode || '',
  editorial: question.editorial || '',
});

export default function QuestionCategoryDetails() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { categorySlug } = useParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All levels');

  const [questions, setQuestions] = useState([]);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(createQuestionForm());
  const [expandedFormSections, setExpandedFormSections] = useState({
    visible: false,
    hidden: false,
    reference: false,
  });
  const [viewQuestion, setViewQuestion] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [remoteCategory, setRemoteCategory] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  const isDarkMode = theme === 'dark';
  const category = remoteCategory || dynamicCategoryFallback(categorySlug);

  const seedQuestions = useMemo(() => [], []);

  const trackOptions = useMemo(
    () => Array.from(new Set([
      'Data Structures & Algorithms',
      'Web Development',
      'Python Programming',
      'Database Management',
      'Machine Learning',
      category?.title,
    ].filter(Boolean))),
    [category?.title]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getQuestionCategories()
      .then((categories) => {
        if (!cancelled) {
          const match = categories.find((item) => item.slug === categorySlug);
          setRemoteCategory(match || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteCategory(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  const loadQuestions = useCallback(async () => {
    const remoteQuestions = await adminAPI.getQuestions({ categorySlug });
    setQuestions(preferRemoteData(remoteQuestions, seedQuestions));
  }, [categorySlug, seedQuestions]);

  useEffect(() => {
    let cancelled = false;

    loadQuestions().catch(() => {
      if (!cancelled) {
        setQuestions(seedQuestions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadQuestions, seedQuestions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        (question.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.track || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === 'All levels' || question.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [questions, searchTerm, difficultyFilter]);

  const updateFormField = (field, value) => {
    setQuestionForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddQuestion = () => {
    setEditingQuestionId(null);
    setFormError('');
    setQuestionForm(createQuestionForm(category?.title || ''));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
    setIsQuestionFormOpen(true);
  };

  const openEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setFormError('');
    setQuestionForm(formFromQuestion(question));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
    setIsQuestionFormOpen(true);
  };

  const closeQuestionModal = () => {
    setIsQuestionFormOpen(false);
    setEditingQuestionId(null);
    setFormError('');
    setQuestionForm(createQuestionForm(category?.title || ''));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
  };

  const toggleFormSection = (sectionKey) => {
    setExpandedFormSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const addTag = () => {
    const nextTag = questionForm.tagInput.trim();
    if (!nextTag || questionForm.tags.includes(nextTag)) {
      setQuestionForm((prev) => ({ ...prev, tagInput: '' }));
      return;
    }
    setQuestionForm((prev) => ({ ...prev, tags: [...prev.tags, nextTag], tagInput: '' }));
  };

  const removeTag = (tagToRemove) => {
    setQuestionForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }));
  };

  const updateTestCase = (section, index, field, value) => {
    setQuestionForm((prev) => ({
      ...prev,
      [section]: prev[section].map((testCase, i) => (i === index ? { ...testCase, [field]: value } : testCase)),
    }));
  };

  const addTestCase = (section) => {
    setQuestionForm((prev) => ({ ...prev, [section]: [...prev[section], createTestCase()] }));
  };

  const saveQuestion = async () => {
    if (!questionForm.title.trim() || !questionForm.trackType || !questionForm.problemDescription.trim()) {
      setFormError('Title, track type, and problem description are required.');
      return;
    }

    const backendPayload = {
      title: questionForm.title.trim(),
      difficulty: questionForm.difficulty,
      categorySlug,
      categoryTitle: category?.title,
      trackType: questionForm.trackType,
      tags: questionForm.tags,
      description: questionForm.problemDescription.trim(),
      inputFormat: questionForm.inputFormat.trim(),
      outputFormat: questionForm.outputFormat.trim(),
      visibleTestCases: questionForm.visibleTestCases,
      hiddenTestCases: questionForm.hiddenTestCases,
      timeLimit: questionForm.timeLimit,
      memoryLimit: questionForm.memoryLimit,
      referenceLanguage: questionForm.referenceLanguage,
      solutionCode: questionForm.solutionCode,
      editorial: questionForm.editorial,
      status: 'Active',
    };

    setFormError('');
    setIsSavingQuestion(true);

    try {
      if (editingQuestionId) {
        await adminAPI.updateQuestion(editingQuestionId, backendPayload);
      } else {
        await adminAPI.createQuestion(backendPayload);
      }
      await loadQuestions();
      closeQuestionModal();
    } catch (error) {
      setFormError(error.message || 'Failed to save question.');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteTarget) return;
    setIsDeletingQuestion(true);
    try {
      await adminAPI.deleteQuestion(deleteTarget.id);
      await loadQuestions();
      setDeleteTarget(null);
    } catch (error) {
      setFormError(error.message || 'Failed to delete question.');
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  if (!mounted) return <LoadingScreen />;

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeQuestionModal} />

          <div className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 bg-[#e3edf5] dark:bg-[#0a1d45] shadow-2xl">
            <div className="sticky top-0 z-20 px-3.5 py-2.5 border-b border-black/10 dark:border-white/10 bg-[#e3edf5]/95 dark:bg-[#0a1d45]/95 backdrop-blur flex items-center justify-between">
              <h2 className="text-base font-semibold text-black/85 dark:text-white/90">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h2>
              <button
                onClick={closeQuestionModal}
                className="h-7 w-7 rounded-lg border border-black/10 dark:border-white/10 inline-flex items-center justify-center text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close add question form"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="md:col-span-2">
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Question title*</label>
                  <input
                    value={questionForm.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    placeholder="Enter question title"
                    className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Track type*</label>
                  <div className="relative mt-1">
                    <select
                      value={questionForm.trackType}
                      onChange={(e) => updateFormField('trackType', e.target.value)}
                      className="appearance-none w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 pr-10 text-sm"
                    >
                      <option value="">Select track type</option>
                      {trackOptions.map((track) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                  </div>
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Difficulty*</label>
                  <div className="relative mt-1">
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => updateFormField('difficulty', e.target.value)}
                      className="appearance-none w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 pr-10 text-sm"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Tags</label>
                  <div className="mt-1 flex flex-col sm:flex-row gap-2">
                    <input
                      value={questionForm.tagInput}
                      onChange={(e) => updateFormField('tagInput', e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1 h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 text-sm"
                    />
                    <button onClick={addTag} className="h-9 px-3.5 rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] text-white text-sm font-medium">Add</button>
                  </div>
                  {questionForm.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {questionForm.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-xs bg-white/70 dark:bg-white/5">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white">
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Problem Description*</label>
                  <textarea
                    value={questionForm.problemDescription}
                    onChange={(e) => updateFormField('problemDescription', e.target.value)}
                    rows={4}
                    placeholder="Describe the problem statement"
                    className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Input format</label>
                  <textarea
                    value={questionForm.inputFormat}
                    onChange={(e) => updateFormField('inputFormat', e.target.value)}
                    rows={2}
                    placeholder="Describe input format"
                    className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Output format</label>
                  <textarea
                    value={questionForm.outputFormat}
                    onChange={(e) => updateFormField('outputFormat', e.target.value)}
                    rows={2}
                    placeholder="Describe output format"
                    className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Time limit (seconds)</label>
                  <input type="number" min="1" value={questionForm.timeLimit} onChange={(e) => updateFormField('timeLimit', e.target.value)} className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 text-sm" />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Memory limit (MB)</label>
                  <input type="number" min="1" value={questionForm.memoryLimit} onChange={(e) => updateFormField('memoryLimit', e.target.value)} className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 text-sm" />
                </div>
              </div>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/35 dark:bg-white/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFormSection('visible')}
                  className="w-full px-3.5 py-2.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-black/85 dark:text-white/90">Visible Test Cases</h3>
                    <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-[#d1e6f8] dark:bg-[#1f365c] text-[11px] font-semibold text-black/75 dark:text-white/85">{questionForm.visibleTestCases.length}</span>
                  </div>
                  <FiChevronDown
                    className={`w-4 h-4 text-black/55 dark:text-white/60 transition-transform ${expandedFormSections.visible ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFormSections.visible && (
                  <div className="px-3.5 py-2.5 space-y-2.5">
                    <p className="text-sm text-black/55 dark:text-white/60">These test cases are visible to students when they run their code.</p>
                    {questionForm.visibleTestCases.map((testCase, index) => (
                      <div key={`visible-${index}`} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2.5 space-y-2">
                        <p className="text-sm font-semibold text-black/75 dark:text-white/85">Test Case #{index + 1}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <div>
                            <label className="admin-micro-label text-black/45 dark:text-white/45">Input</label>
                            <textarea value={testCase.input} onChange={(e) => updateTestCase('visibleTestCases', index, 'input', e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="admin-micro-label text-black/45 dark:text-white/45">Output</label>
                            <textarea value={testCase.output} onChange={(e) => updateTestCase('visibleTestCases', index, 'output', e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation (optional)</label>
                          <input value={testCase.explanation} onChange={(e) => updateTestCase('visibleTestCases', index, 'explanation', e.target.value)} placeholder="Brief explanation..." className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 text-sm" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addTestCase('visibleTestCases')} className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10">+ Add Visible Test Case</button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/35 dark:bg-white/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFormSection('hidden')}
                  className="w-full px-3.5 py-2.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-black/85 dark:text-white/90">Hidden Test Cases</h3>
                    <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-[#d1e6f8] dark:bg-[#1f365c] text-[11px] font-semibold text-black/75 dark:text-white/85">{questionForm.hiddenTestCases.length}</span>
                  </div>
                  <FiChevronDown
                    className={`w-4 h-4 text-black/55 dark:text-white/60 transition-transform ${expandedFormSections.hidden ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFormSections.hidden && (
                  <div className="px-3.5 py-2.5 space-y-2.5">
                    <p className="text-sm text-black/55 dark:text-white/60">Hidden test cases are used for grading and are not visible to students.</p>
                    {questionForm.hiddenTestCases.map((testCase, index) => (
                      <div key={`hidden-${index}`} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2.5 space-y-2">
                        <p className="text-sm font-semibold text-black/75 dark:text-white/85">Hidden Test Case #{index + 1}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          <div>
                            <label className="admin-micro-label text-black/45 dark:text-white/45">Input</label>
                            <textarea value={testCase.input} onChange={(e) => updateTestCase('hiddenTestCases', index, 'input', e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="admin-micro-label text-black/45 dark:text-white/45">Output</label>
                            <textarea value={testCase.output} onChange={(e) => updateTestCase('hiddenTestCases', index, 'output', e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation (optional)</label>
                          <input value={testCase.explanation} onChange={(e) => updateTestCase('hiddenTestCases', index, 'explanation', e.target.value)} placeholder="Brief explanation..." className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 text-sm" />
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addTestCase('hiddenTestCases')} className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold text-black/80 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10">+ Add Hidden Test Case</button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/35 dark:bg-white/5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFormSection('reference')}
                  className="w-full px-3.5 py-2.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                >
                  <h3 className="text-sm font-semibold text-black/85 dark:text-white/90">Reference Solution</h3>
                  <FiChevronDown
                    className={`w-4 h-4 text-black/55 dark:text-white/60 transition-transform ${expandedFormSections.reference ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedFormSections.reference && (
                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Language</label>
                      <div className="relative mt-1">
                        <select value={questionForm.referenceLanguage} onChange={(e) => updateFormField('referenceLanguage', e.target.value)} className="appearance-none w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 pr-10 text-sm">
                          <option>C++</option>
                          <option>Python</option>
                          <option>Java</option>
                          <option>JavaScript</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                      </div>
                    </div>
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Solution code</label>
                      <textarea value={questionForm.solutionCode} onChange={(e) => updateFormField('solutionCode', e.target.value)} rows={6} placeholder="Paste reference solution code" className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Explanation / Editorial</label>
                      <textarea value={questionForm.editorial} onChange={(e) => updateFormField('editorial', e.target.value)} rows={3} placeholder="Add editorial notes" className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </section>

              <div className="flex items-center justify-end gap-2.5 pt-1.5">
                <button onClick={closeQuestionModal} className="h-9 w-[120px] rounded-xl border border-black/10 dark:border-white/10 inline-flex items-center justify-center text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={saveQuestion} disabled={isSavingQuestion} className="h-9 w-[120px] rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-70 inline-flex items-center justify-center text-white text-sm font-semibold leading-none shadow-sm transition-colors">{isSavingQuestion ? 'Saving...' : editingQuestionId ? 'Save Changes' : 'Save'}</button>
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </div>
          </div>
        </div>
      )}

      {viewQuestion && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setViewQuestion(null)} />
          <div className="relative w-full max-w-lg rounded-xl border border-black/10 dark:border-white/10 bg-[#d9e8f4] dark:bg-[#0f274f] shadow-2xl p-3.5">
            <button
              onClick={() => setViewQuestion(null)}
              className="absolute right-2.5 top-2.5 h-6.5 w-6.5 rounded-full border-2 border-[#4b82df] text-[#4b82df] inline-flex items-center justify-center hover:bg-[#4b82df]/10"
              aria-label="Close question preview"
            >
              <FiX className="w-3 h-3" />
            </button>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{viewQuestion.title}</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(viewQuestion.difficulty)}`}>
                {viewQuestion.difficulty}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-black/10 dark:border-white/15 text-slate-800 dark:text-slate-200 bg-white/55 dark:bg-white/10">
                {viewQuestion.track}
              </span>
              {(viewQuestion.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-black/10 dark:border-white/15 text-slate-800 dark:text-slate-200 bg-white/55 dark:bg-white/10">
                  {tag}
                </span>
              ))}
            </div>

            <section className="mt-4 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Description</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{viewQuestion.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">Input Format</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{viewQuestion.inputFormat}</p>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">Output Format</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{viewQuestion.outputFormat}</p>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">Test Cases</h4>
                <div className="mt-2.5 space-y-2.5">
                  {(viewQuestion.visibleTestCases || []).map((testCase, index) => (
                    <div key={index} className="rounded-lg bg-white/45 dark:bg-white/10 p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300">Input:</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white leading-tight">{testCase.input}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300">Output:</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white leading-tight">{testCase.output}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-3 flex items-center gap-4 text-sm md:text-base">
              <p className="text-slate-500 dark:text-slate-300">Time Limit: <span className="font-semibold text-slate-900 dark:text-white">{viewQuestion.timeLimit}s</span></p>
              <p className="text-slate-500 dark:text-slate-300">Solved: <span className="font-semibold text-slate-900 dark:text-white">{viewQuestion.solved}</span></p>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1d45] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-black/85 dark:text-white/90">Delete Question?</h3>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.title}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuestion}
                disabled={isDeletingQuestion}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold"
              >
                {isDeletingQuestion ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
          </div>
        </div>
      )}

      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#cfe3ef] via-[#c2dae8] to-[#cfe3ef]'}`} />
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}>
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
            <div>
              <h1 className="admin-page-title">Question Bank</h1>
            </div>
            <AdminHeaderControls user={user} logout={logout} />
          </header>

          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate('/question-bank')}
                className="inline-flex items-center gap-2 text-[#5f7592] dark:text-slate-300 hover:text-[#3c83f6] dark:hover:text-blue-300 text-sm font-medium self-start"
                aria-label="Back to question categories"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Question Bank
              </button>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl leading-tight md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{category.title}</h2>
                  <p className="text-xs leading-tight md:text-sm font-light text-slate-600 dark:text-slate-300">{questions.length} questions</p>
                </div>

                <button
                  onClick={openAddQuestion}
                  className="h-9 md:h-10 rounded-lg px-4 md:px-5 bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xs md:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Add Question
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 md:h-10 rounded-lg border border-black/10 dark:border-white/10 bg-[#d7e3ee] dark:bg-[#1a2f57] pl-9 pr-3.5 text-xs md:text-sm text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/30"
                  />
                </div>

                <div className="relative md:w-[280px]">
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full h-9 md:h-10 rounded-lg border border-black/10 dark:border-white/10 bg-[#d7e3ee] dark:bg-[#1a2f57] px-3.5 pr-8 text-xs md:text-sm text-slate-700 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-[#3c83f6]/30"
                  >
                    <option>All levels</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-300 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {filteredQuestions.map((question) => (
                  <article key={question.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1d45] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white break-words">{question.title || 'Untitled Question'}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-words">{question.track || 'General'}</p>
                      </div>
                      <span className={`shrink-0 inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-300">Created</p>
                        <p className="mt-1 text-slate-800 dark:text-slate-100">{question.created}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-300">Status</p>
                        <p className="mt-1">
                          <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(question.status)}`}>
                            {question.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3 text-slate-800 dark:text-slate-100">
                      <button onClick={() => setViewQuestion(question)} className="p-2 rounded-lg hover:text-[#3c83f6] hover:bg-[#3c83f6]/10 transition-colors" aria-label="View question">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditQuestion(question)} className="p-2 rounded-lg hover:text-[#3c83f6] hover:bg-[#3c83f6]/10 transition-colors" aria-label="Edit question">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(question)} className="p-2 rounded-lg hover:text-rose-500 hover:bg-rose-500/10 transition-colors" aria-label="Delete question">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                ))}
                {filteredQuestions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
                    No questions found for the selected filters.
                  </div>
                )}
              </div>

              <div className="hidden lg:block rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-[#0a1d45]">
                <div className="relative">
                  <div className="overflow-x-scroll pb-2" style={{ scrollbarGutter: 'stable both-edges' }}>
                    <table className="w-full min-w-[980px]">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1d45]">
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Title</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Difficulty</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Track</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Created</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Status</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuestions.map((question) => (
                          <tr key={question.id} className="border-b border-black/10 dark:border-white/10 last:border-0">
                            <td className="px-4 py-4 text-sm md:text-base leading-tight font-semibold text-slate-900 dark:text-white">{question.title || 'Untitled Question'}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">{question.track || 'General'}</td>
                            <td className="px-4 py-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">{question.created}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(question.status)}`}>
                                {question.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                                <button onClick={() => setViewQuestion(question)} className="p-1 hover:text-[#3c83f6] transition-colors" aria-label="View question">
                                  <FiEye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button onClick={() => openEditQuestion(question)} className="p-1 hover:text-[#3c83f6] transition-colors" aria-label="Edit question">
                                  <FiEdit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button onClick={() => setDeleteTarget(question)} className="p-1 hover:text-rose-500 transition-colors" aria-label="Delete question">
                                  <FiTrash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredQuestions.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
                              No questions found for the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-white dark:from-[#0a1d45] to-transparent" />
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-300">Showing {filteredQuestions.length} questions</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



