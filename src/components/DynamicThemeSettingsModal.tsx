import { X } from 'lucide-react';
import React from 'react';

import { PRESET_THEMES } from '../lib/presets';
import { useThemeStore } from '../stores/theme-store';

interface DynamicThemeSettingsModalProps {
  onClose: () => void;
}

export function DynamicThemeSettingsModal({
  onClose,
}: DynamicThemeSettingsModalProps) {
  const { dynamicSettings, updateDynamicSettings, savedThemes } =
    useThemeStore();

  const allThemes = [...savedThemes, ...PRESET_THEMES];

  const handleToggle = () => {
    updateDynamicSettings({ enabled: !dynamicSettings.enabled });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    updateDynamicSettings({ [name]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
          <h2 className="text-lg font-bold text-white">
            Dynamic Theme Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">
                Enable Dynamic Theme
              </h3>
              <p className="text-sm text-gray-400">
                Automatically switch themes based on time of day.
              </p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dynamicSettings.enabled ? 'bg-blue-600' : 'bg-gray-600'
              }`}
              aria-label="Toggle dynamic theme"
              aria-checked={dynamicSettings.enabled}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dynamicSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-gray-800" />

          <div
            className={`flex flex-col gap-4 ${!dynamicSettings.enabled ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Day Theme
              </label>
              <select
                name="dayThemeId"
                value={dynamicSettings.dayThemeId}
                onChange={handleChange}
                className="w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              >
                {allThemes.map((theme) => (
                  <option key={theme.metadata.id} value={theme.metadata.id}>
                    {theme.metadata.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Day Start Time
              </label>
              <input
                type="time"
                name="dayStartTime"
                value={dynamicSettings.dayStartTime}
                onChange={handleChange}
                className="w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="my-2 h-px bg-gray-800" />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Night Theme
              </label>
              <select
                name="nightThemeId"
                value={dynamicSettings.nightThemeId}
                onChange={handleChange}
                className="w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              >
                {allThemes.map((theme) => (
                  <option key={theme.metadata.id} value={theme.metadata.id}>
                    {theme.metadata.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Night Start Time
              </label>
              <input
                type="time"
                name="nightStartTime"
                value={dynamicSettings.nightStartTime}
                onChange={handleChange}
                className="w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
