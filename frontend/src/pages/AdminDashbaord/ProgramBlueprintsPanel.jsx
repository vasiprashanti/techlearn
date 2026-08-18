import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/adminApi';
import {
  FiChevronDown,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

const BLUEPRINT_TYPES_BY_PROGRAM_TYPE = {
  Placement: [
    'day_0_readiness',
    'revision',
    'company_preparation',
    'final_assessment',
  ],
  Skill: ['final_assessment'],
};

const BLUEPRINT_TYPE_LABELS = {
  day_0_readiness: 'Day 0 Placement Readiness',
  revision: 'Revision',
  company_preparation: 'Company Preparation',
  final_assessment: 'Final Assessment',
};

const statusClass = (status) => {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (status === 'Archived') return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
};

const getCategoryId = (category) => String(category?.id || category?._id || '');

const createEmptyForm = (blueprintType) => ({
  name: BLUEPRINT_TYPE_LABELS[blueprintType] || 'New Blueprint',
  blueprintType,
  status: 'Draft',
  configurations: [{ categoryId: '', questionCount: '1', difficulty: 'Any', pattern: '' }],
});

const cloneBlueprintForm = (blueprint) => ({
  name: blueprint.name || BLUEPRINT_TYPE_LABELS[blueprint.blueprintType] || 'Blueprint',
  blueprintType: blueprint.blueprintType,
  status: blueprint.status || 'Draft',
  configurations: (blueprint.configurations || []).map((configuration) => ({
    categoryId: String(configuration.categoryId?._id || configuration.categoryId || ''),
    questionCount: String(configuration.questionCount || 1),
    difficulty: configuration.difficulty || 'Any',
    pattern: configuration.pattern || '',
  })),
});

const formatQuestionCount = (value) => `${value} ${Number(value) === 1 ? 'question' : 'questions'}`;

export default function ProgramBlueprintsPanel({ programId, programType, onCountChange }) {
  const allowedTypes = BLUEPRINT_TYPES_BY_PROGRAM_TYPE[programType] || [];
  const [blueprints, setBlueprints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState(null);
  const [form, setForm] = useState(() => createEmptyForm(allowedTypes[0] || 'final_assessment'));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const fetchBlueprints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [blueprintResponse, categoryResponse] = await Promise.all([
        adminAPI.getProgramBlueprints(programId),
        adminAPI.getQuestionCategories({ includeDrafts: 'true' }),
      ]);
      const nextBlueprints = blueprintResponse?.blueprints || [];
      setBlueprints(nextBlueprints);
      setCategories(Array.isArray(categoryResponse) ? categoryResponse : (categoryResponse?.data || []));
      onCountChange?.(nextBlueprints.length);
    } catch (err) {
      console.error('Error fetching program blueprints:', err);
      setError(err.message || 'Failed to load blueprints.');
    } finally {
      setLoading(false);
    }
  }, [onCountChange, programId]);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  const existingTypes = useMemo(
    () => new Set(blueprints.map((blueprint) => blueprint.blueprintType)),
    [blueprints]
  );

  const firstAvailableType = allowedTypes.find((type) => !existingTypes.has(type)) || allowedTypes[0] || 'final_assessment';

  const handleOpenCreate = () => {
    setEditingBlueprint(null);
    setForm(createEmptyForm(firstAvailableType));
    setFormError('');
    setEditorOpen(true);
  };

  const handleOpenEdit = (blueprint) => {
    setEditingBlueprint(blueprint);
    setForm(cloneBlueprintForm(blueprint));
    setFormError('');
    setEditorOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleConfigurationChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      configurations: current.configurations.map((configuration, configurationIndex) => (
        configurationIndex === index ? { ...configuration, [field]: value } : configuration
      )),
    }));
  };

  const handleAddConfiguration = () => {
    setForm((current) => ({
      ...current,
      configurations: [...current.configurations, { categoryId: '', questionCount: '1', difficulty: 'Any', pattern: '' }],
    }));
  };

  const handleRemoveConfiguration = (index) => {
    setForm((current) => ({
      ...current,
      configurations: current.configurations.filter((_, configurationIndex) => configurationIndex !== index),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Blueprint name is required.');
      return;
    }
    if (!allowedTypes.includes(form.blueprintType)) {
      setFormError('This blueprint type is not available for the selected program.');
      return;
    }
    if (!form.configurations.length) {
      setFormError('Add at least one question-bank category.');
      return;
    }

    const configurations = form.configurations.map((configuration) => ({
      categoryId: configuration.categoryId,
      questionCount: Number(configuration.questionCount),
      difficulty: configuration.difficulty || 'Any',
      pattern: configuration.pattern || '',
    }));
    if (configurations.some((configuration) => !configuration.categoryId)) {
      setFormError('Select a question-bank category for every row.');
      return;
    }
    if (configurations.some((configuration) => !Number.isInteger(configuration.questionCount) || configuration.questionCount < 1)) {
      setFormError('Question counts must be whole numbers greater than zero.');
      return;
    }
    if (new Set(configurations.map((configuration) => configuration.categoryId)).size !== configurations.length) {
      setFormError('Each question-bank category can appear only once.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        blueprintType: form.blueprintType,
        status: form.status,
        configurations,
      };
      if (editingBlueprint) {
        await adminAPI.updateProgramBlueprint(programId, editingBlueprint._id, payload);
      } else {
        await adminAPI.createProgramBlueprint(programId, payload);
      }
      setEditorOpen(false);
      await fetchBlueprints();
    } catch (err) {
      console.error('Error saving program blueprint:', err);
      setFormError(err.message || 'Failed to save blueprint.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blueprint) => {
    if (!window.confirm(`Delete ${blueprint.name}?`)) return;
    try {
      setDeletingId(blueprint._id);
      await adminAPI.deleteProgramBlueprint(programId, blueprint._id);
      await fetchBlueprints();
    } catch (err) {
      console.error('Error deleting program blueprint:', err);
      setError(err.message || 'Failed to delete blueprint.');
    } finally {
      setDeletingId('');
    }
  };

  const selectClass = 'h-10 w-full appearance-none rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] px-3 pr-9 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30';
  const inputClass = 'h-10 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] px-3 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/80 p-4">
        <div>
          <div className="flex items-center gap-2">
            <FiLayers className="h-4 w-4 text-[#3C83F6] dark:text-[#bceaff]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assessment Blueprints</h3>
          </div>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            Blueprints define how many questions to assign from each Question Bank category. They never store question IDs.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={!allowedTypes.length || existingTypes.size >= allowedTypes.length}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3C83F6] px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#2f73e0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Create Blueprint
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          <span>{error}</span>
          <button type="button" onClick={fetchBlueprints} className="font-bold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/80 p-10 text-center text-sm text-black/50 dark:text-white/50">
          Loading blueprints...
        </div>
      ) : blueprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 bg-white/50 dark:bg-[#0f1f43]/50 p-10 text-center">
          <FiLayers className="mx-auto h-8 w-8 text-[#3C83F6]/60 dark:text-[#bceaff]/60" />
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-white">No blueprints configured yet</p>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            Create a {programType} blueprint to define the assessment question mix.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {blueprints.map((blueprint) => (
            <article key={blueprint._id} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-[#0f1f43]/80 p-4 shadow-[0_3px_10px_rgba(15,23,42,0.03)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{blueprint.name}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusClass(blueprint.status)}`}>
                      {blueprint.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                    {BLUEPRINT_TYPE_LABELS[blueprint.blueprintType] || blueprint.blueprintType}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => handleOpenEdit(blueprint)} className="flex h-7 w-7 items-center justify-center rounded-lg text-black/50 transition-colors hover:bg-black/5 hover:text-[#3C83F6] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-[#bceaff]" title="Edit blueprint">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(blueprint)} disabled={deletingId === blueprint._id} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10" title="Delete blueprint">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                <div className="grid grid-cols-[1fr_auto] gap-3 bg-black/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-black/45 dark:bg-white/[0.04] dark:text-white/45">
                  <span>Question Bank Category</span>
                  <span>Count</span>
                </div>
                {(blueprint.configurations || []).map((configuration) => (
                    <div key={`${blueprint._id}-${configuration.categoryId}`} className="grid grid-cols-[1fr_auto] gap-3 border-t border-black/5 px-3 py-2 text-xs dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-200">
                      {configuration.category || 'Untitled category'}
                      {(configuration.difficulty && configuration.difficulty !== 'Any') || configuration.pattern ? (
                        <span className="ml-2 text-[10px] font-medium text-black/45 dark:text-white/45">
                          {[configuration.difficulty !== 'Any' ? configuration.difficulty : '', configuration.pattern].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatQuestionCount(configuration.questionCount)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-[11px] font-bold text-black/50 dark:text-white/50">
                Total: {formatQuestionCount(blueprint.totalQuestionCount || 0)}
              </p>
            </article>
          ))}
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-2xl dark:border-white/10 dark:bg-[#0a1737]/95">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-[#3C83F6] dark:text-[#bceaff]">
                  {editingBlueprint ? 'Edit Blueprint' : 'Create Blueprint'}
                </h3>
                <p className="mt-0.5 text-[11px] text-black/45 dark:text-white/45">Configure category mix and question counts.</p>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-black/45 hover:bg-black/5 dark:text-white/45 dark:hover:bg-white/10" title="Close">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 p-5">
                {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{formError}</p>}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="admin-micro-label text-black/45 dark:text-white/45">Blueprint Name*</span>
                    <input name="name" value={form.name} onChange={handleFormChange} className={inputClass} required />
                  </label>
                  <label className="block">
                    <span className="admin-micro-label text-black/45 dark:text-white/45">Blueprint Type*</span>
                    <div className="relative">
                      <select name="blueprintType" value={form.blueprintType} onChange={handleFormChange} className={selectClass}>
                        {allowedTypes.map((type) => <option key={type} className={dropdownOptionClass} value={type}>{BLUEPRINT_TYPE_LABELS[type]}</option>)}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 dark:text-white/60" />
                    </div>
                  </label>
                </div>

                <label className="block sm:max-w-[50%]">
                  <span className="admin-micro-label text-black/45 dark:text-white/45">Status</span>
                  <div className="relative">
                    <select name="status" value={form.status} onChange={handleFormChange} className={selectClass}>
                      <option className={dropdownOptionClass} value="Draft">Draft</option>
                      <option className={dropdownOptionClass} value="Active">Active</option>
                      <option className={dropdownOptionClass} value="Archived">Archived</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 dark:text-white/60" />
                  </div>
                </label>

                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Question Configuration</h4>
                      <p className="mt-0.5 text-[11px] text-black/45 dark:text-white/45">Choose existing categories; actual questions are selected later by the engine.</p>
                    </div>
                    <button type="button" onClick={handleAddConfiguration} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#3C83F6]/30 px-2.5 text-[11px] font-bold text-[#3C83F6] hover:bg-[#3C83F6]/5 dark:border-[#bceaff]/30 dark:text-[#bceaff]">
                      <FiPlus className="h-3.5 w-3.5" />
                      Add Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.configurations.map((configuration, index) => (
                      <div key={`configuration-${index}`} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_100px_120px_minmax(0,1fr)_32px]">
                        <label className="block min-w-0">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Category</span>
                          <div className="relative">
                            <select value={configuration.categoryId} onChange={(event) => handleConfigurationChange(index, 'categoryId', event.target.value)} className={selectClass}>
                              <option className={dropdownOptionClass} value="">Select category</option>
                              {categories.map((category) => {
                                const categoryId = getCategoryId(category);
                                const alreadySelected = form.configurations.some((row, rowIndex) => rowIndex !== index && row.categoryId === categoryId);
                                return <option key={categoryId} className={dropdownOptionClass} value={categoryId} disabled={alreadySelected}>{category.title || category.name || 'Untitled category'}{category.status === 'Draft' ? ' (Draft)' : ''}</option>;
                              })}
                            </select>
                            <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 dark:text-white/60" />
                          </div>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Count</span>
                          <input type="number" min="1" step="1" value={configuration.questionCount} onChange={(event) => handleConfigurationChange(index, 'questionCount', event.target.value)} className={inputClass} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Difficulty</span>
                          <select value={configuration.difficulty || 'Any'} onChange={(event) => handleConfigurationChange(index, 'difficulty', event.target.value)} className={selectClass}>
                            <option className={dropdownOptionClass} value="Any">Any</option>
                            <option className={dropdownOptionClass} value="Easy">Easy</option>
                            <option className={dropdownOptionClass} value="Medium">Medium</option>
                            <option className={dropdownOptionClass} value="Hard">Hard</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Pattern (optional)</span>
                          <input value={configuration.pattern || ''} onChange={(event) => handleConfigurationChange(index, 'pattern', event.target.value)} placeholder="e.g. arrays" className={inputClass} />
                        </label>
                        <button type="button" onClick={() => handleRemoveConfiguration(index)} disabled={form.configurations.length === 1} className="mb-0.5 flex h-10 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:text-red-400 dark:hover:bg-red-500/10" title="Remove row">
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-black/10 bg-white/60 px-5 py-3.5 dark:border-white/10 dark:bg-[#0a1737]/60">
                <button type="button" onClick={() => setEditorOpen(false)} className="h-9 rounded-lg border border-black/10 px-3.5 text-xs font-bold text-slate-700 hover:bg-black/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3C83F6] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#2f73e0] disabled:opacity-60">
                  <FiSave className="h-3.5 w-3.5" />
                  {saving ? 'Saving...' : editingBlueprint ? 'Save Changes' : 'Create Blueprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
