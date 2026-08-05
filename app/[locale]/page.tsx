import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale, type SectionKey } from '@/lib/i18n'
import { Peragaan } from '@/components/home/Peragaan'
import { interpret } from '@/lib/engine/interpret'
import { parseRulePack } from '@/lib/rules/loader'
import { loadBaseDictionary } from '@/lib/dictionary/base'
import { segmentAt } from '@/lib/app/segmentation'
import na96 from '@/data/rules/na96.json'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

const MULAI: readonly SectionKey[] = ['kupas', 'kandidat']
const DALAM: readonly SectionKey[] = ['kamus', 'aturan', 'galeri', 'dokumen']

/**
 * The word the landing page peels. It has to earn the slot: `mempelajari`
 * carries an awalan, an akhiran and a peluruhan at once, and lands on a root a
 * reader will recognise instantly.
 */
const CONTOH_BERANDA = 'mempelajari'

function SectionGrid({
  keys,
  locale,
  copy,
}: {
  keys: readonly SectionKey[]
  locale: string
  copy: ReturnType<typeof getCopy>
}) {
  return (
    <div className="grid gap-px border border-ruleLine bg-ruleLine sm:grid-cols-2">
      {keys.map((section) => (
        <Link
          key={section}
          href={`/${locale}/${section}/`}
          className="group bg-paper p-5 transition-colors hover:bg-highlight/10"
        >
          <span className="font-prose text-base font-semibold text-pen underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ruleLine">
            {copy.nav[section]}
          </span>
          <p className="mt-1 font-ui text-xs leading-relaxed text-pencil">
            {copy.navHint[section]}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const copy = getCopy(params.locale)

  // The engine, at build time. Static export means this costs the visitor
  // nothing and ships as plain markup — and it guarantees the example on the
  // landing page is the same analysis the trace page will show.
  const pack = parseRulePack(na96)
  const trace = interpret({
    word: CONTOH_BERANDA,
    pack,
    dictionary: loadBaseDictionary(),
  })
  const segmentation = segmentAt(trace, trace.steps.length)

  return (
    <div className="space-y-14">
      <section className="pt-2">
        <p className="label">{copy.hero.eyebrow}</p>
        <h1 className="mt-3 max-w-baca text-balance">{copy.hero.title}</h1>
        <p className="mt-5 max-w-baca text-lg leading-relaxed">{copy.hero.lead}</p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href={`/${params.locale}/kupas/`} className="tombol-utama">
            {copy.hero.primary} →
          </Link>
          <a href="#kenapa" className="tombol">
            {copy.hero.secondary}
          </a>
        </div>
      </section>

      <Peragaan
        segmentation={segmentation}
        hasil={trace.result}
        langkah={trace.steps.length}
        copy={copy}
        locale={params.locale}
      />

      <section id="kenapa" className="scroll-mt-32">
        <h2>{copy.why.title}</h2>
        <ol className="mt-5 grid gap-px border border-ruleLine bg-ruleLine sm:grid-cols-3">
          {copy.why.points.map((point, index) => (
            <li key={point.title} className="bg-paper p-5">
              {/* Numbered because these are the three specific costs of the
                  opacity, not a generic feature list. */}
              <span aria-hidden className="font-word text-sm text-pencilMark">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2">{point.title}</h3>
              <p className="mt-2 font-ui text-xs leading-relaxed text-pencil">{point.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-prose text-base font-semibold">{copy.navGroup.mulai}</h2>
        <div className="mt-3">
          <SectionGrid keys={MULAI} locale={params.locale} copy={copy} />
        </div>

        <h2 className="mt-8 font-prose text-base font-semibold">{copy.navGroup.dalam}</h2>
        <div className="mt-3">
          <SectionGrid keys={DALAM} locale={params.locale} copy={copy} />
        </div>
      </section>
    </div>
  )
}
