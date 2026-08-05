import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

const SECTIONS = ['kupas', 'kandidat', 'kamus', 'aturan', 'galeri', 'dokumen'] as const

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const copy = getCopy(params.locale)

  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <h1 className="font-word text-4xl tracking-tight">kupas</h1>
        <p className="mt-4 text-lg leading-relaxed">{copy.tagline}</p>
      </section>

      <section className="grid gap-px border border-ruleLine bg-ruleLine sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section}
            href={`/${params.locale}/${section}/`}
            className="group bg-paper p-5 transition-colors hover:bg-highlight/10"
          >
            <span className="font-ui text-sm text-pen group-hover:underline group-hover:decoration-ruleLine">
              {copy.nav[section]}
            </span>
            <p className="mt-1 font-ui text-xs text-pencil">{copy.navHint[section]}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
