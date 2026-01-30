import { useState } from 'react';

export default function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        type="button"
        className={`w-full flex items-center justify-between px-3 py-2 rounded-t-lg font-semibold text-left transition-colors bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400 ${open ? 'rounded-b-none' : 'rounded-b-lg'}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="ml-2">{open ? '☝🏼' : '👇🏻'}</span>
      </button>
      {open && (
        <div className="p-3 bg-gray-700 rounded-b-lg border-t border-gray-600">
          {children}
        </div>
      )}
    </div>
  );
}
