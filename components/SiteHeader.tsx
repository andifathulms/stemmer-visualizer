import Link from 'next/link'
import type { Copy, Locale } from '@/lib/i18n'
import { LOCALES } from '@/lib/i18n'

const SECTIONS = ['kupas', 'kandidat', 'kamus', 'aturan', 'galeri', 'dokumen'] as const

export function SiteHeader({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <header className="border-b border-ruleLine bg-paper">
      <div className="mx-auto w-full max-w-5xl px-5 pb-3 pt-6 sm:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <Link href={`/${locale}/`} className="font-word text-2xl tracking-tight text-pen">
            kupas
          </Link>
          <nav className="flex gap-3 font-ui text-xs">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={`/${l}/`}
                className={l === locale ? 'text-pen underline decoration-ruleLine' : 'text-pencil'}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-ui text-sm text-pencil">
          {SECTIONS.map((section) => (
            <Link
              key={section}
              href={`/${locale}/${section}/`}
              className="hover:text-pen hover:underline hover:decoration-ruleLine"
            >
              {copy.nav[section]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
