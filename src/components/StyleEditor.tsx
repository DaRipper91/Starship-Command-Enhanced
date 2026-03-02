import { Bold, Italic, Underline } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '../lib/utils';
import { ColorPicker } from './ColorPicker';

interface StyleEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StyleEditor({ value, onChange, className }: StyleEditorProps) {
  const [fgColor, setFgColor] = useState('');
  const [bgColor, setBgColor] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isInverted, setIsInverted] = useState(false);

  // Parse style string on mount/change
  useEffect(() => {
    if (!value) {
      setFgColor('');
      setBgColor('');
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setIsDimmed(false);
      setIsInverted(false);
      return;
    }

    const parts = value.split(/\s+/);
    let fg = '';
    let bg = '';
    let bold = false;
    let italic = false;
    let underline = false;
    let dimmed = false;
    let inverted = false;

    parts.forEach((p) => {
      if (p === 'bold') bold = true;
      else if (p === 'italic') italic = true;
      else if (p === 'underline') underline = true;
      else if (p === 'dimmed') dimmed = true;
      else if (p === 'inverted') inverted = true;
      else if (p.startsWith('bg:')) bg = p.substring(3);
      else fg = p;
    });

    setFgColor(fg);
    setBgColor(bg);
    setIsBold(bold);
    setIsItalic(italic);
    setIsUnderline(underline);
    setIsDimmed(dimmed);
    setIsInverted(inverted);
  }, [value]);

  const updateStyle = (
    newFg: string,
    newBg: string,
    modifiers: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
      dimmed: boolean;
      inverted: boolean;
    },
  ) => {
    const parts: string[] = [];

    if (modifiers.bold) parts.push('bold');
    if (modifiers.italic) parts.push('italic');
    if (modifiers.underline) parts.push('underline');
    if (modifiers.dimmed) parts.push('dimmed');
    if (modifiers.inverted) parts.push('inverted');

    if (newBg) parts.push(`bg:${newBg}`);
    if (newFg) parts.push(newFg);

    onChange(parts.join(' '));
  };

  const handleModifierChange = (
    mod: 'bold' | 'italic' | 'underline' | 'dimmed' | 'inverted',
  ) => {
    const modifiers = {
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      dimmed: isDimmed,
      inverted: isInverted,
    };
    modifiers[mod] = !modifiers[mod];

    // Update local state for immediate feedback
    if (mod === 'bold') setIsBold(!isBold);
    if (mod === 'italic') setIsItalic(!isItalic);
    if (mod === 'underline') setIsUnderline(!isUnderline);
    if (mod === 'dimmed') setIsDimmed(!isDimmed);
    if (mod === 'inverted') setIsInverted(!isInverted);

    updateStyle(fgColor, bgColor, modifiers);
  };

  const handleFgChange = (color: string) => {
    setFgColor(color);
    updateStyle(color, bgColor, {
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      dimmed: isDimmed,
      inverted: isInverted,
    });
  };

  const handleBgChange = (color: string) => {
    setBgColor(color);
    updateStyle(fgColor, color, {
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      dimmed: isDimmed,
      inverted: isInverted,
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-md border border-gray-700 bg-gray-800 p-4',
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Foreground
          </label>
          <ColorPicker color={fgColor} onChange={handleFgChange} />
        </div>
        <div className="flex-1">
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Background
          </label>
          <ColorPicker color={bgColor} onChange={handleBgChange} />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-400">
          Modifiers
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleModifierChange('bold')}
            className={cn(
              'flex items-center justify-center rounded border border-transparent p-2 transition-colors',
              isBold
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200',
            )}
            title="Bold"
            aria-label="Toggle Bold"
            aria-pressed={isBold}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => handleModifierChange('italic')}
            className={cn(
              'flex items-center justify-center rounded border border-transparent p-2 transition-colors',
              isItalic
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200',
            )}
            title="Italic"
            aria-label="Toggle Italic"
            aria-pressed={isItalic}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => handleModifierChange('underline')}
            className={cn(
              'flex items-center justify-center rounded border border-transparent p-2 transition-colors',
              isUnderline
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200',
            )}
            title="Underline"
            aria-label="Toggle Underline"
            aria-pressed={isUnderline}
          >
            <Underline size={16} />
          </button>

          <button
            onClick={() => handleModifierChange('dimmed')}
            className={cn(
              'flex h-9 items-center rounded border border-gray-600 px-3 py-1 text-xs font-medium transition-colors',
              isDimmed
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'bg-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200',
            )}
            aria-pressed={isDimmed}
          >
            Dim
          </button>

          <button
            onClick={() => handleModifierChange('inverted')}
            className={cn(
              'flex h-9 items-center rounded border border-gray-600 px-3 py-1 text-xs font-medium transition-colors',
              isInverted
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'bg-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200',
            )}
            aria-pressed={isInverted}
          >
            Inverted
          </button>
        </div>
      </div>
    </div>
  );
}
