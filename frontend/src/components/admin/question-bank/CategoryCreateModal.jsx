import React, { useState, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { adminAPI } from '../../../services/adminApi';

export const CategoryCreateModal = ({ isOpen, editingCategory, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    categoryType: 'Coding',
    mcqSection: 'Technical',
    status: 'Draft',
    usage: 'Both',
    visibility: 'Both',
    batches: [],
    bannerImage: '',
    defaultIcon: 'Code',
    description: '',
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const categoryFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  useEffect(() => {
    if (isOpen) {
      setLoadingBatches(true);
      adminAPI.getBatches()
        .then((res) => {
          const list = Array.isArray(res) ? res : res.batches || res.data || [];
          setBatches(list);
        })
        .catch((err) => console.error("Failed to load batches:", err))
        .finally(() => setLoadingBatches(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingCategory) {
      setForm({
        title: editingCategory.title || '',
        categoryType: editingCategory.categoryType || 'Coding',
        mcqSection: editingCategory.mcqSection || (/aptitude/i.test(`${editingCategory.title || ''} ${editingCategory.slug || ''}`) ? 'Aptitude' : 'Technical'),
        status: editingCategory.status || 'Draft',
        usage: editingCategory.usage || editingCategory.visibility || 'Both',
        visibility: editingCategory.usage || editingCategory.visibility || 'Both',
        batches: editingCategory.batches || [],
        bannerImage: editingCategory.bannerImage || '',
        defaultIcon: editingCategory.defaultIcon || 'Code',
        description: editingCategory.description || editingCategory.subtitle || '',
      });
    } else {
      setForm({
        title: '',
        categoryType: 'Coding',
        mcqSection: 'Technical',
        status: 'Draft',
        usage: 'Both',
        visibility: 'Both',
        batches: [],
        bannerImage: '',
        defaultIcon: 'Code',
        description: '',
      });
    }
    setBannerFile(null);
    setError('');
    setSaving(false);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setForm(prev => ({
        ...prev,
        bannerImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Category title is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('categoryType', form.categoryType);
      formData.append('mcqSection', form.mcqSection);
      formData.append('status', form.status);
      formData.append('usage', form.usage);
      formData.append('visibility', form.usage);
      formData.append('defaultIcon', form.defaultIcon);
      formData.append('batches', JSON.stringify(form.batches));
      formData.append('description', form.description.trim());
      formData.append('subtitle', form.description.trim());

      if (bannerFile) {
        formData.append('bannerFile', bannerFile);
      } else {
        formData.append('bannerImage', form.bannerImage);
      }

      await onSave(formData);
    } catch (err) {
      setError(err.message || 'Failed to save category.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Fixed Header */}
        <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
            {editingCategory ? 'Edit Question Category' : 'Add Question Category'}
          </h2>
          <button onClick={onClose} className="text-sm text-black/40 dark:text-white/40">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 min-h-0">
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {form.categoryType === 'MCQ' && (
              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Daily Task Section</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43]">
                  <select
                    value={form.mcqSection}
                    onChange={(e) => setForm(prev => ({ ...prev, mcqSection: e.target.value }))}
                    className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="Technical">Technical MCQ</option>
                    <option className={dropdownOptionClass} value="Aptitude">Aptitude</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>
            )}

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
              <label className="admin-micro-label text-black/45 dark:text-white/45">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                className={categoryFormInputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Usage</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={form.usage}
                    onChange={(e) => setForm(prev => ({ ...prev, usage: e.target.value, visibility: e.target.value }))}
                    className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="Both">Both</option>
                    <option className={dropdownOptionClass} value="Practice">Practice</option>
                    <option className={dropdownOptionClass} value="Assessment">Assessment</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Default Icon</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={form.defaultIcon}
                    onChange={(e) => setForm(prev => ({ ...prev, defaultIcon: e.target.value }))}
                    className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                  >
                    {['None', 'Code', 'Database', 'Brain', 'Notebook', 'Cpu', 'Briefcase', 'Globe', 'Terminal', 'Chart'].map(iconOpt => (
                      <option key={iconOpt} className={dropdownOptionClass} value={iconOpt}>{iconOpt}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Left: Image Upload */}
              <div className="flex flex-col justify-between p-4 border border-black/10 dark:border-white/15 rounded-xl bg-white/50 dark:bg-[#0f1f43]/50 h-44">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45 block mb-1">Banner Image</label>
                  <span className="text-[10px] text-black/35 dark:text-white/35 block mb-2">Upload a card banner image.</span>
                </div>
                <div className="flex-1 flex flex-col justify-end gap-2">
                  {form.bannerImage && (
                    <div className="relative w-full h-16 rounded-lg overflow-hidden border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      <img src={form.bannerImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setForm(prev => ({ ...prev, bannerImage: '' }));
                        }}
                        className="absolute right-1 top-1 bg-red-500 text-white rounded-full p-1 text-[8px] leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#3C83F6]/10 file:text-[#3C83F6] hover:file:bg-[#3C83F6]/20 cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Right: Assign to Batches */}
              <div className="flex flex-col p-4 border border-black/10 dark:border-white/15 rounded-xl bg-white/50 dark:bg-[#0f1f43]/50 h-44">
                <label className="admin-micro-label text-black/45 dark:text-white/45 block mb-1.5 shrink-0">Assign to Batches</label>
                {loadingBatches ? (
                  <p className="text-xs text-black/45 dark:text-white/45 mt-1">Loading...</p>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {batches.map((b) => {
                      const id = b._id || b.id;
                      const isChecked = form.batches.includes(id);
                      return (
                        <label key={id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer py-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setForm(prev => ({
                                ...prev,
                                batches: e.target.checked
                                  ? [...prev.batches, id]
                                  : prev.batches.filter(item => item !== id)
                              }));
                            }}
                            className="rounded border-black/10 dark:border-white/15 text-[#3C83F6] focus:ring-[#3C83F6]"
                          />
                          <span className="truncate">{b.name}</span>
                        </label>
                      );
                    })}
                    {batches.length === 0 && (
                      <p className="text-xs text-black/40 dark:text-white/40">No batches available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-[#0a1737]/50">
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
