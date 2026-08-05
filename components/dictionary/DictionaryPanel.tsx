'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useKupas } from '@/components/app/KupasProvider'
import { isLookup } from '@/lib/engine/trace'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * The dictionary panel — PRD §5.3. Searchable, editable, and visibly the input
 * it is.
 *
 * Add a word and re-run; remove a word and watch a previously-correct stem
 * fail. Nothing teaches the dictionary dependency faster than breaking it on
 * purpose, so removal is a first-class action here rather than a hidden one.
 */
export function DictionaryPanel({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { dictionary, baseDictionary, state, addWord, removeWord, resetDictionary, trace } =
    useKupas()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')

  const words = useMemo(() => {
    const all = dictionary.words()
    const q = query.trim().toLowerCase()
    return q === '' ? all : all.filter((word) => word.includes(q))
  }, [dictionary, query])

  /** Every step of the current trace where this word was looked up. */
  const lookups = useMemo(
    () => trace.steps.filter(isLookup).map((step) => ({ kata: step.kata, found: step.found })),
    [trace],
  )
  const consulted = new Map(lookups.map((l) => [l.kata, l.found]))

  const edited = state.tambah.length > 0 || state.hapus.length > 0

  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-word text-2xl">{copy.nav.kamus}</h1>
        <p className="text-sm leading-relaxed">
          {locale === 'en' ? dictionary.coverage : dictionary.cakupan}
        </p>
        <p className="font-ui text-xs text-pencil">
          {dictionary.size}{' '}
          {locale === 'en' ? 'roots' : 'kata dasar'} · {baseDictionary.size}{' '}
          {locale === 'en' ? 'shipped' : 'bawaan'}
          {edited && (
            <>
              {' '}
              · +{state.tambah.length} / −{state.hapus.length}{' '}
              <button className="underline decoration-ruleLine" onClick={resetDictionary}>
                {locale === 'en' ? 'reset' : 'kembalikan'}
              </button>
            </>
          )}
        </p>
      </header>

      <section className="flex flex-wrap gap-3">
        <input
          className="flex-1 basis-48 border-b border-ruleLine bg-transparent py-1 font-word outline-none focus:border-pen"
          placeholder={locale === 'en' ? 'search…' : 'cari…'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.trim() === '') return
            addWord(draft)
            setDraft('')
          }}
        >
          <input
            className="border-b border-ruleLine bg-transparent py-1 font-word outline-none focus:border-pen"
            placeholder={locale === 'en' ? 'add a root…' : 'tambah kata dasar…'}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="border border-pen px-3 py-1 font-ui text-sm hover:bg-highlight/20">
            +
          </button>
        </form>
      </section>

      <section className="border-t border-ruleLine">
        <p className="py-2 font-ui text-xs text-pencil">
          {locale === 'en'
            ? 'Highlighted rows were consulted while stemming'
            : 'Baris bertanda dikonsultasikan saat mengupas'}{' '}
          <Link className="font-word underline decoration-ruleLine" href={`/${locale}/kupas/`}>
            {trace.kata}
          </Link>
          .
        </p>
        <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {words.map((kata) => {
            const hit = consulted.get(kata)
            return (
              <li
                key={kata}
                className={`baris flex items-baseline justify-between gap-2 py-1.5 ${
                  hit === undefined ? '' : 'bg-highlight/20'
                }`}
              >
                <span className="font-word text-sm">{kata}</span>
                <span className="flex items-baseline gap-2 font-ui text-xs text-pencil">
                  <span title={locale === 'en' ? 'provenance' : 'asal entri'}>
                    {dictionary.sumber(kata)}
                  </span>
                  <button
                    className="underline decoration-ruleLine hover:text-teacher"
                    onClick={() => removeWord(kata)}
                    title={
                      locale === 'en'
                        ? 'remove and see what breaks'
                        : 'hapus dan lihat apa yang rusak'
                    }
                  >
                    −
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
        {words.length === 0 && (
          <p className="py-6 font-ui text-sm text-pencil">
            {locale === 'en' ? 'No entry matches.' : 'Tidak ada entri yang cocok.'}
          </p>
        )}
      </section>
    </div>
  )
}
