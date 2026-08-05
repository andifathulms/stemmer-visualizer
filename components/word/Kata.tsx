'use client'

import type { Morpheme, Segmentation } from '@/lib/app/segmentation'

/**
 * The word, large, with pencil slashes at the morpheme boundaries — PRD §8.
 * Monospace so that boundaries align vertically down the trace and the peeling
 * reads as a column.
 *
 * The one animation in the app lives here — the peeling. The affix just
 * removed slides aside and fades to pencil, the stem re-centres, a dictionary
 * hit flashes highlighter yellow, and a backtrack slides the word back.
 * `prefers-reduced-motion` is handled globally in globals.css, which renders
 * the whole trace statically instead.
 */

/** What the step now being shown did, so the word can act it out. */
export type Peeling =
  | { readonly kind: 'buang-awalan' }
  | { readonly kind: 'buang-akhiran' }
  | { readonly kind: 'ketemu' }
  | { readonly kind: 'mundur' }
  | null

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
  peeling = null,
  /** Bumping this restarts the animation — usually the visible step index. */
  beat = 0,
}: {
  segmentation: Segmentation
  size?: 'besar' | 'kecil'
  peeling?: Peeling
  beat?: number
}) {
  const { morphemes, restored } = segmentation
  const scale = size === 'besar' ? 'text-4xl sm:text-5xl' : 'text-xl'

  // Only the morpheme this step actually detached moves; the rest hold still.
  const lastAwalan = morphemes.map((m) => m.kind).lastIndexOf('awalan')
  const firstAkhiran = morphemes.findIndex((m) => m.kind === 'akhiran')

  function affixAnimation(index: number, kind: Morpheme['kind']): string {
    if (peeling?.kind === 'buang-awalan' && kind === 'awalan' && index === lastAwalan) {
      return 'animate-lepas-awalan'
    }
    if (peeling?.kind === 'buang-akhiran' && kind === 'akhiran' && index === firstAkhiran) {
      return 'animate-lepas-akhiran'
    }
    return ''
  }

  return (
    <div
      key={peeling?.kind === 'mundur' ? `mundur-${beat}` : 'tenang'}
      className={`font-word ${scale} tracking-tight ${
        peeling?.kind === 'mundur' ? 'animate-kembali' : ''
      }`}
    >
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
            // it is marked rather than drawn as though it had always been there.
            <span
              className="rounded-sm bg-highlight/40 px-0.5"
              title="huruf yang dikembalikan (peluruhan)"
            >
              {restored}
            </span>
          )}
          <span
            key={`${beat}-${index}`}
            className={`inline-block transition-transform duration-300 ${tone(morpheme.kind)} ${affixAnimation(
              index,
              morpheme.kind,
            )} ${
              morpheme.kind === 'sisa' && peeling?.kind === 'ketemu'
                ? 'animate-kilat-kamus rounded-sm'
                : ''
            }`}
            title={morpheme.ruleId ?? undefined}
          >
            {morpheme.text}
          </span>
        </span>
      ))}
    </div>
  )
}
