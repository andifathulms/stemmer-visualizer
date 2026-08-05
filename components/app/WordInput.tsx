'use client'

import { useEffect, useState } from 'react'
import { useKupas } from './KupasProvider'
import type { Copy } from '@/lib/i18n'

const CONTOH = ['menyapu', 'beruang', 'mengupas', 'perusakan', 'mempelajari', 'terpercaya']

export function WordInput({ copy }: { copy: Copy }) {
  const { state, setKata, pack, packs, setVarian, dictionary, baseDictionary } = useKupas()
  const [draft, setDraft] = useState(state.kata)

  useEffect(() => setDraft(state.kata), [state.kata])

  const edited = dictionary.size !== baseDictionary.size

  return (
    <div className="space-y-3">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          setKata(draft.trim())
        }}
      >
        <label className="flex-1 basis-56">
          <span className="block font-ui text-xs text-pencil">{copy.wordLabel}</span>
          <input
            className="mt-1 w-full border-b border-ruleLine bg-transparent py-1 font-word text-xl outline-none focus:border-pen"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        <label>
          <span className="block font-ui text-xs text-pencil">{copy.variantLabel}</span>
          <select
            className="mt-1 border-b border-ruleLine bg-transparent py-1 font-ui text-sm outline-none"
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

        <button className="border border-pen px-3 py-1 font-ui text-sm hover:bg-highlight/20">
          {copy.wordLabel} →
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-xs text-pencil">
        {CONTOH.map((word) => (
          <button
            key={word}
            className="font-word underline decoration-ruleLine hover:text-pen"
            onClick={() => setKata(word)}
          >
            {word}
          </button>
        ))}
        <span className="ml-auto">
          {dictionary.size} kata di kamus{edited ? ' (disunting)' : ''}
        </span>
      </div>
    </div>
  )
}
