'use client'

import { useKupas } from '@/components/app/KupasProvider'
import type { Kegagalan } from '@/lib/app/kegagalan'
import type { Copy } from '@/lib/i18n'

/**
 * The most common thing this app has to say, said properly.
 *
 * A word that comes back unstemmed used to produce one grey line — "not in the
 * dictionary, the word is returned unchanged" — which reads as the algorithm
 * failing. Usually it did the hard part correctly and was let down by a
 * 293-word list: `menendang` gets as far as `tendang`, having restored the
 * letter that assimilation destroyed, and throws it away.
 *
 * Adding the word is one click, and the whole trace re-runs against the new
 * dictionary. That is PRD §2's central claim made testable rather than
 * asserted — so this is deliberately the loudest non-red thing on the page.
 *
 * Not red: a missing dictionary entry is not the answer and not genuine
 * ambiguity, and invariant 14 reserves red for those two.
 */
export function KegagalanNote({ kegagalan, copy }: { kegagalan: Kegagalan; copy: Copy }) {
  const { addWord, dictionary } = useKupas()

  return (
    <section className="kartu border-l-2 border-l-highlight bg-paperEdge/50 px-5 py-4">
      <h2 className="font-prose text-base font-semibold">{copy.kegagalan.title}</h2>

      {kegagalan.terakhir !== null && (
        <p className="mt-2 max-w-baca leading-relaxed">
          {copy.kegagalan.lead.split('{kata}').map((chunk, index, all) => (
            <span key={index}>
              {chunk}
              {index < all.length - 1 && (
                <span className="font-word text-pen">{kegagalan.terakhir}</span>
              )}
            </span>
          ))}
        </p>
      )}

      <p className="label mt-4">{copy.kegagalan.triedLabel}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {kegagalan.dicoba.map((kata) => {
          const sudah = dictionary.has(kata)
          return (
            <li key={kata}>
              <button
                className="contoh disabled:cursor-default disabled:opacity-60"
                onClick={() => addWord(kata)}
                disabled={sudah}
              >
                <span>{kata}</span>
                <span className="ml-2 font-ui text-xs font-normal text-pencil">
                  {sudah ? `✓ ${copy.kegagalan.added}` : `+ ${copy.kegagalan.add}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 max-w-baca font-ui text-xs leading-relaxed text-pencil">
        {copy.kegagalan.note}
      </p>
    </section>
  )
}
