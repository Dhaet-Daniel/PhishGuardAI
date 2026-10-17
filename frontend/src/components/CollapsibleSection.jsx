import { useState } from 'react';

export default function CollapsibleSection({
  title,
  tooltip,
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group w-full flex items-center justify-between gap-3 px-4 py-3 min-h-11 bg-slate-800 hover:bg-slate-700 text-left transition active:scale-[0.99]"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-700 text-sm font-bold text-slate-200 transition group-hover:bg-blue-500/20 group-hover:text-blue-300">
            {open ? '−' : '+'}
          </span>
          <span className="text-sm font-medium text-slate-300">{title}</span>
          <span className="text-xs text-slate-500">(optional)</span>
        </span>
        {tooltip && (
          <i
            className="fas fa-question-circle text-slate-500 hover:text-slate-400 ml-2"
            title={tooltip}
            style={{ cursor: 'help' }}
          ></i>
        )}
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-slate-900/40 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}
