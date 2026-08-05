'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useKupas } from './KupasProvider'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * The one control the whole app turns on.
 *
 * Three things changed here, all of them about a first-time visitor:
 *
 * - The examples carry the reason they are worth trying. A bare row of six
 *   Indonesian words is only useful to someone who already knows which of them
 *   is interesting — which is precisely the person who does not need it.
 * - The variant select is hidden while only one rule pack exists. A dropdown
 *   with a single option reads as a broken control, and M5 has not shipped the
 *   2005 pack.
 * - The dictionary count links to the dictionary. It is the app's central
 *   claim — the answer depends on this list — and it used to be dead text
 *   hardcoded in Indonesian regardless of locale.
 */
export function WordInput({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { state, setKata, pack, packs, setVarian, dictionary, baseDictionary, dictionaryLoading } =
    useKupas()
  const [draft, setDraft] = useState(state.kata)

  useEffect(() => setDraft(state.kata), [state.kata])

  const edited = dictionary.size !== baseDictionary.size

  /**
   * Whether pressing the button would change anything.
   *
   * Submitting the word that is already being analysed recomputes an identical
   * trace and an identical tree, so the page does not move — the control reads
   * as broken when it is merely idle. Saying so up front is the fix; the
   * alternative is a button whose only feedback is the absence of feedback.
   */
  const kata = draft.trim()
  const bisaKupas = kata !== '' && kata !== state.kata

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (bisaKupas) setKata(kata)
        }}
      >
        <label className="flex-1 basis-64">
          <span className="label block">{copy.wordLabel}</span>
          <input
            className="mt-1.5 w-full rounded-sm border border-ruleLine bg-paper px-3 py-2 font-word text-2xl text-pen outline-none transition-colors placeholder:text-pencilMark/70 focus:border-pen"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={copy.wordPlaceholder}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
          />
        </label>

        {packs.length > 1 && (
          <label>
            <span className="label block">{copy.variantLabel}</span>
            <select
              className="mt-1.5 rounded-sm border border-ruleLine bg-paper px-2 py-2.5 font-ui text-sm outline-none focus:border-pen"
              value={pack.id}
              onChange={(event) => setVarian(event.target.value)}
            >
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* No arrow: it read as navigation, and next to a nav item of the same
            name on the Kandidat page it looked like a link to the trace. */}
        <button className="tombol-utama py-2.5" disabled={!bisaKupas}>
          {copy.wordSubmit}
        </button>
      </form>

      <div>
        <span className="label">{copy.examplesLabel}</span>
        <ul className="mt-2 flex flex-wrap gap-2">
          {copy.examples.map((example) => (
            <li key={example.kata}>
              <button
                className="contoh"
                onClick={() => setKata(example.kata)}
                aria-current={example.kata === state.kata ? 'true' : undefined}
              >
                <span>{example.kata}</span>
                <span className="ml-2 font-ui text-xs font-normal text-pencil">
                  {example.alasan}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="font-ui text-xs text-pencil">
        <Link
          href={`/${locale}/kamus/`}
          className="underline decoration-ruleLine underline-offset-4 hover:text-pen"
        >
          {copy.dictionaryCount.replace(
            '{n}',
            dictionary.size.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB'),
          )}
        </Link>
        {dictionaryLoading && (
          // The count is about to change on its own — say so rather than
          // letting it triple silently. See KupasProvider.
          <span className="ml-2 text-pencil">· {copy.dictionaryLoading}</span>
        )}
        {edited && (
          <span className="ml-2 rounded-sm bg-highlight/40 px-1.5 py-0.5 text-pen">
            {copy.dictionaryEdited}
          </span>
        )}
      </p>
    </div>
  )
}
