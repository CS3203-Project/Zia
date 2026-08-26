import { useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { renderRichText } from '../../utils/richText';

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

/**
 * Textarea with a small formatting toolbar.
 *
 * Stores Markdown rather than HTML on purpose: the stored value stays readable
 * and safe to render anywhere, and there is no markup to sanitise later.
 */
export default function RichTextArea({
  value,
  onChange,
  placeholder,
  rows = 6,
  maxLength,
  className,
}: RichTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  /** Wraps the selection, or inserts a sample so the button always does something. */
  const wrap = (token: string, sample: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || sample;
    const next = `${value.slice(0, start)}${token}${selected}${token}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length + selected.length);
    });
  };

  /** Prefixes each selected line, so turning three lines into a list is one click. */
  const prefixLines = (make: (index: number) => string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const target = value.slice(lineStart, end) || '';
    const lines = (target || 'List item').split('\n');
    const prefixed = lines.map((l, i) => `${make(i)}${l.replace(/^\s*([-*]|\d+[.)])\s+/, '')}`).join('\n');
    const next = `${value.slice(0, lineStart)}${prefixed}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + prefixed.length);
    });
  };

  const btn = 'rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900';

  return (
    <div className={className}>
      <div className="flex items-center gap-1 rounded-t-xl border border-b-0 border-gray-200 bg-gray-50 px-2 py-1.5">
        <button type="button" className={btn} title="Bold" onClick={() => wrap('**', 'bold text')}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Italic" onClick={() => wrap('*', 'italic text')}>
          <Italic className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" />
        <button type="button" className={btn} title="Bullet list" onClick={() => prefixLines(() => '- ')}>
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn}
          title="Numbered list"
          onClick={() => prefixLines((i) => `${i + 1}. `)}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="ml-auto pr-1 text-xs text-gray-400">Markdown</span>
      </div>

      <textarea
        ref={ref}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-b-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
      />

      {value.trim() && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
            Preview
          </summary>
          <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            {renderRichText(value)}
          </div>
        </details>
      )}
    </div>
  );
}
