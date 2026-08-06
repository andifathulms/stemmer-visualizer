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

/** Rows per page. Three columns on a wide screen, so a multiple of six. Enough that
 *  browsing is viable, few enough that the DOM stays cheap: ~100 pages over the
 *  shipped dictionary, and search is the real way in. */
const PER_PAGE = 300

export function DictionaryPanel({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { dictionary, baseDictionary, state, addWord, removeWord, resetDictionary, trace } =
    useKupas()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(0)

  /**
   * Sorting is separated from filtering on purpose.
   *
   * `dictionary.words()` sorts with `localeCompare`, and the shipped
   * dictionary is now ~30,000 entries — doing that inside the same memo as the
   * query meant re-sorting the whole list on every keystroke in the search box.
   * Fine at 293 words, which is what this was written against.
   */
  const semua = useMemo(() => dictionary.words(), [dictionary])

  const words = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q === '' ? semua : semua.filter((word) => word.includes(q))
  }, [semua, query])

  /**
   * And the list is paged, for the same reason: 30,000 list items is 30,000
   * DOM nodes, which is what made this page take seconds to open and scroll
   * forever. The dictionary is meant to be inspected and edited, not read end
   * to end — search is the way in, and the page count says how much is behind
   * it rather than pretending the visible slice is all of it.
   */
  const totalPages = Math.max(1, Math.ceil(words.length / PER_PAGE))
  const current = Math.min(page, totalPages - 1)
  const start = current * PER_PAGE
  const visible = words.slice(start, start + PER_PAGE)

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
        <h1>{copy.nav.kamus}</h1>
        <p className="mt-3 max-w-baca leading-relaxed">
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
          className="h-10 flex-1 basis-48 rounded-sm border border-ruleLine bg-paper px-3 font-word text-sm outline-none focus:border-pen"
          placeholder={locale === 'en' ? 'search…' : 'cari…'}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
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
            className="h-10 rounded-sm border border-ruleLine bg-paper px-3 font-word text-sm outline-none focus:border-pen"
            placeholder={locale === 'en' ? 'add a root…' : 'tambah kata dasar…'}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="tombol h-10" aria-label={locale === 'en' ? 'Add root' : 'Tambah kata dasar'}>
            {locale === 'en' ? 'Add' : 'Tambah'}
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
        <p className="flex flex-wrap items-baseline justify-between gap-2 pb-2 font-ui text-xs text-pencil">
          <span>
            {words.length === 0
              ? '—'
              : `${(start + 1).toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB')}–${Math.min(
                  start + PER_PAGE,
                  words.length,
                ).toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB')} ${
                  locale === 'en' ? 'of' : 'dari'
                } ${words.length.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB')}`}
            {query.trim() !== '' && (locale === 'en' ? ' matching' : ' yang cocok')}
          </span>
          {totalPages > 1 && (
            <span>
              {locale === 'en' ? 'Page' : 'Halaman'}{' '}
              <span className="font-word tabular-nums text-pen">
                {current + 1}/{totalPages}
              </span>
            </span>
          )}
        </p>

        <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((kata) => {
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

        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-2 border-t border-ruleLine pt-4 font-ui text-xs"
            aria-label={locale === 'en' ? 'Dictionary pages' : 'Halaman kamus'}
          >
            <button
              className="tombol px-2 py-1"
              onClick={() => setPage(0)}
              disabled={current === 0}
              aria-label={locale === 'en' ? 'First page' : 'Halaman pertama'}
            >
              ⏮
            </button>
            <button
              className="tombol px-2 py-1"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label={locale === 'en' ? 'Previous page' : 'Halaman sebelumnya'}
            >
              ←
            </button>
            <span className="w-20 text-center font-word tabular-nums text-pencil">
              {current + 1}/{totalPages}
            </span>
            <button
              className="tombol px-2 py-1"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages - 1}
              aria-label={locale === 'en' ? 'Next page' : 'Halaman berikutnya'}
            >
              →
            </button>
            <button
              className="tombol px-2 py-1"
              onClick={() => setPage(totalPages - 1)}
              disabled={current >= totalPages - 1}
              aria-label={locale === 'en' ? 'Last page' : 'Halaman terakhir'}
            >
              ⏭
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}
