'use client'

import { useMemo } from 'react'
import { useKupas } from '@/components/app/KupasProvider'
import { interpret } from '@/lib/engine/interpret'
import { EMPTY_DICTIONARY } from '@/lib/dictionary'
import { isRemoval } from '@/lib/engine/trace'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * Variant comparison — PRD §5.5, partially.
 *
 * The dictionary-free column is the instructive one: it shows exactly what the
 * dictionary is buying, on this word, right now. It needs no new rules, so it
 * ships.
 *
 * The 1996-versus-2005 column does not ship, and the note below says so rather
 * than leaving an empty affordance. The 2005 extensions are a different rule
 * pack — reduplicated compounds, the -pun particle, revised me- handling, a
 * changed step order — and writing them from memory would be exactly the
 * reconstruction CLAUDE.md forbids.
 */
export function Comparison({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { pack, dictionary, state } = useKupas()

  const withDictionary = useMemo(
    () => interpret({ word: state.kata, pack, dictionary }),
    [state.kata, pack, dictionary],
  )
  const without = useMemo(
    () => interpret({ word: state.kata, pack, dictionary: EMPTY_DICTIONARY }),
    [state.kata, pack],
  )

  const attempted = without.steps.filter(isRemoval).length

  return (
    <section className="space-y-2">
      <h2 className="font-ui text-sm text-pencil">
        {locale === 'en' ? 'What the dictionary buys' : 'Apa yang dibeli oleh kamus'}
      </h2>

      <div className="grid gap-px border border-ruleLine bg-ruleLine sm:grid-cols-2">
        <div className="bg-paper p-3">
          <p className="font-ui text-xs text-pencil">
            {dictionary.size} {locale === 'en' ? 'roots' : 'kata dasar'}
          </p>
          <p className="mt-1 font-word text-lg">
            <span className={withDictionary.found ? 'text-teacher' : 'text-pen'}>
              {withDictionary.result}
            </span>
          </p>
        </div>

        <div className="bg-paper p-3">
          <p className="font-ui text-xs text-pencil">
            {locale === 'en' ? 'no dictionary at all' : 'tanpa kamus sama sekali'}
          </p>
          <p className="mt-1 font-word text-lg text-pen">{without.result}</p>
          <p className="mt-1 font-ui text-xs text-pencil">
            {locale === 'en'
              ? `${attempted} removals attempted, every one undone: with nothing to check against, the algorithm can never accept a result.`
              : `${attempted} pembuangan dicoba dan semuanya dibatalkan: tanpa kamus, algoritma tidak pernah bisa menerima satu pun hasil.`}
          </p>
        </div>
      </div>

      <p className="max-w-2xl font-ui text-xs leading-relaxed text-pencil">
        {locale === 'en'
          ? 'The 1996-versus-2005 comparison is not built. The 2005 extensions are a separate rule pack, and writing one from memory rather than from the paper would make the comparison meaningless.'
          : 'Perbandingan 1996 lawan 2005 belum ada. Perluasan 2005 adalah paket aturan tersendiri, dan menyusunnya dari ingatan alih-alih dari makalah akan membuat perbandingannya tidak berarti.'}
      </p>
      <span className="sr-only">{copy.variantLabel}</span>
    </section>
  )
}
