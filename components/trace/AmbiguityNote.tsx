'use client'

import Link from 'next/link'
import type { Ambiguity } from '@/lib/engine/trace'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * Ambiguity, stated plainly — PRD §8: *"Kata ini punya dua kemungkinan kata
 * dasar. Algoritma memilih salah satu."*
 *
 * Red is used here, and it is the only place other than the final root that
 * may use it: red means "the answer, or the fact that there isn't one"
 * (invariant 14).
 */
export function AmbiguityNote({
  ambiguity,
  copy,
  locale,
}: {
  ambiguity: Ambiguity
  copy: Copy
  locale: Locale
}) {
  return (
    <section className="border-l-2 border-teacher pl-4">
      <h2 className="font-ui text-sm text-teacher">{copy.ambiguous}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed">{copy.ambiguousLead}</p>

      <ul className="mt-3 space-y-1">
        {ambiguity.alternatives.map((candidate) => (
          <li key={candidate.kata} className="font-word text-sm">
            <span className={candidate.kata === ambiguity.chosen ? 'text-teacher' : 'text-pen'}>
              {candidate.kata}
            </span>
            {candidate.kata === ambiguity.chosen && (
              <span className="ml-2 font-ui text-xs text-pencil">
                {locale === 'en' ? 'chosen' : 'dipilih'}
              </span>
            )}
            {candidate.jalur.length > 0 && (
              <span className="ml-2 font-ui text-xs text-pencil">
                {candidate.jalur.join(' → ')}
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-3 max-w-2xl font-ui text-xs leading-relaxed text-pencil">
        {ambiguity.reason}
      </p>

      <p className="mt-2 font-ui text-xs">
        <Link className="underline decoration-ruleLine" href={`/${locale}/kandidat/`}>
          {locale === 'en' ? 'See the full candidate tree' : 'Lihat pohon kandidat lengkap'}
        </Link>
      </p>
    </section>
  )
}
