import { X } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '../../lib/utils';
import { ExportTab } from './ExportTab';
import { ImportTab } from './ImportTab';

interface ExportImportProps {
  onClose: () => void;
  initialTab?: 'export' | 'import';
}

export function ExportImport({
  onClose,
  initialTab = 'export',
}: ExportImportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('export')}
              className={cn(
                'text-lg font-bold transition-colors',
                activeTab === 'export'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              Export
            </button>
            <span className="text-gray-600">/</span>
            <button
              onClick={() => setActiveTab('import')}
              className={cn(
                'text-lg font-bold transition-colors',
                activeTab === 'import'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              Import
            </button>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <ExportTab />
          ) : (
            <ImportTab onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
