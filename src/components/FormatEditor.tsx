import { LayoutGrid, PenTool, Text, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import MODULE_DEFINITIONS from '../generated/module-definitions.json';
import { cn } from '../lib/utils';
import { useThemeStore } from '../stores/theme-store';
import { BaseModuleConfig } from '../types/starship.types';
import { IconBrowser } from './IconBrowser';
import { StyleEditor } from './StyleEditor'; // Reusing StyleEditor for segment styling

// Define types for format segments
interface TextSegment {
  type: 'text';
  value: string;
}

interface ModuleSegment {
  type: 'module';
  value: string; // e.g., 'directory', 'git_branch'
  style?: string;
}

interface StyledTextSegment {
  type: 'styledText';
  text: string;
  style: string;
}

type FormatSegment = TextSegment | ModuleSegment | StyledTextSegment;

interface FormatEditorProps {
  formatString: string;
  onChange: (newFormatString: string) => void;
}

export function FormatEditor({ formatString, onChange }: FormatEditorProps) {
  const { currentTheme } = useThemeStore();
  const [segments, setSegments] = useState<FormatSegment[]>([]);
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [showIconBrowser, setShowIconBrowser] = useState(false);
  const [activeStyle, setActiveStyle] = useState('');
  const [activeText, setActiveText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Parse format string into segments on initial load and formatString change
  useEffect(() => {
    const parseSegments = (input: string): FormatSegment[] => {
      const newSegments: FormatSegment[] = [];
      const remaining = input;

      // Regex to find styled text: [text](style) or modules: $module
      const regex = /(\[([^\]]+)\]\(([^)]+)\)|\$([a-zA-Z0-9_]+))/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
          newSegments.push({
            type: 'text',
            value: remaining.substring(lastIndex, match.index),
          });
        }

        if (match[1].startsWith('[')) {
          // Styled text segment: [text](style)
          newSegments.push({
            type: 'styledText',
            text: match[2],
            style: match[3],
          });
        } else if (match[4]) {
          // Module segment: $module
          newSegments.push({
            type: 'module',
            value: match[4],
            style: (currentTheme.config[match[4]] as BaseModuleConfig)?.style, // Grab style from current theme
          });
        }
        lastIndex = regex.lastIndex;
      }

      if (remaining.length > lastIndex) {
        newSegments.push({
          type: 'text',
          value: remaining.substring(lastIndex),
        });
      }
      return newSegments;
    };
    setSegments(parseSegments(formatString));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatString]);

  // Convert segments back to format string
  const compileFormatString = useCallback((s: FormatSegment[]): string => {
    return s
      .map((segment) => {
        if (segment.type === 'text') return segment.value;
        if (segment.type === 'module') {
          // Modules don't keep inline style in format string unless it's overridden
          return `$${segment.value}`;
        }
        if (segment.type === 'styledText')
          return `[${segment.text}](${segment.style})`;
        return '';
      })
      .join('');
  }, []);

  const handleSegmentClick = (index: number) => {
    setEditingSegment(index);
    const seg = segments[index];
    if (seg.type === 'text') setActiveText(seg.value);
    else if (seg.type === 'styledText') setActiveText(seg.text);
    else setActiveText('');

    setActiveStyle(
      segments[index].type === 'styledText'
        ? (segments[index] as StyledTextSegment).style
        : '',
    );
    setShowIconBrowser(false);
  };

  const handleSegmentChange = (
    index: number,
    newProps: Partial<FormatSegment>,
  ) => {
    const newSegments = [...segments];
    newSegments[index] = {
      ...newSegments[index],
      ...newProps,
    } as FormatSegment;
    setSegments(newSegments);
    onChange(compileFormatString(newSegments));
  };

  const addSegment = (type: 'text' | 'module' | 'styledText') => {
    const newSegments = [...segments];
    if (type === 'text') newSegments.push({ type: 'text', value: 'New Text' });
    if (type === 'module')
      newSegments.push({ type: 'module', value: 'directory' });
    if (type === 'styledText')
      newSegments.push({
        type: 'styledText',
        text: 'Styled Text',
        style: 'white',
      });
    setSegments(newSegments);
    onChange(compileFormatString(newSegments));
    setEditingSegment(newSegments.length - 1); // Edit the newly added segment
  };

  const removeSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    onChange(compileFormatString(newSegments));
    setEditingSegment(null);
  };

  const handleAddText = () => addSegment('text');
  const handleAddModule = () => addSegment('module');
  const handleAddStyledText = () => addSegment('styledText');

  const availableModules = MODULE_DEFINITIONS.map((m) => m.name);

  const renderSegmentEditor = () => {
    if (editingSegment === null) return null;
    const segment = segments[editingSegment];

    const handleIconSelect = (icon: string) => {
      setShowIconBrowser(false);

      // If module, update module's symbol in global config (more complex)
      // For now, let's assume it's for styledText's text or directly injecting into module's symbol setting.
      // For module, a direct symbol field is better handled in ModuleConfig, so here we modify the text of styledText.
      if (segment.type !== 'styledText') {
        // This would need to update currentTheme.config[segment.value].symbol
        // For now, just update the text of the displayed segment
        // A more robust solution would be to edit the module's actual symbol prop in theme-store
        return;
      }

      handleSegmentChange(editingSegment, { text: icon });
      setActiveText(icon);
    };

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
              handleSegmentChange(editingSegment, { value: e.target.value });
              if (segment.type === 'styledText')
                handleSegmentChange(editingSegment, { text: e.target.value });
            }}
            className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Segment text"
          />
        )}

        {segment.type === 'module' && (
          <select
            value={segment.value}
            onChange={(e) =>
              handleSegmentChange(editingSegment, { value: e.target.value })
            }
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
                handleSegmentChange(editingSegment, { style: newStyle });
              }}
            />
          </div>
        )}

        {/* Icon Browser Integration (for symbols in modules or styled text) */}
        {(segment.type === 'module' || segment.type === 'styledText') && (
          <div className="relative flex flex-col gap-2" ref={editorRef}>
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
                  onSelect={handleIconSelect}
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => removeSegment(editingSegment)}
          className="mt-2 self-end rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
        >
          Remove Segment
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex min-h-[40px] flex-wrap items-center gap-2 rounded-md border border-gray-700 bg-gray-800 p-2"
        ref={editorRef}
      >
        {segments.map((segment, index) => (
          <button
            key={index}
            onClick={() => handleSegmentClick(index)}
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              editingSegment === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
            )}
          >
            {segment.type === 'text' && (
              <Text size={12} className="text-gray-400" />
            )}
            {segment.type === 'module' && (
              <LayoutGrid size={12} className="text-purple-400" />
            )}
            {segment.type === 'styledText' && (
              <PenTool size={12} className="text-green-400" />
            )}
            <span>
              {segment.type === 'text' && segment.value}
              {segment.type === 'module' && `$${segment.value}`}
              {segment.type === 'styledText' && `[${segment.text}]`}
            </span>
            {editingSegment === index && <X size={10} className="ml-1" />}
          </button>
        ))}
        {segments.length === 0 && (
          <span className="p-1 text-sm italic text-gray-500">
            Click + to add segments
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAddText}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          <Text size={16} /> Add Text
        </button>
        <button
          onClick={handleAddModule}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          <LayoutGrid size={16} /> Add Module
        </button>
        <button
          onClick={handleAddStyledText}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          <PenTool size={16} /> Add Styled Text
        </button>
      </div>

      {renderSegmentEditor()}
    </div>
  );
}
