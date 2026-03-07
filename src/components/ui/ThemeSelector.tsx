import React from 'react';

import { Theme } from '../../types/starship.types';

interface ThemeSelectorProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  themes: Theme[];
}

export function ThemeSelector({
  label,
  name,
  value,
  onChange,
  themes,
}: ThemeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
      >
        {themes.map((theme) => (
          <option key={theme.metadata.id} value={theme.metadata.id}>
            {theme.metadata.name}
          </option>
        ))}
      </select>
    </div>
  );
}
