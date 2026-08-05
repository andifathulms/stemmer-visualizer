'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useKupas } from '@/components/app/KupasProvider'
import { interpret } from '@/lib/engine/interpret'
import { enumerate } from '@/lib/engine/enumerate'
import { encodeState } from '@/lib/app/state'
import type { Copy, Locale } from '@/lib/i18n'
import galeri from '@/data/galeri.json'

/**
 * The failure gallery — PRD §5.6, and shipped as a first-class feature rather
 * than an appendix. A tool that only demonstrates the algorithm succeeding
 * teaches false confidence in it.
 *
 * Every entry is recomputed live against the *shipped* dictionary, not the
 * user's edited one, so the gallery is stable and so an entry that has quietly
 * started passing shows up as such instead of sitting there as a stale claim.
 */

const JENIS: Record<string, { id: string; en: string }> = {
  ambigu: { id: 'ambiguitas asli', en: 'genuine ambiguity' },
  'kelebihan-kupas': { id: 'kelebihan kupas', en: 'over-stemming' },
  'kekurangan-kupas': { id: 'kekurangan kupas', en: 'under-stemming' },
  'salah-analisis': { id: 'salah analisis', en: 'wrong analysis' },
}

export function FailureGallery({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { pack, baseDictionary } = useKupas()

  const rows = useMemo(
    () =>
      galeri.entries.map((entry) => {
        const trace = interpret({ word: entry.kata, pack, dictionary: baseDictionary })
        const tree = enumerate({ word: entry.kata, pack, dictionary: baseDictionary })
        return { entry, trace, candidates: tree.candidates.map((c) => c.kata) }
      }),
    [pack, baseDictionary],
  )

  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-word text-2xl">{copy.nav.galeri}</h1>
        <p className="text-sm leading-relaxed">
          {locale === 'en' ? galeri.note : galeri.catatan}
        </p>
      </header>

      <ul className="space-y-6">
        {rows.map(({ entry, trace, candidates }) => {
          // For an ambiguous word the returned string is not the failure — the
          // silence about the alternatives is. Judging it by string equality
          // would file the most interesting case as a pass.
          const ambiguous = entry.jenis === 'ambigu'
          const stillFails = ambiguous ? candidates.length > 1 : trace.result !== entry.seharusnya
          const jenis = JENIS[entry.jenis]

          return (
            <li key={entry.kata} className="baris pb-5">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <Link
                  className="font-word text-lg underline decoration-ruleLine hover:text-pen"
                  href={`/${locale}/kupas/${encodeState({
                    kata: entry.kata,
                    varian: pack.id,
                    tambah: [],
                    hapus: [],
                  })}`}
                >
                  {entry.kata}
                </Link>
                <span className="font-ui text-xs uppercase tracking-wide text-pencil">
                  {locale === 'en' ? jenis?.en : jenis?.id}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-6 font-word text-sm">
                <span>
                  <span className="font-ui text-xs text-pencil">
                    {locale === 'en' ? 'returns' : 'menghasilkan'}{' '}
                  </span>
                  <span className={ambiguous ? 'text-pen' : 'text-teacher'}>{trace.result}</span>
                </span>
                <span>
                  <span className="font-ui text-xs text-pencil">
                    {locale === 'en' ? 'should be' : 'seharusnya'}{' '}
                  </span>
                  {entry.seharusnya}
                </span>
                {candidates.length > 1 && (
                  <span>
                    <span className="font-ui text-xs text-pencil">
                      {locale === 'en' ? 'valid readings' : 'bacaan sah'}{' '}
                    </span>
                    {candidates.join(', ')}
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed">
                {locale === 'en' ? entry.keteranganEn : entry.keteranganId}
              </p>

              {!stillFails && (
                <p className="mt-2 font-ui text-xs text-pencil">
                  {locale === 'en'
                    ? 'This entry no longer fails. Re-check it and either reclassify it or take it out.'
                    : 'Entri ini sudah tidak gagal lagi. Periksa ulang, lalu ubah klasifikasinya atau keluarkan.'}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
