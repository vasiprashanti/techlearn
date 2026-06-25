import React, { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export const CategoryCreateModal = ({ isOpen, editingCategory, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    categoryType: 'Coding',
    status: 'Draft',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const categoryFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  useEffect(() => {
    if (editingCategory) {
      setForm({
        title: editingCategory.title || '',
        categoryType: editingCategory.categoryType || 'Coding',
        status: editingCategory.status || 'Draft',
      });
    } else {
      setForm({
        title: '',
        categoryType: 'Coding',
        status: 'Draft',
      });
    }
    setError('');
    setSaving(false);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Category title is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || 'Failed to save category.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
            {editingCategory ? 'Edit Question Category' : 'Add Question Category'}
          </h2>
          <button onClick={onClose} className="text-sm text-black/40 dark:text-white/40">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-2">
          <div>
            <label className="admin-micro-label text-black/45 dark:text-white/45">Category Type</label>
            <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
              <select
                value={form.categoryType}
                onChange={(e) => setForm(prev => ({ ...prev, categoryType: e.target.value }))}
                disabled={Boolean(editingCategory)}
                className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none disabled:opacity-70"
              >
                <option className={dropdownOptionClass} value="Coding">Coding</option>
                <option className={dropdownOptionClass} value="MCQ">MCQ</option>
                <option className={dropdownOptionClass} value="Notes">Notes</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
            </div>
          </div>

          <div>
            <label className="admin-micro-label text-black/45 dark:text-white/45">Category Title*</label>
            <input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter category name"
              className={categoryFormInputClass}
            />
          </div>

          <div>
            <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
            <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
              >
                <option className={dropdownOptionClass} value="Active">Active</option>
                <option className={dropdownOptionClass} value="Draft">Draft</option>
                <option className={dropdownOptionClass} value="Archived">Archived</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition-colors disabled:opacity-70"
            >
              {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryCreateModal;
