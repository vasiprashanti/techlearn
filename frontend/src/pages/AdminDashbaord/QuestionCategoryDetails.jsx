import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiArrowLeft,
  FiChevronDown,
  FiEdit2,
  FiEye,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import QuestionBankDynamicQuestionForm from '../../components/AdminDashbaord/QuestionBankDynamicQuestionForm';
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

const createQuestionForm = () => ({
  title: '',
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
  mcqOptions: ['', '', '', ''],
  mcqCorrectIndex: 0,
  mcqExplanation: '',
  notesMarkdown: '',
});

const normalizeTestCasesForForm = (testCases) =>
  Array.isArray(testCases) && testCases.length
    ? testCases.map((testCase) => ({
        input: String(testCase?.input || ''),
        output: String(testCase?.output || ''),
        explanation: String(testCase?.explanation || ''),
      }))
    : [createTestCase()];

const formFromQuestion = (question) => {
  const mcqOptions = Array.isArray(question?.mcqOptions) ? question.mcqOptions : [];
  return {
    title: question?.title || '',
    difficulty: question?.difficulty || 'Easy',
    tags: Array.isArray(question?.tags) ? question.tags : [],
    tagInput: '',
    problemDescription: question?.description || '',
    inputFormat: question?.inputFormat || '',
    outputFormat: question?.outputFormat || '',
    timeLimit: String(question?.timeLimit || '1'),
    memoryLimit: String(question?.memoryLimit || '256'),
    visibleTestCases: normalizeTestCasesForForm(question?.visibleTestCases),
    hiddenTestCases: normalizeTestCasesForForm(question?.hiddenTestCases),
    referenceLanguage: question?.referenceLanguage || 'C++',
    solutionCode: question?.solutionCode || '',
    editorial: question?.editorial || '',
    mcqOptions: [...mcqOptions.map((option) => String(option || '')), '', '', '', ''].slice(0, 4),
    mcqCorrectIndex: typeof question?.mcqCorrectIndex === 'number' ? question.mcqCorrectIndex : 0,
    mcqExplanation: question?.mcqExplanation || '',
    notesMarkdown: question?.notesMarkdown || '',
  };
};

const looksLikeMongoObjectId = (value) =>
  typeof value === "string" && /^[a-f0-9]{24}$/i.test(value.trim());

const dynamicCategoryFallback = (slug) => ({
  id: slug,
  slug,
  title: slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
  subtitle: 'Category details',
  description: 'Category details',
  categoryType: 'Coding',
  status: 'Active',
  total: 0,
  active: 0,
  icon: 'chart',
});

