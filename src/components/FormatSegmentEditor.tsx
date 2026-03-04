import React from 'react';

import { useThemeStore } from '../stores/theme-store';
import { BaseModuleConfig } from '../types/starship.types';
import { FormatSegment, StyledTextSegment } from './FormatEditor';
import { IconBrowser } from './IconBrowser';
import { StyleEditor } from './StyleEditor';

interface FormatSegmentEditorProps {
  segment: FormatSegment;
  activeText: string;
  setActiveText: (text: string) => void;
  activeStyle: string;
  setActiveStyle: (style: string) => void;
  showIconBrowser: boolean;
  setShowIconBrowser: (show: boolean) => void;
  onSegmentChange: (newProps: Partial<FormatSegment>) => void;
  onRemove: () => void;
  availableModules: string[];
}

export function FormatSegmentEditor({
  segment,
  activeText,
  setActiveText,
  activeStyle,
  setActiveStyle,
  showIconBrowser,
  setShowIconBrowser,
  onSegmentChange,
  onRemove,
  availableModules,
}: FormatSegmentEditorProps) {
  const { currentTheme } = useThemeStore();

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-inner">
      <h4 className="text-sm font-semibold capitalize text-gray-200">
        Edit {segment.type.replace('Text', ' Text')} Segment
      </h4>

      {/* Text/Value Input */}
      {(segment.type === 'text' || segment.type === 'styledText') && (
        <input
          type="text"
          value={activeText}
          onChange={(e) => {
            setActiveText(e.target.value);
            onSegmentChange({ value: e.target.value });
            if (segment.type === 'styledText') {
              onSegmentChange({ text: e.target.value });
            }
          }}
          className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Segment text"
        />
      )}

      {segment.type === 'module' && (
        <select
          value={segment.value}
          onChange={(e) => onSegmentChange({ value: e.target.value })}
          className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {availableModules.map((modId) => (
            <option key={modId} value={modId}>
              {modId.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      )}

      {/* Style Input (for modules and styledText) */}
      {(segment.type === 'styledText' || segment.type === 'module') && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-400">Style</label>
          <StyleEditor
            value={activeStyle}
            onChange={(newStyle) => {
              setActiveStyle(newStyle);
              onSegmentChange({ style: newStyle });
            }}
          />
        </div>
      )}

      {/* Icon Browser Integration (for symbols in modules or styled text) */}
      {(segment.type === 'module' || segment.type === 'styledText') && (
        <div className="relative flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-400">
            Symbol (via Icon Browser)
          </label>
          <button
            onClick={() => setShowIconBrowser(!showIconBrowser)}
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            Browse Icons
          </button>
          {showIconBrowser && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full sm:w-[300px]">
              <IconBrowser
                currentSymbol={
                  segment.type === 'module'
                    ? (currentTheme.config[segment.value] as BaseModuleConfig)
                        ?.symbol || ''
                    : (segment as StyledTextSegment).text
                }
                onSelect={(icon) => {
                  if (segment.type === 'styledText') {
                    onSegmentChange({ text: icon });
                    setActiveText(icon);
                  }
                  setShowIconBrowser(false);
                }}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={onRemove}
        className="mt-2 self-end rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
      >
        Remove Segment
      </button>
    </div>
  );
}
