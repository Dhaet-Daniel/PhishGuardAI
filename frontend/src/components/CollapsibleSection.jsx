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
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 text-left transition"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">
            {open ? '−' : '+'} {title}
          </span>
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
