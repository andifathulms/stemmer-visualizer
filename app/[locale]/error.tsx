'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { DEFAULT_LOCALE, getCopy, isLocale } from '@/lib/i18n'
import { DEFAULT_STATE, encodeState } from '@/lib/app/state'

/**
 * A route-level error boundary — DESIGN-REWORK.md §6: there was none, and a
 * render-time throw fell through to Next's default, unstyled error page.
 *
 * This does not depend on `useKupas()`. If the throw happened inside
 * `KupasProvider` itself (its `trace`/`tree` are computed with `useMemo` in
 * its own render, above this boundary in the tree), that context is gone —
 * reaching for it here would just be a second crash inside the recovery UI.
 * So recovery is self-contained: a full navigation to a known-good word,
 * which remounts everything from scratch. State lives in the URL hash, so
 * nothing is lost by doing that (PRD §4) — the current, broken hash is
 * simply not the one being navigated to.
 *
 * This is a route-level boundary, not a global one: it catches a throw in a
 * page or a view component under `/[locale]`, not one in `[locale]/layout.tsx`
 * itself (the header, the footer, `KupasProvider`'s own render) — Next's
 * file-based error boundaries wrap a segment's children, not the segment's
 * own layout. That gap is real and not something this file can close.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const segment = pathname.split('/')[1] ?? ''
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE
  const copy = getCopy(locale)

  useEffect(() => {
    // Not swallowed — this project's whole posture is that a failure stays
    // visible rather than being quietly absorbed.
    console.error(error)
  }, [error])

  const goTo = (kata: string) => {
    window.location.assign(`${pathname}${encodeState({ ...DEFAULT_STATE, kata })}`)
  }

  return (
    <div className="kartu space-y-4 p-6">
      <h1>{locale === 'en' ? 'Something broke' : 'Ada yang rusak'}</h1>
      <p className="max-w-baca leading-relaxed">
        {locale === 'en'
          ? 'This page hit an error rendering the current word. It is a bug in the app, not a claim about your word — try again, or start from a word known to work.'
          : 'Halaman ini gagal merender kata yang sedang dibuka. Ini bug di aplikasinya, bukan sesuatu tentang kata Anda — coba lagi, atau mulai dari kata yang sudah diketahui berjalan.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="tombol-utama" onClick={() => reset()}>
          {locale === 'en' ? 'Try again' : 'Coba lagi'}
        </button>
        <button className="tombol" onClick={() => goTo(DEFAULT_STATE.kata)}>
          {locale === 'en' ? 'Start over' : 'Mulai dari awal'}
        </button>
      </div>
      <div>
        <p className="label">{copy.examplesLabel}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {copy.examples.map((example) => (
            <li key={example.kata}>
              <button className="contoh" onClick={() => goTo(example.kata)} title={example.alasan}>
                {example.kata}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
