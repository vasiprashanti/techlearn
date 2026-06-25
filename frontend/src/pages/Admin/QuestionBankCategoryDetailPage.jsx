import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX, FiChevronDown, FiTrash2 } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import CategoryDetailPanel from '../../components/admin/question-bank/CategoryDetailPanel';
import DynamicQuestionFormHost from '../../components/admin/question-bank/DynamicQuestionFormHost';
import { useQuestionBankCategories } from '../../hooks/useQuestionBankCategories';
import { useQuestionBankQuestions } from '../../hooks/useQuestionBankQuestions';
import { useCreateQuestion } from '../../hooks/useCreateQuestion';
import { questionBankApi } from '../../api/questionBankApi';
import { adminAPI } from '../../services/adminApi';

const createTestCase = () => ({ input: '', output: '', explanation: '' });
const createMcqOption = (label, text = '') => ({ label, text });

const createQuestionForm = (track = '') => ({
  title: '',
  trackType: track,
  difficulty: 'Easy',
  tags: [],
  tagInput: '',
  problemDescription: '',
  options: ['A', 'B', 'C', 'D'].map((label) => createMcqOption(label)),
  correctOption: 'A',
  explanation: '',
  markdownBody: '',
  markdownFileUrl: '',
  solutionNotes: '',
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
  trackType: question.track || question.trackType || '',
  difficulty: question.difficulty || 'Easy',
  tags: Array.isArray(question.tags) ? question.tags : [],
  tagInput: '',
  problemDescription: question.description || '',
  options:
    Array.isArray(question.options) && question.options.length
      ? question.options
      : ['A', 'B', 'C', 'D'].map((label) => createMcqOption(label)),
  correctOption: question.correctOption || 'A',
  explanation: question.explanation || '',
  markdownBody: question.markdownBody || question.content?.markdownBody || '',
  markdownFileUrl: question.markdownFileUrl || question.content?.markdownFileUrl || '',
  solutionNotes: question.solutionNotes || question.content?.solutionNotes || '',
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

export const QuestionBankCategoryDetailPage = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [createdTracks, setCreatedTracks] = useState([]);

  // Category and Question Hooks
  const { categories = [], loading: categoriesLoading } = useQuestionBankCategories();
  const { questions = [], loading: questionsLoading, error: questionsError, refetch: refetchQuestions } = useQuestionBankQuestions({
    categoryId,
  });

  const { createQuestion, updateQuestion } = useCreateQuestion();

  // Selected category object
  const category = useMemo(() => {
    return categories.find(cat => 
      String(cat.id || cat._id) === String(categoryId) ||
      String(cat.slug || '').toLowerCase() === String(categoryId).toLowerCase()
    ) || null;
  }, [categories, categoryId]);

  const categoryType = category?.categoryType || 'Coding';
  const isCodingCategory = categoryType === 'Coding';
  const isMcqCategory = categoryType === 'MCQ';
  const isNotesCategory = categoryType === 'Notes';

  const trackOptions = useMemo(
    () => Array.from(new Set(createdTracks.filter(Boolean))),
    [createdTracks]
  );

  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [questionFormMode, setQuestionFormMode] = useState('single');
  const [bulkForms, setBulkForms] = useState([]);
  const [bulkCount, setBulkCount] = useState('3');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(createQuestionForm());
  const [expandedFormSections, setExpandedFormSections] = useState({
    visible: false,
    hidden: false,
    reference: false,
  });
  const [viewQuestion, setViewQuestion] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [usageAnalytics, setUsageAnalytics] = useState(null);

  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const questionFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35 transition-all';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!category?.id && !category?._id) return;
    let cancelled = false;
    questionBankApi
      .getCategoryUsage(category.id || category._id)
      .then((data) => {
        if (!cancelled) setUsageAnalytics(data || null);
      })
      .catch(() => {
        if (!cancelled) setUsageAnalytics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [category?.id, category?._id]);

  // Fetch track templates
  useEffect(() => {
    let cancelled = false;
    adminAPI
      .getTrackTemplates()
      .then((remoteTracks) => {
        if (!cancelled) {
          const raw = Array.isArray(remoteTracks) ? remoteTracks : (remoteTracks?.data || []);
          const normalized = raw
            .map((track) => track.name || track.title || track.trackName || '')
            .filter(Boolean);
          setCreatedTracks(Array.from(new Set(normalized)));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCreatedTracks([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync track Type with form template on options ready
  useEffect(() => {
    if (trackOptions.length > 0 && !questionForm.trackType) {
      setQuestionForm(prev => ({ ...prev, trackType: trackOptions[0] }));
    }
  }, [trackOptions, questionForm.trackType]);

  const updateFormField = (field, value) => {
    setQuestionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddQuestionClick = () => {
    setEditingQuestionId(null);
    setQuestionFormMode('single');
    setFormError('');
    setQuestionForm(createQuestionForm(trackOptions[0] || ''));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
    setIsQuestionFormOpen(true);
  };

  const handleBulkAddQuestionClick = () => {
    setEditingQuestionId(null);
    setQuestionFormMode('bulk');
    setFormError('');
    const count = Math.max(1, Math.min(25, Number(bulkCount) || 3));
    setBulkForms(Array.from({ length: count }, () => createQuestionForm(trackOptions[0] || '')));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
    setIsQuestionFormOpen(true);
  };

  const handleEditQuestionClick = (question) => {
    setEditingQuestionId(question.id || question._id);
    setFormError('');
    setQuestionForm(formFromQuestion(question));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
    setIsQuestionFormOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionFormOpen(false);
    setQuestionFormMode('single');
    setEditingQuestionId(null);
    setFormError('');
    setQuestionForm(createQuestionForm(trackOptions[0] || ''));
    setExpandedFormSections({ visible: false, hidden: false, reference: false });
  };

  const generateBulkForms = () => {
    const count = Math.max(1, Math.min(25, Number(bulkCount) || 1));
    setBulkForms((prev) => {
      const next = [...prev];
      while (next.length < count) next.push(createQuestionForm(trackOptions[0] || ''));
      return next.slice(0, count);
    });
  };

  const updateBulkFormField = (index, field, value) => {
    setBulkForms((prev) => prev.map((form, formIndex) => (formIndex === index ? { ...form, [field]: value } : form)));
  };

  const toggleFormSection = (sectionKey) => {
    setExpandedFormSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleAddTag = () => {
    const nextTag = questionForm.tagInput.trim();
    if (!nextTag || questionForm.tags.includes(nextTag)) {
      setQuestionForm((prev) => ({ ...prev, tagInput: '' }));
      return;
    }
    setQuestionForm((prev) => ({ ...prev, tags: [...prev.tags, nextTag], tagInput: '' }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setQuestionForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }));
  };

  const handleUpdateTestCase = (section, index, field, value) => {
    setQuestionForm((prev) => ({
      ...prev,
      [section]: prev[section].map((testCase, i) => (i === index ? { ...testCase, [field]: value } : testCase)),
    }));
  };

  const handleUpdateMcqOption = (index, value) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? { ...option, text: value } : option)),
    }));
  };

  const handleAddTestCase = (section) => {
    setQuestionForm((prev) => ({ ...prev, [section]: [...prev[section], createTestCase()] }));
  };

  const handleRemoveTestCase = (section, index) => {
    setQuestionForm((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const handleSaveQuestion = async () => {
    if (questionFormMode === 'bulk') {
      const invalidIndex = bulkForms.findIndex((form) => {
        if (!form.title.trim()) return true;
        if ((isCodingCategory || isNotesCategory) && !form.problemDescription.trim()) return true;
        if (
          isCodingCategory &&
          (!form.visibleTestCases?.some((testCase) => testCase.input.trim() || testCase.output.trim()) ||
            !form.hiddenTestCases?.some((testCase) => testCase.input.trim() || testCase.output.trim()))
        ) return true;
        if (isMcqCategory && form.options.filter((option) => option.text.trim()).length < 2) return true;
        if (isNotesCategory && !form.markdownBody.trim() && !form.markdownFileUrl.trim()) return true;
        return false;
      });

      if (invalidIndex >= 0) {
        setFormError(`Question ${invalidIndex + 1} has missing required fields.`);
        return;
      }

      const questionsPayload = bulkForms.map((form) => ({
        title: form.title.trim(),
        difficulty: form.difficulty,
        categoryId: category?.id || category?._id,
        categorySlug: category?.slug || categoryId,
        categoryTitle: category?.title || '',
        trackType: form.trackType || category?.title || 'General',
        tags: form.tags,
        description: form.problemDescription.trim(),
        inputFormat: isCodingCategory ? form.inputFormat.trim() : '',
        outputFormat: isCodingCategory ? form.outputFormat.trim() : '',
        visibleTestCases: isCodingCategory ? form.visibleTestCases : [],
        hiddenTestCases: isCodingCategory ? form.hiddenTestCases : [],
        timeLimit: form.timeLimit,
        memoryLimit: form.memoryLimit,
        referenceLanguage: form.referenceLanguage,
        solutionCode: isCodingCategory ? form.solutionCode : '',
        editorial: form.editorial,
        options: isMcqCategory ? form.options : [],
        correctOption: isMcqCategory ? form.correctOption : '',
        explanation: isMcqCategory ? form.explanation : '',
        markdownBody: isNotesCategory ? form.markdownBody : '',
        markdownFileUrl: isNotesCategory ? form.markdownFileUrl : '',
        solutionNotes: isNotesCategory ? form.solutionNotes : '',
        status: 'Active',
      }));

      setFormError('');
      setIsSavingQuestion(true);
      try {
        await questionBankApi.bulkCreateQuestions({ categoryId: category?.id || category?._id, questions: questionsPayload });
        await refetchQuestions();
        handleCloseQuestionModal();
      } catch (error) {
        setFormError(error.message || 'Failed to save questions.');
      } finally {
        setIsSavingQuestion(false);
      }
      return;
    }

    if (!questionForm.title.trim()) {
      setFormError('Question prompt is required.');
      return;
    }

    if ((isCodingCategory || isNotesCategory) && !questionForm.problemDescription.trim()) {
      setFormError(isCodingCategory ? 'Problem description is required.' : 'Notes description is required.');
      return;
    }

    if (isMcqCategory && questionForm.options.filter((option) => option.text.trim()).length < 2) {
      setFormError('MCQ questions require at least two options.');
      return;
    }

    if (isNotesCategory && !questionForm.markdownBody.trim() && !questionForm.markdownFileUrl.trim()) {
      setFormError('Notes entries require markdown body or a markdown file URL.');
      return;
    }

    const backendPayload = {
      title: questionForm.title.trim(),
      difficulty: questionForm.difficulty,
      categoryId: category?.id || category?._id,
      categorySlug: category?.slug || categoryId,
      categoryTitle: category?.title || '',
      trackType: questionForm.trackType || category?.title || 'General',
      tags: questionForm.tags,
      description: questionForm.problemDescription.trim(),
      inputFormat: isCodingCategory ? questionForm.inputFormat.trim() : '',
      outputFormat: isCodingCategory ? questionForm.outputFormat.trim() : '',
      visibleTestCases: isCodingCategory ? questionForm.visibleTestCases : [],
      hiddenTestCases: isCodingCategory ? questionForm.hiddenTestCases : [],
      timeLimit: questionForm.timeLimit,
      memoryLimit: questionForm.memoryLimit,
      referenceLanguage: questionForm.referenceLanguage,
      solutionCode: isCodingCategory ? questionForm.solutionCode : '',
      editorial: questionForm.editorial,
      options: isMcqCategory ? questionForm.options : [],
      correctOption: isMcqCategory ? questionForm.correctOption : '',
      explanation: isMcqCategory ? questionForm.explanation : '',
      markdownBody: isNotesCategory ? questionForm.markdownBody : '',
      markdownFileUrl: isNotesCategory ? questionForm.markdownFileUrl : '',
      solutionNotes: isNotesCategory ? questionForm.solutionNotes : '',
      status: 'Active',
    };

    setFormError('');
    setIsSavingQuestion(true);

    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, backendPayload);
      } else {
        await createQuestion(backendPayload);
      }
      await refetchQuestions();
      handleCloseQuestionModal();
    } catch (error) {
      setFormError(error.message || 'Failed to save question.');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deleteTarget?.id && !deleteTarget?._id) return;
    setIsDeletingQuestion(true);
    try {
      await questionBankApi.deleteQuestion(deleteTarget.id || deleteTarget._id);
      await refetchQuestions();
      setDeleteTarget(null);
    } catch (err) {
      setFormError(err.message || 'Failed to delete question.');
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const titleField = (
    <div className="md:col-span-2">
      <label className="admin-micro-label text-black/45 dark:text-white/45">Tag*</label>
      <input
        value={questionForm.title}
        onChange={(e) => updateFormField('title', e.target.value)}
        placeholder="Enter question tag"
        className={questionFormInputClass}
      />
    </div>
  );

  const trackTypeField = (
    <div>
      <label className="admin-micro-label text-black/45 dark:text-white/45">Track type*</label>
      <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
        <select
          value={questionForm.trackType}
          onChange={(e) => updateFormField('trackType', e.target.value)}
          className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
        >
          <option className={dropdownOptionClass} value="">Select track type</option>
          {trackOptions.map((track) => (
            <option className={dropdownOptionClass} key={track} value={track}>{track}</option>
          ))}
        </select>
        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
      </div>
      {trackOptions.length === 0 && (
        <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">No tracks created yet. Make sure a Track Template exists.</p>
      )}
    </div>
  );

  const difficultyField = (
    <div>
      <label className="admin-micro-label text-black/45 dark:text-white/45">Difficulty*</label>
      <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
        <select
          value={questionForm.difficulty}
          onChange={(e) => updateFormField('difficulty', e.target.value)}
          className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
        >
          <option className={dropdownOptionClass}>Easy</option>
          <option className={dropdownOptionClass}>Medium</option>
          <option className={dropdownOptionClass}>Hard</option>
        </select>
        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
      </div>
    </div>
  );

  const explanationField = (
    <div className="md:col-span-2">
      <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation</label>
      <input
        value={questionForm.explanation}
        onChange={(e) => updateFormField('explanation', e.target.value)}
        placeholder="Explain why this option is correct"
        className={questionFormInputClass}
      />
    </div>
  );

  const tagsField = (
    <div className="md:col-span-2">
      <label className="admin-micro-label text-black/45 dark:text-white/45">Tags</label>
      <div className="mt-1 flex gap-2">
        <input
          value={questionForm.tagInput}
          onChange={(e) => updateFormField('tagInput', e.target.value)}
          placeholder="Add tag label..."
          className={questionFormInputClass}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="px-5 py-2.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white text-sm font-semibold border border-[#3C83F6]/20 transition-colors shadow-sm"
        >
          Add
        </button>
      </div>
      {questionForm.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {questionForm.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-xs bg-white/70 dark:bg-white/10 text-slate-700 dark:text-slate-200">
              {tag}
              <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const descriptionField = (
    <div className="md:col-span-2">
      <label className="admin-micro-label text-black/45 dark:text-white/45">
        {isNotesCategory ? 'Notes description*' : isMcqCategory ? 'Question prompt' : 'Problem Description*'}
      </label>
      <textarea
        value={questionForm.problemDescription}
        onChange={(e) => updateFormField('problemDescription', e.target.value)}
        rows={4}
        placeholder={isNotesCategory ? 'Describe what this note covers...' : isMcqCategory ? 'Optional supporting text...' : 'Describe the problem statement in detail...'}
        className={questionFormInputClass}
      />
    </div>
  );

  const dynamicHostField = (
    <div className="md:col-span-2 pt-2">
      <DynamicQuestionFormHost
        categoryType={categoryType}
        formData={questionForm}
        onChange={updateFormField}
        onTestCaseChange={handleUpdateTestCase}
        onAddTestCase={handleAddTestCase}
        onRemoveTestCase={handleRemoveTestCase}
        onMcqOptionChange={handleUpdateMcqOption}
        expandedSections={expandedFormSections}
        onToggleSection={toggleFormSection}
      />
    </div>
  );

  if (!mounted || categoriesLoading || questionsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      
      {/* ADD/EDIT QUESTION DIALOG MODAL */}
      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={handleCloseQuestionModal} />

          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl transition-all">
            <div className="sticky top-0 z-20 px-6 py-4 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 backdrop-blur flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">{questionFormMode === 'bulk' ? 'Bulk Add Questions' : editingQuestionId ? 'Edit Question' : 'Add Question'}</h2>
              <button
                onClick={handleCloseQuestionModal}
                className="text-sm text-black/40 dark:text-white/40"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-2">
              {questionFormMode === 'bulk' ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
                    <div className="flex-1">
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Number of questions</label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(e.target.value)}
                        className={questionFormInputClass}
                      />
                    </div>
                    <button type="button" onClick={generateBulkForms} className="h-10 px-4 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold">
                      Generate Forms
                    </button>
                  </div>
                  {bulkForms.map((form, index) => (
                    <div key={index} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#3C83F6] dark:text-[#bceaff]">Question {index + 1}</p>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="md:col-span-2">
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Tag*</label>
                          <input value={form.title} onChange={(e) => updateBulkFormField(index, 'title', e.target.value)} placeholder="JFS / SERVLET / JDBC" className={questionFormInputClass} />
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Difficulty*</label>
                          <select value={form.difficulty} onChange={(e) => updateBulkFormField(index, 'difficulty', e.target.value)} className={questionFormInputClass}>
                            <option className={dropdownOptionClass}>Easy</option>
                            <option className={dropdownOptionClass}>Medium</option>
                            <option className={dropdownOptionClass}>Hard</option>
                          </select>
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Topic Tags</label>
                          <input
                            value={form.tagInput}
                            onChange={(e) => updateBulkFormField(index, 'tagInput', e.target.value)}
                            onBlur={() => {
                              const tags = form.tagInput.split(',').map((tag) => tag.trim()).filter(Boolean);
                              updateBulkFormField(index, 'tags', tags);
                            }}
                            placeholder="JFS, SERVLET"
                            className={questionFormInputClass}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="admin-micro-label text-black/45 dark:text-white/45">{isMcqCategory ? 'Question Prompt*' : isNotesCategory ? 'Notes Description*' : 'Problem Description*'}</label>
                          <textarea value={form.problemDescription} onChange={(e) => updateBulkFormField(index, 'problemDescription', e.target.value)} rows={3} className={questionFormInputClass} />
                        </div>
                        {isMcqCategory && (
                          <>
                            {form.options.map((option, optionIndex) => (
                              <input
                                key={option.label}
                                value={option.text}
                                onChange={(e) => {
                                  const options = form.options.map((opt, i) => (i === optionIndex ? { ...opt, text: e.target.value } : opt));
                                  updateBulkFormField(index, 'options', options);
                                }}
                                placeholder={`Option ${option.label}`}
                                className={questionFormInputClass}
                              />
                            ))}
                            <select value={form.correctOption} onChange={(e) => updateBulkFormField(index, 'correctOption', e.target.value)} className={questionFormInputClass}>
                              {['A', 'B', 'C', 'D'].map((label) => <option key={label} className={dropdownOptionClass}>{label}</option>)}
                            </select>
                          </>
                        )}
                        {isCodingCategory && (
                          <>
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <textarea
                                value={form.visibleTestCases?.[0]?.input || ''}
                                onChange={(e) => {
                                  const visibleTestCases = [{ ...(form.visibleTestCases?.[0] || createTestCase()), input: e.target.value }];
                                  updateBulkFormField(index, 'visibleTestCases', visibleTestCases);
                                }}
                                rows={2}
                                placeholder="Visible test input"
                                className={questionFormInputClass}
                              />
                              <textarea
                                value={form.visibleTestCases?.[0]?.output || ''}
                                onChange={(e) => {
                                  const visibleTestCases = [{ ...(form.visibleTestCases?.[0] || createTestCase()), output: e.target.value }];
                                  updateBulkFormField(index, 'visibleTestCases', visibleTestCases);
                                }}
                                rows={2}
                                placeholder="Visible test output"
                                className={questionFormInputClass}
                              />
                              <textarea
                                value={form.hiddenTestCases?.[0]?.input || ''}
                                onChange={(e) => {
                                  const hiddenTestCases = [{ ...(form.hiddenTestCases?.[0] || createTestCase()), input: e.target.value }];
                                  updateBulkFormField(index, 'hiddenTestCases', hiddenTestCases);
                                }}
                                rows={2}
                                placeholder="Hidden test input"
                                className={questionFormInputClass}
                              />
                              <textarea
                                value={form.hiddenTestCases?.[0]?.output || ''}
                                onChange={(e) => {
                                  const hiddenTestCases = [{ ...(form.hiddenTestCases?.[0] || createTestCase()), output: e.target.value }];
                                  updateBulkFormField(index, 'hiddenTestCases', hiddenTestCases);
                                }}
                                rows={2}
                                placeholder="Hidden test output"
                                className={questionFormInputClass}
                              />
                            </div>
                          </>
                        )}
                        {isNotesCategory && (
                          <div className="md:col-span-2">
                            <label className="admin-micro-label text-black/45 dark:text-white/45">Markdown Body*</label>
                            <textarea
                              value={form.markdownBody}
                              onChange={(e) => updateBulkFormField(index, 'markdownBody', e.target.value)}
                              rows={4}
                              placeholder="Paste markdown content for this note"
                              className={questionFormInputClass}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {isMcqCategory ? (
                  <>
                    {descriptionField}
                    {dynamicHostField}
                    {explanationField}
                    {titleField}
                    {tagsField}
                  </>
                ) : (
                  <>
                    {titleField}
                    {difficultyField}
                    {tagsField}
                    {descriptionField}
                    {dynamicHostField}
                  </>
                )}
              </div>
              )}

              {formError && (
                <p className="text-sm text-red-500 font-semibold">{formError}</p>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 backdrop-blur flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseQuestionModal}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSavingQuestion}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70 transition-colors"
              >
                {isSavingQuestion ? 'Saving...' : questionFormMode === 'bulk' ? 'Submit All Questions' : editingQuestionId ? 'Save Changes' : 'Create Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW QUESTION PREVIEW MODAL */}
      {viewQuestion && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setViewQuestion(null)} />

          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl p-6 transition-all space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {viewQuestion.difficulty || 'Easy'} • {categoryType} Question
                </span>
                <h3 className="text-xl font-bold text-[#3C83F6] dark:text-[#bceaff] mt-1">
                  {viewQuestion.title || 'Untitled Question'}
                </h3>
              </div>
              <button
                onClick={() => setViewQuestion(null)}
                className="h-8 w-8 rounded-xl border border-black/10 dark:border-white/15 inline-flex items-center justify-center text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-800 dark:text-slate-200">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Description</h4>
                <p className="mt-1 whitespace-pre-line leading-relaxed">{viewQuestion.description || 'No description provided.'}</p>
              </div>

              {/* Coding Specific View */}
              {isCodingCategory && (
                <>
                  {viewQuestion.inputFormat && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider font-medium">Input Format</h4>
                      <p className="mt-1 leading-relaxed">{viewQuestion.inputFormat}</p>
                    </div>
                  )}
                  {viewQuestion.outputFormat && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider font-medium">Output Format</h4>
                      <p className="mt-1 leading-relaxed">{viewQuestion.outputFormat}</p>
                    </div>
                  )}
                  {Array.isArray(viewQuestion.visibleTestCases) && viewQuestion.visibleTestCases.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider font-medium">Visible Test Cases</h4>
                      <div className="mt-2 space-y-2">
                        {viewQuestion.visibleTestCases.map((tc, index) => (
                          <div key={index} className="rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-3 text-xs font-mono">
                            <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Test Case #{index + 1}</p>
                            <p><strong>Input:</strong> {tc.input}</p>
                            <p className="mt-1"><strong>Output:</strong> {tc.output}</p>
                            {tc.explanation && <p className="mt-1 italic text-slate-400">Explanation: {tc.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* MCQ Specific View */}
              {isMcqCategory && Array.isArray(viewQuestion.options) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2 font-medium">Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewQuestion.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`rounded-xl border p-3 flex items-center justify-between ${
                          String(opt.label) === String(viewQuestion.correctOption)
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : 'border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5'
                        }`}
                      >
                        <span><strong>{opt.label}:</strong> {opt.text || '(empty)'}</span>
                        {String(opt.label) === String(viewQuestion.correctOption) && (
                          <span className="text-xs font-semibold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {viewQuestion.explanation && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider font-medium">Explanation</h4>
                      <p className="mt-1 italic text-slate-300">{viewQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Specific View */}
              {isNotesCategory && (
                <>
                  {viewQuestion.markdownBody && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1 font-medium">Markdown Snippet</h4>
                      <pre className="mt-1 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-xs font-mono max-h-48 overflow-y-auto">
                        {viewQuestion.markdownBody}
                      </pre>
                    </div>
                  )}
                  {viewQuestion.markdownFileUrl && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider font-medium">Markdown File</h4>
                      <a href={viewQuestion.markdownFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline mt-1 block">
                        {viewQuestion.markdownFileUrl}
                      </a>
                    </div>
                  )}
                  {viewQuestion.solutionNotes && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider font-medium">Summary Notes</h4>
                      <p className="mt-1">{viewQuestion.solutionNotes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end">
              <button
                onClick={() => setViewQuestion(null)}
                className="h-10 px-5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs md:text-sm font-semibold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}      {/* DELETE QUESTION CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">Delete Question?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTarget.title}</span>? This action is permanent and cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteQuestion}
                disabled={isDeletingQuestion}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isDeletingQuestion ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
      
      {/* Navigation sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      {/* Page main container */}
      <main
        onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {questionsError && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 mt-4">
              <div className="flex items-center justify-between gap-4">
                <span>{questionsError}</span>
                <button onClick={refetchQuestions} className="font-semibold underline underline-offset-2">Retry</button>
              </div>
            </div>
          )}

          <div>
            <h1 className="admin-page-title">{category?.title || 'Category Details'}</h1>
          </div>

          {/* Core detail panel wrapping table */}
          <CategoryDetailPanel
            category={category || { title: 'Loading...', categoryType }}
            questions={questions}
            onAddQuestion={handleAddQuestionClick}
            onEditQuestion={handleEditQuestionClick}
            onDeleteQuestion={setDeleteTarget}
            onViewQuestion={setViewQuestion}
            onBulkAddQuestions={handleBulkAddQuestionClick}
            usageAnalytics={usageAnalytics}
          />
        </div>
      </main>
    </div>
  );
};

export default QuestionBankCategoryDetailPage;
