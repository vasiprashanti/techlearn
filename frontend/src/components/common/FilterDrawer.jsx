import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import './filterDrawer.css';

const normalizeOption = (option) => (typeof option === 'string' ? { value: option, label: option } : option);

const initialValues = (groups, applied) => {
  const values = {};
  groups.forEach((group) => {
    const current = applied?.[group.id];
    values[group.id] = group.type === 'chips'
      ? (Array.isArray(current) ? [...current] : [])
      : (current ?? group.defaultValue ?? '');
  });
  return values;
};

/**
 * Right-side filter drawer shared by Learn, Hiring and Roadmaps.
 * groups: [{ id, label, type: 'radio' | 'chips', options: [string | { value, label, hint }], defaultValue }]
 * applied: { [groupId]: string | string[] }  (the filters currently in effect)
 * onApply(values) receives the drawer's selection; onClear() resets the page's filters.
 */
export default function FilterDrawer({
  open,
  onClose,
  groups,
  applied,
  onApply,
  onClear,
  title = 'FILTERS',
  description = 'Find the right option for your goals.',
}) {
  const [values, setValues] = useState(() => initialValues(groups, applied));
  const closeRef = useRef(null);

  // start from the filters currently applied each time the drawer opens
  useEffect(() => {
    if (open) setValues(initialValues(groups, applied));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const setRadio = (groupId, value) => setValues((prev) => ({ ...prev, [groupId]: value }));
  const toggleChip = (groupId, value) => setValues((prev) => {
    const current = prev[groupId] || [];
    return { ...prev, [groupId]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
  });

  const handleClear = () => {
    setValues(initialValues(groups, {}));
    onClear?.();
  };

  return (
    <>
      <div className={`tl-fd-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`tl-fd-panel ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open}>
        <div className="tl-fd-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" ref={closeRef} className="tl-fd-close" aria-label="Close filters" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="tl-fd-body">
          {groups.map((group) => (
            <fieldset key={group.id} className="tl-fd-group">
              <legend>{group.label}</legend>
              {group.type === 'chips' ? (
                <div className="tl-fd-chips">
                  {group.options.map(normalizeOption).map((option) => {
                    const selected = (values[group.id] || []).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        className={`tl-fd-chip ${selected ? 'selected' : ''}`}
                        onClick={() => toggleChip(group.id, option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  {group.options.length === 0 && <span className="tl-fd-none">Nothing to filter by yet.</span>}
                </div>
              ) : (
                <div className="tl-fd-radios">
                  {group.options.map(normalizeOption).map((option) => (
                    <label key={option.value} className="tl-fd-radio">
                      <input
                        type="radio"
                        name={`fd-${group.id}`}
                        checked={values[group.id] === option.value}
                        onChange={() => setRadio(group.id, option.value)}
                      />
                      <span className="tl-fd-dot" />
                      <span className="tl-fd-radio-copy">
                        <strong>{option.label}</strong>
                        {option.hint && <small>{option.hint}</small>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ))}
        </div>

        <div className="tl-fd-actions">
          <button type="button" className="tl-fd-clear" onClick={handleClear}>Clear filters</button>
          <button type="button" className="tl-fd-apply" onClick={() => onApply(values)}>Apply filters</button>
        </div>
      </aside>
    </>
  );
}
