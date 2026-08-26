import React from 'react';

/**
 * A deliberately small Markdown subset for user-written descriptions.
 *
 * Renders to React nodes rather than an HTML string, so there is no
 * dangerouslySetInnerHTML anywhere and no sanitiser to get wrong: React escapes
 * every text node, and only the tags below are ever constructed. A provider
 * cannot inject markup by typing it.
 *
 * Supported: **bold**, *italic*, `code`, - bullets, 1. numbered lists, blank
 * line paragraphs and single-line breaks. Everything else is literal text.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em] text-gray-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function renderRichText(input: string | undefined | null): React.ReactNode {
  if (!input) return null;

  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];

  // Consecutive list lines have to be gathered before emitting, otherwise each
  // bullet becomes its own single-item list and the spacing looks wrong.
  let bullets: string[] = [];
  let numbers: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5">
          {bullets.map((b, i) => <li key={i}>{renderInline(b, `b${blocks.length}-${i}`)}</li>)}
        </ul>
      );
      bullets = [];
    }
    if (numbers.length) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="my-2 list-decimal space-y-1 pl-5">
          {numbers.map((b, i) => <li key={i}>{renderInline(b, `n${blocks.length}-${i}`)}</li>)}
        </ol>
      );
      numbers = [];
    }
    if (paragraph.length) {
      const idx = blocks.length;
      blocks.push(
        <p key={`p-${idx}`} className="my-2 whitespace-pre-line">
          {paragraph.map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {renderInline(line, `p${idx}-${i}`)}
            </React.Fragment>
          ))}
        </p>
      );
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (bullet) {
      if (paragraph.length || numbers.length) flush();
      bullets.push(bullet[1]);
    } else if (numbered) {
      if (paragraph.length || bullets.length) flush();
      numbers.push(numbered[1]);
    } else if (line.trim() === '') {
      flush();
    } else {
      if (bullets.length || numbers.length) flush();
      paragraph.push(line);
    }
  }
  flush();

  return <>{blocks}</>;
}

/**
 * Flattens the same subset back to plain text, for teasers and card previews
 * where formatting has no room to render and the raw ** would just be noise.
 */
export function toPlainText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/\r\n/g, '\n')
    .replace(/^\s*([-*]|\d+[.)])\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
}