export default function QuestionCategoryDetails() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [openQuestionMenuId, setOpenQuestionMenuId] = useState(null);
  const [categoryMetaLoading, setCategoryMetaLoading] = useState(true);
  const openAddFromWorkflowRef = useRef(false);

  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const category = remoteCategory || dynamicCategoryFallback(categorySlug);

  const categoryType = category?.categoryType || 'Coding';
  const isCodingCategory = categoryType === 'Coding';
  const isMcqCategory = categoryType === 'MCQ';
  const isNotesCategory = categoryType === 'Notes';

  const questionFormModalTitle = editingQuestionId
    ? categoryType === 'MCQ'
      ? 'Edit MCQ'
      : categoryType === 'Notes'
        ? 'Edit notes'
        : 'Edit coding question'
    : categoryType === 'MCQ'
      ? 'Add MCQ'
      : categoryType === 'Notes'
        ? 'Add notes'
        : 'Add coding question';

  const seedQuestions = useMemo(() => [], []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setCategoryMetaLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) {
          setCategoryMetaLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  useEffect(() => {
    openAddFromWorkflowRef.current = false;
  }, [categorySlug]);

  const categoryMongoId = remoteCategory?.id != null ? String(remoteCategory.id).trim() : "";
  const queryByCategoryId = looksLikeMongoObjectId(categoryMongoId);

  const loadQuestions = useCallback(async () => {
    const params = queryByCategoryId ? { categoryId: categoryMongoId } : { categorySlug };
    const remoteQuestions = await adminAPI.getQuestions(params);
    setQuestions(preferRemoteData(remoteQuestions, seedQuestions));
  }, [categorySlug, categoryMongoId, queryByCategoryId, seedQuestions]);

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

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const clickedTrigger = event.target.closest('.question-actions-trigger');
      const clickedMenu = event.target.closest('.question-actions-menu');
      if (!clickedTrigger && !clickedMenu) {
        setOpenQuestionMenuId(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        (question.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.track || question.categoryTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === 'All levels' || question.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [questions, searchTerm, difficultyFilter]);

  const updateFormField = (field, value) => {
    setQuestionForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddQuestion = useCallback(() => {
    setEditingQuestionId(null);
    setFormError('');
    setQuestionForm(createQuestionForm());
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
    setIsQuestionFormOpen(true);
  }, []);

  useEffect(() => {
    if (categoryMetaLoading) return;
    if (location.state?.openAddQuestion !== true) return;
    if (openAddFromWorkflowRef.current) return;
    openAddFromWorkflowRef.current = true;
    navigate(location.pathname, { replace: true, state: {} });
    openAddQuestion();
  }, [categoryMetaLoading, location.pathname, location.state, navigate, openAddQuestion]);

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
    setQuestionForm(createQuestionForm());
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
  };

  const toggleFormSection = (sectionKey) => {
    setExpandedFormSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const addTag = (event) => {
    if (event && event.key !== 'Enter') return;
    event?.preventDefault();
    const nextTag = event?.target?.value?.trim() || questionForm.tagInput.trim();
    if (!nextTag || questionForm.tags.includes(nextTag)) {
      setQuestionForm((prev) => ({ ...prev, tagInput: '' }));
      if (event?.target) event.target.value = '';
      return;
    }
    setQuestionForm((prev) => ({ ...prev, tags: [...prev.tags, nextTag], tagInput: '' }));
    if (event?.target) event.target.value = '';
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
    const trimmedTitle = questionForm.title.trim();
    if (!trimmedTitle) {
      setFormError('Title is required.');
      return;
    }

    const basePayload = {
      title: trimmedTitle,
      questionType: categoryType,
      difficulty: questionForm.difficulty,
      categorySlug,
      categoryTitle: category?.title,
      ...(queryByCategoryId ? { categoryId: categoryMongoId } : {}),
      tags: questionForm.tags,
      status: 'Active',
    };

    let backendPayload = basePayload;

    if (isCodingCategory) {
      const trimmedDescription = questionForm.problemDescription.trim();
      if (!trimmedDescription) {
        setFormError('Problem description is required.');
        return;
      }

      backendPayload = {
        ...basePayload,
        description: trimmedDescription,
        inputFormat: questionForm.inputFormat.trim(),
        outputFormat: questionForm.outputFormat.trim(),
        visibleTestCases: questionForm.visibleTestCases,
        hiddenTestCases: questionForm.hiddenTestCases,
        timeLimit: questionForm.timeLimit,
        memoryLimit: questionForm.memoryLimit,
        referenceLanguage: questionForm.referenceLanguage,
        solutionCode: questionForm.solutionCode,
        editorial: questionForm.editorial,
      };
    } else if (isMcqCategory) {
      const trimmedQuestionText = questionForm.problemDescription.trim();
      if (!trimmedQuestionText) {
        setFormError('MCQ question text is required.');
        return;
      }

      const mapping = {};
      let filteredIndex = 0;
      const normalizedOptions = (Array.isArray(questionForm.mcqOptions) ? questionForm.mcqOptions : [])
        .map((opt, originalIndex) => {
          const trimmed = String(opt || '').trim();
          if (!trimmed) return null;
          mapping[originalIndex] = filteredIndex;
          filteredIndex += 1;
          return trimmed;
        })
        .filter(Boolean);

      if (normalizedOptions.length < 2) {
        setFormError('Provide at least 2 MCQ options.');
        return;
      }

      const selectedOriginal = Number(questionForm.mcqCorrectIndex);
      const correctedIndex = Number.isInteger(selectedOriginal) ? mapping[selectedOriginal] : undefined;
      if (!Number.isInteger(correctedIndex)) {
        setFormError('Select a valid correct option (and ensure it is filled).');
        return;
      }

      backendPayload = {
        ...basePayload,
        description: trimmedQuestionText,
        mcqOptions: normalizedOptions,
        mcqCorrectIndex: correctedIndex,
        mcqExplanation: String(questionForm.mcqExplanation || '').trim(),
      };
    } else if (isNotesCategory) {
      const trimmedNotes = String(questionForm.notesMarkdown || '').trim();
      if (!trimmedNotes) {
        setFormError('Notes markdown content is required.');
        return;
      }

      backendPayload = {
        ...basePayload,
        description: '',
        notesMarkdown: trimmedNotes,
      };
    }

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

  if (!mounted || categoryMetaLoading) return <LoadingScreen />;

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeQuestionModal} />

          <div className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 bg-[#e3edf5] dark:bg-[#0a1d45] shadow-2xl">
            <div className="sticky top-0 z-20 px-3.5 py-2.5 border-b border-black/10 dark:border-white/10 bg-[#e3edf5]/95 dark:bg-[#0a1d45]/95 backdrop-blur flex items-center justify-between">
              <h2 className="text-base font-semibold text-black/85 dark:text-white/90">{questionFormModalTitle}</h2>
              <button
                onClick={closeQuestionModal}
                className="h-7 w-7 rounded-lg border border-black/10 dark:border-white/10 inline-flex items-center justify-center text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close add question form"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 space-y-4">
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/35 dark:bg-white/5 px-3.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">Category Type</p>
                <p className="mt-1 text-sm font-semibold text-black/80 dark:text-white/85">{categoryType}</p>
              </div>

              <QuestionBankDynamicQuestionForm
                categoryType={categoryType}
                form={questionForm}
                errors={{}}
                onFieldChange={updateFormField}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />

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
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-[#d9e8f4] dark:bg-[#0f274f] shadow-2xl p-3.5 sm:p-4">
            <button
              onClick={() => setViewQuestion(null)}
              className="absolute right-2.5 top-2.5 h-6.5 w-6.5 rounded-full border-2 border-[#4b82df] text-[#4b82df] inline-flex items-center justify-center hover:bg-[#4b82df]/10"
              aria-label="Close question preview"
            >
              <FiX className="w-3 h-3" />
            </button>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white pr-8">{viewQuestion.title}</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(viewQuestion.difficulty)}`}>
                {viewQuestion.difficulty}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-black/10 dark:border-white/15 text-slate-800 dark:text-slate-200 bg-white/55 dark:bg-white/10">
                {categoryType}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-black/10 dark:border-white/15 text-slate-800 dark:text-slate-200 bg-white/55 dark:bg-white/10">
                {viewQuestion.track || viewQuestion.categoryTitle || category.title}
              </span>
              {(viewQuestion.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-black/10 dark:border-white/15 text-slate-800 dark:text-slate-200 bg-white/55 dark:bg-white/10">
                  {tag}
                </span>
              ))}
            </div>

            {isNotesCategory ? (
              <section className="mt-4 space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Notes</h3>
                <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-3 text-sm text-slate-800 dark:text-slate-100 leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/5 dark:[&_pre]:bg-white/10 [&_pre]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {String(viewQuestion.notesMarkdown || viewQuestion.description || '_No markdown stored._')}
                  </ReactMarkdown>
                </div>
              </section>
            ) : isMcqCategory ? (
              <section className="mt-4 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Question</h3>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{viewQuestion.description || '—'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Options</h4>
                  <ul className="mt-2 space-y-2">
                    {(Array.isArray(viewQuestion.mcqOptions) ? viewQuestion.mcqOptions : []).map((opt, idx) => {
                      const isCorrect = Number(viewQuestion.mcqCorrectIndex) === idx;
                      return (
                        <li
                          key={idx}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            isCorrect
                              ? 'border-green-500/70 bg-green-50 dark:bg-green-500/10 text-slate-900 dark:text-white'
                              : 'border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                          {String(opt || '')}
                          {isCorrect && <span className="ml-2 text-xs font-semibold text-green-700 dark:text-green-300">(correct)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {viewQuestion.mcqExplanation ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Explanation</h4>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{viewQuestion.mcqExplanation}</p>
                  </div>
                ) : null}
              </section>
            ) : (
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
            )}

            {!isNotesCategory && !isMcqCategory && (
              <div className="mt-3 flex items-center gap-4 text-sm md:text-base">
                <p className="text-slate-500 dark:text-slate-300">Time Limit: <span className="font-semibold text-slate-900 dark:text-white">{viewQuestion.timeLimit}s</span></p>
                <p className="text-slate-500 dark:text-slate-300">Solved: <span className="font-semibold text-slate-900 dark:text-white">{viewQuestion.solved}</span></p>
              </div>
            )}
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
              <h1 className="admin-page-title">Question Dataset</h1>
              <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Manage questions for this category</p>
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

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a1d45]/90 px-4 py-4 sm:px-5 sm:py-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dataset</p>
                    <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white break-words">{category.title}</h2>
                    <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-300">{questions.length} question{questions.length === 1 ? '' : 's'} in this list</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 bg-slate-100/90 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                        Type: {categoryType}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 bg-slate-100/90 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                        Status: {category.status || 'Active'}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">Add Question</strong> always loads the{' '}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">{categoryType}</strong> form (coding, MCQ, or notes) for this dataset.
                    </p>
                    {queryByCategoryId ? (
                      <p
                        className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono break-all"
                        title="Stable identifiers for APIs, track templates, practice, and analytics"
                      >
                        categoryId · {categoryMongoId}
                        <span className="mx-1.5 text-slate-400">|</span>
                        slug · {categorySlug}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={openAddQuestion}
                    className="shrink-0 h-10 rounded-xl px-5 bg-[#3c83f6] hover:bg-[#2563eb] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Question list</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-1">
                  <div className="relative flex-1">
                    <div className="relative">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                      <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 md:h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-11 pr-4 text-[13px] md:text-sm leading-none text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                      />
                    </div>
                  </div>

                  <div className="relative md:w-[280px]">
                    <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="appearance-none w-full h-10 md:h-9 rounded-xl bg-transparent px-3.5 pr-9 text-sm font-semibold tracking-tight text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass}>All levels</option>
                        <option className={dropdownOptionClass}>Easy</option>
                        <option className={dropdownOptionClass}>Medium</option>
                        <option className={dropdownOptionClass}>Hard</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>
                </div>

              <div className="space-y-3 lg:hidden">
                {filteredQuestions.map((question) => (
                  <article key={question.id} className="relative rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1d45] p-4 shadow-sm">
                    <div className="absolute left-3.5 top-3.5 z-10">
                      <button
                        type="button"
                        className="question-actions-trigger w-7 h-7 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenQuestionMenuId((current) => (current === question.id ? null : question.id));
                        }}
                        aria-label="Open question actions"
                      >
                        <FiMoreHorizontal className="w-4 h-4" />
                      </button>

                      {openQuestionMenuId === question.id && (
                        <div className="question-actions-menu absolute left-0 top-8 w-36 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#071739] backdrop-blur-xl shadow-xl overflow-hidden">
                          <button
                            onClick={() => {
                              setOpenQuestionMenuId(null);
                              openEditQuestion(question);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setOpenQuestionMenuId(null);
                              setDeleteTarget(question);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 pl-9">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white break-words">{question.title || 'Untitled Question'}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-words">{question.track || question.categoryTitle || 'General'}</p>
                        <p
                          className="mt-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate"
                          title={String(question.questionId || question.id || '')}
                        >
                          questionId · {String(question.questionId || question.id || '').slice(0, 12)}
                          …
                        </p>
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
                    <table className="w-full min-w-[1080px]">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1d45]">
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Title</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">questionId</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Difficulty</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Category</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Created</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Status</th>
                          <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuestions.map((question) => (
                          <tr key={question.id} className="border-b border-black/10 dark:border-white/10 last:border-0">
                            <td className="px-4 py-4 text-sm md:text-base leading-tight font-semibold text-slate-900 dark:text-white">{question.title || 'Untitled Question'}</td>
                            <td className="px-4 py-4 text-[11px] font-mono text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={String(question.questionId || question.id || '')}>
                              {String(question.questionId || question.id || '')}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">{question.track || question.categoryTitle || 'General'}</td>
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
                            <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
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

              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-300 mt-1">Showing {filteredQuestions.length} questions</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



