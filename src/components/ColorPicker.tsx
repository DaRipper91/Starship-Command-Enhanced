import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';
import { AlertTriangle, Check, Pipette } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { ColorUtils } from '../lib/color-utils';
import { cn } from '../lib/utils';

extend([namesPlugin, a11yPlugin]);

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const PRESET_COLORS = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'purple',
  'cyan',
  'white',
  '#1e1e1e',
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
];

export function ColorPicker({
  color,
  onChange,
  label,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync input with prop
  useEffect(() => {
    setInputValue(color);
  }, [color]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Only trigger change if valid color
    if (colord(e.target.value).isValid()) {
      onChange(e.target.value);
    }
  };

  // Contrast check against standard dark background
  const contrast = ColorUtils.checkContrast(inputValue, '#000000');
  const isAccessible = contrast.ratio >= 4.5;

  return (
    <div className={cn('relative', className)} ref={popoverRef}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        <div
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-gray-700 shadow-sm transition-transform active:scale-95"
          style={{ backgroundColor: inputValue }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Checkerboard pattern for transparency if needed, mainly just color preview */}
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="#000000 or red"
          />
          {isOpen ? (
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="Confirm color"
            >
              <Check size={14} />
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label="Pick color"
              aria-expanded={isOpen}
            >
              <Pipette size={14} />
            </button>
          )}
        </div>
      </div>

      {!isAccessible && inputValue && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-yellow-500">
          <AlertTriangle size={12} />
          <span>Low contrast ({contrast.ratio.toFixed(1)}:1)</span>
        </div>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-xl">
          <div className="mb-3">
            <HexColorPicker
              color={inputValue.startsWith('#') ? inputValue : '#ffffff'}
              onChange={handleColorChange}
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className="h-6 w-6 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
                style={{ backgroundColor: c }}
                onClick={() => handleColorChange(c)}
                title={c}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
