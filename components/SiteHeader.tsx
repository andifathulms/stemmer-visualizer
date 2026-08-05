'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Copy, Locale, SectionKey } from '@/lib/i18n'
import { LOCALES } from '@/lib/i18n'

/**
 * Site chrome.
 *
 * Two changes here are about comprehension rather than decoration:
 *
 * - The wordmark carries a one-line descriptor. "kupas" alone tells a
 *   first-time visitor nothing, and six Indonesian nouns underneath it tell
 *   them less.
 * - The nav is split into the two things worth doing first and the four worth
 *   doing afterwards. A flat list of six implies six equally good starting
 *   points; there is really only one.
 *
 * The current section is marked with a rule beneath it in pen — the same
 * gesture as underlining a heading in an exercise book — and with
 * `aria-current`, so it never rests on colour alone.
 */
/**
 * `next/image` does not prefix `basePath` when `images.unoptimized` is set —
 * it emits the src verbatim — so the mark 404s on Pages unless the prefix is
 * written in. The icon and manifest links in app/layout.tsx get theirs from
 * the file conventions; this one has to ask.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const MULAI: readonly SectionKey[] = ['kupas', 'kandidat']
const DALAM: readonly SectionKey[] = ['kamus', 'aturan', 'galeri', 'dokumen']

export function SiteHeader({ locale, copy }: { locale: Locale; copy: Copy }) {
  const pathname = usePathname()

  const isCurrent = (section: SectionKey) => pathname?.startsWith(`/${locale}/${section}`) ?? false

  const link = (section: SectionKey) => (
    <Link
      key={section}
      href={`/${locale}/${section}/`}
      aria-current={isCurrent(section) ? 'page' : undefined}
      title={copy.navHint[section]}
      className={`-mb-px shrink-0 border-b-2 py-1.5 transition-colors ${
        isCurrent(section)
          ? 'border-pen font-medium text-pen'
          : 'border-transparent text-pencil hover:border-ruleLine hover:text-pen'
      }`}
    >
      {copy.nav[section]}
    </Link>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-ruleLine bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl px-5 pt-4 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/${locale}/`} className="flex items-center gap-2.5">
            {/* The mark is the product in miniature: affixes peeled off in
                grey, the root left standing in red. At this size the brand
                rules call for the simplified two-block form — below 40px the
                four-block mark closes up — so this is the same file the
                browser tab uses. Decorative: the wordmark beside it already
                names the site. */}
            <Image
              src={`${basePath}/brand/mark.svg`}
              alt=""
              aria-hidden
              width={26}
              height={26}
              priority
              className="h-[26px] w-[26px] shrink-0 rounded-[6px]"
            />
            <span className="block">
              {/* Serif, per the brand rules — the wordmark matches the page
                  headline. The mono face stays reserved for words under
                  analysis, which is the distinction worth protecting. */}
              <span className="block font-prose text-lg font-semibold leading-tight tracking-tight text-pen sm:text-xl">
                {copy.brandName}
              </span>
              <span className="mt-0.5 hidden max-w-sm font-ui text-xs leading-snug text-pencil sm:block">
                {copy.brandTagline}
              </span>
            </span>
          </Link>

          {/* Locale as a segmented control rather than two loose links: it
              switches between two states, so it should look like a switch. */}
          <nav
            aria-label="Bahasa / Language"
            className="flex shrink-0 overflow-hidden rounded-sm border border-ruleLine"
          >
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={`/${l}/`}
                aria-current={l === locale ? 'true' : undefined}
                className={`px-2.5 py-1 font-ui text-xs transition-colors ${
                  l === locale ? 'bg-pen text-paper' : 'text-pencil hover:bg-highlight/20'
                }`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>

        <nav
          aria-label={copy.brandTagline}
          className="mt-3 flex items-center gap-x-5 overflow-x-auto font-ui text-sm"
        >
          {MULAI.map(link)}
          <span aria-hidden className="h-4 w-px shrink-0 bg-ruleLine" />
          {DALAM.map(link)}
        </nav>
      </div>
    </header>
  )
}
