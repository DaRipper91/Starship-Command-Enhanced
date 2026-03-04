import { LayoutGrid, PenTool, Text, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import MODULE_DEFINITIONS from '../generated/module-definitions.json';
import { cn } from '../lib/utils';
import { useThemeStore } from '../stores/theme-store';
import { BaseModuleConfig } from '../types/starship.types';
import { FormatSegmentEditor } from './FormatSegmentEditor';

// Define types for format segments
export interface TextSegment {
  type: 'text';
  value: string;
}

export interface ModuleSegment {
  type: 'module';
  value: string; // e.g., 'directory', 'git_branch'
  style?: string;
}

export interface StyledTextSegment {
  type: 'styledText';
  text: string;
  style: string;
}

export type FormatSegment = TextSegment | ModuleSegment | StyledTextSegment;

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
  }, [formatString, currentTheme.config]);

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

      {editingSegment !== null && (
        <FormatSegmentEditor
          segment={segments[editingSegment]}
          activeText={activeText}
          setActiveText={setActiveText}
          activeStyle={activeStyle}
          setActiveStyle={setActiveStyle}
          showIconBrowser={showIconBrowser}
          setShowIconBrowser={setShowIconBrowser}
          onSegmentChange={(newProps) =>
            handleSegmentChange(editingSegment, newProps)
          }
          onRemove={() => removeSegment(editingSegment)}
          availableModules={availableModules}
        />
      )}
    </div>
  );
}
