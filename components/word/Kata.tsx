'use client'

import type { Morpheme, Segmentation } from '@/lib/app/segmentation'

/**
 * The word, large, with pencil slashes at the morpheme boundaries — PRD §8.
 * Monospace so that boundaries align vertically down the trace and the peeling
 * reads as a column.
 *
 * The one animation in the app lives here: an affix that has just been
 * detached slides aside and fades to pencil. `prefers-reduced-motion` is
 * handled globally in globals.css, which renders the whole thing statically.
 */

function tone(kind: Morpheme['kind']): string {
  switch (kind) {
    case 'awalan':
    case 'akhiran':
      return 'text-pencil'
    case 'sisa':
      return 'text-pen'
    default: {
      const never: never = kind
      return never
    }
  }
}

export function Kata({
  segmentation,
  size = 'besar',
}: {
  segmentation: Segmentation
  size?: 'besar' | 'kecil'
}) {
  const { morphemes, restored } = segmentation
  const scale = size === 'besar' ? 'text-4xl sm:text-5xl' : 'text-xl'

  return (
    <div className={`font-word ${scale} tracking-tight`}>
      {morphemes.map((morpheme, index) => (
        <span key={`${morpheme.kind}-${index}-${morpheme.text}`}>
          {index > 0 && morpheme.text !== '' && (
            // The pencil slash a reader would draw between affix and root.
            <span aria-hidden className="mx-0.5 text-pencil/70">
              /
            </span>
          )}
          {morpheme.kind === 'sisa' && restored !== null && (
            // A letter peluruhan put back. It was never in the input word, so
            // it is marked rather than drawn as if it had always been there.
            <span
              className="rounded-sm bg-highlight/40 px-0.5"
              title="huruf yang dikembalikan (peluruhan)"
            >
              {restored}
            </span>
          )}
          <span
            className={`transition-opacity duration-300 ${tone(morpheme.kind)}`}
            title={morpheme.ruleId ?? undefined}
          >
            {morpheme.text}
          </span>
        </span>
      ))}
    </div>
  )
}
