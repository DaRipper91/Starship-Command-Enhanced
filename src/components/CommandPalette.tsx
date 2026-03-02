import { FileTerminal, Search, X } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '../lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    id: string;
    title: string;
    icon?: React.ReactNode;
    shortcut?: string;
    perform: () => void;
  }[];
}

export function CommandPalette({
  isOpen,
  onClose,
  actions,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredActions = actions.filter((action) =>
    action.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl duration-200">
        <div className="flex items-center gap-3 border-b border-gray-800 p-4">
          <Search className="text-gray-400" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filteredActions.length > 0) {
                filteredActions[0].perform();
                onClose();
              }
            }}
            className="flex-1 bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded bg-gray-800 p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            aria-label="Close command palette"
          >
            <X size={16} />
          </button>
        </div>
        <div className="scrollbar-thin scrollbar-thumb-gray-700 flex max-h-[300px] flex-col overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => {
                  action.perform();
                  onClose();
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-gray-800 hover:text-white',
                  index === 0 && search && 'bg-gray-800 text-white', // Auto-select first result if searching
                )}
              >
                <div className="text-gray-400">
                  {action.icon || <FileTerminal size={18} />}
                </div>
                <span className="flex-1 text-gray-300">{action.title}</span>
                {action.shortcut && (
                  <span className="rounded border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-xs tracking-widest text-gray-500">
                    {action.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
