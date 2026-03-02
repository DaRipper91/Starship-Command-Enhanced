import {
  AlertCircle,
  ClipboardPaste,
  Copy,
  Download,
  Link,
  Share2,
  Terminal,
  Upload,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '../../contexts/ToastContext';
import { TomlParser } from '../../lib/toml-parser';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../stores/theme-store';
import { LoadingSpinner } from '../LoadingSpinner';

interface ExportImportProps {
  onClose: () => void;
  initialTab?: 'export' | 'import';
}

export function ExportImport({
  onClose,
  initialTab = 'export',
}: ExportImportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab);
  const { currentTheme, importToml } = useThemeStore();
  const { addToast } = useToast();

  const [importText, setImportText] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- EXPORT LOGIC ---

  const handleDownload = () => {
    try {
      const toml = TomlParser.stringify(currentTheme.config);
      const blob = new Blob([toml], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'starship.toml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('File downloaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to generate file.', 'error');
    }
  };

  const handleCopy = async () => {
    try {
      const toml = TomlParser.stringify(currentTheme.config);
      await navigator.clipboard.writeText(toml);
      addToast('Copied to clipboard!', 'success');
    } catch (err) {
      addToast('Failed to copy text.', 'error');
    }
  };

  const handleShareUrl = async () => {
    try {
      const toml = TomlParser.stringify(currentTheme.config);
      const base64 = btoa(encodeURIComponent(toml));
      const url = `${window.location.origin}${window.location.pathname}?theme=${base64}`;
      await navigator.clipboard.writeText(url);
      addToast('Share URL copied to clipboard!', 'success');
    } catch (err) {
      addToast('Failed to create share URL.', 'error');
    }
  };

  // --- IMPORT LOGIC ---

  const executeImport = (tomlString: string) => {
    try {
      importToml(tomlString);
      addToast('Theme imported successfully!', 'success');
      onClose();
    } catch (err) {
      setValidationError(
        `Failed to import: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const validateAndImport = (tomlString: string) => {
    try {
      setValidationError(null);
      setImportWarnings([]);
      setPendingImport(null);

      // Try to parse to see if it's valid
      const parsedConfig = TomlParser.parse(tomlString);
      const { valid, errors, warnings } = TomlParser.validate(parsedConfig);

      if (!valid) {
        setValidationError(
          `Invalid config: ${errors.join(', ') || 'Unknown error'}`,
        );
        return false;
      }

      if (warnings.length > 0) {
        setImportWarnings(warnings);
        setPendingImport(tomlString);
        return false; // Wait for user confirmation
      }

      if (!confirm('This will overwrite your current theme. Are you sure?')) {
        return false;
      }

      executeImport(tomlString);
      return true;
    } catch (err) {
      setValidationError(
        `Invalid TOML syntax: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          validateAndImport(content);
        } catch (err) {
          setValidationError(
            `Failed to process file: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      };
      reader.onerror = () => {
        setValidationError('Failed to read file.');
      };
      reader.readAsText(file);
    } catch (err) {
      setValidationError(
        `Failed to load file: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      // Reset input
      e.target.value = '';
    }
  };

  const handlePasteImport = () => {
    if (!importText.trim()) {
      setValidationError('Please paste TOML configuration first.');
      return;
    }
    try {
      validateAndImport(importText);
    } catch (err) {
      setValidationError(
        `Failed to import: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      setValidationError('Please enter a URL.');
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      // Very basic URL fetch (CORS might block this in a real app unless using a proxy)
      const res = await fetch(importUrl);
      if (!res.ok) throw new Error('Failed to fetch from URL');
      const text = await res.text();
      validateAndImport(text);
    } catch (err) {
      setValidationError(
        'Failed to fetch from URL. Make sure it points to a raw text file.',
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDownload}
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-900/10"
                >
                  <div className="rounded-full bg-blue-900/30 p-2 text-blue-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Download size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">
                      Download .toml
                    </div>
                    <div className="text-xs text-gray-500">
                      Save directly to your computer
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleCopy}
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 text-left transition-colors hover:border-green-500 hover:bg-green-900/10"
                >
                  <div className="rounded-full bg-green-900/30 p-2 text-green-400 transition-colors group-hover:bg-green-600 group-hover:text-white">
                    <Copy size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">
                      Copy to Clipboard
                    </div>
                    <div className="text-xs text-gray-500">
                      Paste into your starship.toml
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleShareUrl}
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 text-left transition-colors hover:border-purple-500 hover:bg-purple-900/10"
                >
                  <div className="rounded-full bg-purple-900/30 p-2 text-purple-400 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">
                      Share Link
                    </div>
                    <div className="text-xs text-gray-500">
                      Generate a URL to this theme
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-black/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Terminal size={16} /> Install Command
                </div>
                <div className="flex-1 rounded border border-gray-800 bg-[#0d1117] p-3 font-mono text-xs text-gray-300">
                  mkdir -p ~/.config && touch ~/.config/starship.toml
                  <br />
                  <br /># Paste the clipboard contents into
                  ~/.config/starship.toml
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {validationError && (
                <div className="flex items-start gap-2 rounded-md border border-red-800 bg-red-900/20 p-3 text-sm text-red-200">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{validationError}</p>
                </div>
              )}

              {importWarnings.length > 0 && pendingImport && (
                <div className="flex flex-col gap-3 rounded-md border border-yellow-800 bg-yellow-900/20 p-4 text-sm text-yellow-200">
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertCircle size={18} className="shrink-0" />
                    <p>Import Warnings</p>
                  </div>
                  <ul className="ml-6 list-disc space-y-1 opacity-90">
                    {importWarnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {importWarnings.length > 5 && (
                      <li>...and {importWarnings.length - 5} more warnings</li>
                    )}
                  </ul>
                  <p className="mt-2 text-yellow-100 opacity-90">
                    This will overwrite your current theme. Do you still want to
                    proceed?
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => executeImport(pendingImport)}
                      className="rounded bg-yellow-600 px-4 py-2 font-medium text-white hover:bg-yellow-500"
                    >
                      Import Anyway
                    </button>
                    <button
                      onClick={() => {
                        setImportWarnings([]);
                        setPendingImport(null);
                      }}
                      className="rounded border border-yellow-700 bg-transparent px-4 py-2 font-medium text-yellow-200 hover:bg-yellow-900/40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div className="relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800 transition-colors hover:border-blue-500">
                    <input
                      type="file"
                      accept=".toml,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    />
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <Upload className="mb-2 text-gray-400" size={24} />
                      <div className="font-semibold text-gray-200">
                        Upload File
                      </div>
                      <div className="text-xs text-gray-500">
                        Drop your starship.toml here
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Link size={16} /> From URL / Gist
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://raw.githubusercontent.com/..."
                        disabled={isLoading}
                        className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <button
                        onClick={handleUrlImport}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading && (
                          <LoadingSpinner className="h-4 w-4 text-white" />
                        )}
                        {isLoading ? 'Loading...' : 'Fetch'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <ClipboardPaste size={16} /> Paste TOML
                    </div>
                    <button
                      onClick={handlePasteImport}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                    >
                      Import
                    </button>
                  </div>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="[character]\nsuccess_symbol = '❯'\n..."
                    className="flex-1 resize-none rounded border border-gray-700 bg-gray-900 p-3 font-mono text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
                    rows={8}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
