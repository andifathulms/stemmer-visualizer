'use client'

import { useMemo, useState } from 'react'
import { useKupas } from '@/components/app/KupasProvider'
import { interpret } from '@/lib/engine/interpret'
import { enumerate } from '@/lib/engine/enumerate'
import { normalize } from '@/lib/engine/text'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * Document mode — PRD §5.7. Paste text, get roots, with the words flagged
 * where the stemmer had several candidates or fell through without a match.
 *
 * This is the view for someone building a search index who wants to know where
 * their pipeline is quietly guessing. A document-sized paste is the ceiling —
 * this is not a batch pipeline (PRD §4).
 */

const CONTOH =
  'Pengupasan imbuhan membantu pencarian dokumen. Beruang itu mengupas kulit buah dengan cakarnya, lalu menyapu lantai.'

const MAX_WORDS = 400

export function DocumentMode({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { pack, dictionary, setKata } = useKupas()
  const [text, setText] = useState(CONTOH)

  const rows = useMemo(() => {
    const tokens = text
      .split(/[^\p{L}\p{M}-]+/u)
      .map((token) => normalize(token))
      .filter((token) => token.length > 1)

    const unique = [...new Set(tokens)].slice(0, MAX_WORDS)

    return {
      truncated: new Set(tokens).size > MAX_WORDS,
      total: tokens.length,
      items: unique.map((kata) => {
        const trace = interpret({ word: kata, pack, dictionary })
        const tree = enumerate({ word: kata, pack, dictionary })
        return {
          kata,
          hasil: trace.result,
          found: trace.found,
          candidates: tree.candidates.map((c) => c.kata),
        }
      }),
    }
  }, [text, pack, dictionary])

  const ambiguous = rows.items.filter((row) => row.candidates.length > 1).length
  const missed = rows.items.filter((row) => !row.found).length

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-word text-2xl">{copy.nav.dokumen}</h1>
        <p className="text-sm leading-relaxed">{copy.navHint.dokumen}</p>
      </header>

      <textarea
        className="h-40 w-full border border-ruleLine bg-paper p-3 font-prose text-sm leading-relaxed outline-none focus:border-pen"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <p className="font-ui text-xs text-pencil">
        {rows.total} {locale === 'en' ? 'tokens' : 'token'} · {rows.items.length}{' '}
        {locale === 'en' ? 'unique' : 'unik'} ·{' '}
        <span className="text-teacher">{ambiguous}</span>{' '}
        {locale === 'en' ? 'with several candidates' : 'punya lebih dari satu kandidat'} ·{' '}
        {missed} {locale === 'en' ? 'not matched' : 'tidak ketemu'}
        {rows.truncated && (
          <>
            {' '}
            ·{' '}
            <span className="text-pen">
              {locale === 'en'
                ? `only the first ${MAX_WORDS} unique words are shown`
                : `hanya ${MAX_WORDS} kata unik pertama yang ditampilkan`}
            </span>
          </>
        )}
      </p>

      <ul className="grid gap-px border-t border-ruleLine sm:grid-cols-2">
        {rows.items.map((row) => (
          <li key={row.kata} className="baris flex items-baseline justify-between gap-3 py-1.5">
            <button
              className="font-word text-sm underline decoration-ruleLine hover:text-pen"
              onClick={() => setKata(row.kata)}
              title={locale === 'en' ? 'open the trace' : 'buka jejaknya'}
            >
              {row.kata}
            </button>
            <span className="flex items-baseline gap-2 text-right font-word text-sm">
              {row.found ? (
                <span>{row.hasil}</span>
              ) : (
                <span className="text-pencil">
                  {row.hasil}{' '}
                  <span className="font-ui text-xs">
                    {locale === 'en' ? '(no match)' : '(tak ketemu)'}
                  </span>
                </span>
              )}
              {row.candidates.length > 1 && (
                // Red for genuine ambiguity, and for nothing else here.
                <span
                  className="font-ui text-xs text-teacher"
                  title={row.candidates.join(', ')}
                >
                  {row.candidates.length} {locale === 'en' ? 'readings' : 'bacaan'}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
