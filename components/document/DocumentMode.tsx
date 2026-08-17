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

  // Grouped by outcome rather than left flat with colour badges — the reader
  // is scanning for the interesting cases in a mass of ordinary ones, and a
  // position in the page is a stronger cue than a colour is. Ambiguous first
  // even when a word is also unmatched: DESIGN-REWORK.md §3, and the more
  // actionable fact about a word that is both is that it has several
  // dictionary-valid readings the algorithm never reached.
  const ambiguousRows = rows.items.filter((row) => row.candidates.length > 1)
  const unmatchedRows = rows.items.filter((row) => !row.found && row.candidates.length <= 1)
  const resolvedRows = rows.items.filter((row) => row.found && row.candidates.length <= 1)

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <h1>{copy.nav.dokumen}</h1>
        <p className="mt-3 max-w-baca leading-relaxed">{copy.navHint.dokumen}</p>
      </header>

      <textarea
        className="h-40 w-full border border-ruleLine bg-paper p-3 font-prose text-sm leading-relaxed outline-none focus:border-pen"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <p className="font-ui text-xs text-pencil">
        {rows.total} {locale === 'en' ? 'tokens' : 'token'} · {rows.items.length}{' '}
        {locale === 'en' ? 'unique' : 'unik'}
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

      <DocumentGroup
        title={locale === 'en' ? 'Several candidates' : 'Punya lebih dari satu kandidat'}
        hint={
          locale === 'en'
            ? 'The algorithm chose one; these words have another dictionary-valid reading it did not.'
            : 'Algoritma memilih satu; kata-kata ini punya bacaan lain yang sama sahnya menurut kamus.'
        }
        accent="teacher"
        rows={ambiguousRows}
        locale={locale}
        setKata={setKata}
      />
      <DocumentGroup
        title={locale === 'en' ? 'Not matched' : 'Tidak ketemu'}
        hint={
          locale === 'en'
            ? 'No rule and dictionary combination reached a root; the word is returned unchanged.'
            : 'Tidak ada kombinasi aturan dan kamus yang sampai ke kata dasar; kata dikembalikan apa adanya.'
        }
        accent="pencil"
        rows={unmatchedRows}
        locale={locale}
        setKata={setKata}
      />
      <DocumentGroup
        title={locale === 'en' ? 'Resolved' : 'Selesai'}
        hint={null}
        accent="pen"
        rows={resolvedRows}
        locale={locale}
        setKata={setKata}
      />
    </div>
  )
}

interface DocumentRow {
  readonly kata: string
  readonly hasil: string
  readonly found: boolean
  readonly candidates: readonly string[]
}

/** One outcome group — DESIGN-REWORK.md §3: position in the page carries the
 *  scan, not colour. Empty groups collapse rather than showing "(0)". */
function DocumentGroup({
  title,
  hint,
  accent,
  rows,
  locale,
  setKata,
}: {
  title: string
  hint: string | null
  accent: 'teacher' | 'pencil' | 'pen'
  rows: readonly DocumentRow[]
  locale: Locale
  setKata: (kata: string) => void
}) {
  if (rows.length === 0) return null
  const accentClass = accent === 'teacher' ? 'text-teacher' : accent === 'pencil' ? 'text-pencil' : 'text-pen'

  return (
    <section>
      <h2 className={`font-ui text-sm ${accentClass}`}>
        {title} <span className="font-word font-normal">({rows.length})</span>
      </h2>
      {hint && <p className="mt-0.5 max-w-baca font-ui text-xs text-pencil">{hint}</p>}
      <ul className="mt-2 grid gap-px border-t border-ruleLine sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.kata} className="baris flex items-baseline justify-between gap-3 py-1.5">
            <button
              className="font-word text-sm underline decoration-ruleLine hover:text-pen"
              onClick={() => setKata(row.kata)}
              title={locale === 'en' ? 'open the trace' : 'buka jejaknya'}
            >
              {row.kata}
            </button>
            <span className="flex items-baseline gap-2 text-right font-word text-sm">
              <span className={row.found ? '' : 'text-pencil'}>{row.hasil}</span>
              {row.candidates.length > 1 && (
                // Red for genuine ambiguity, and for nothing else here — this
                // group's heading already carries the scan; the badge is a
                // second, redundant cue, not the only one.
                <span className="font-ui text-xs text-teacher" title={row.candidates.join(', ')}>
                  {row.candidates.length} {locale === 'en' ? 'readings' : 'bacaan'}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
