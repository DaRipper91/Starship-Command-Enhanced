import { Copy, Download, Share2, Terminal } from 'lucide-react';
import React from 'react';

import { useToast } from '../../contexts/ToastContext';
import { TomlParser } from '../../lib/toml-parser';
import { useThemeStore } from '../../stores/theme-store';

export function ExportTab() {
  const { currentTheme } = useThemeStore();
  const { addToast } = useToast();

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

  return (
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
            <div className="font-semibold text-gray-200">Download .toml</div>
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
            <div className="font-semibold text-gray-200">Copy to Clipboard</div>
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
            <div className="font-semibold text-gray-200">Share Link</div>
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
          <br /># Paste the clipboard contents into ~/.config/starship.toml
        </div>
      </div>
    </div>
  );
}
