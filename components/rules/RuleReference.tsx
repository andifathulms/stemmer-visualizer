import type { Rule, RulePack } from '@/lib/rules/schema'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * The rule reference — PRD §5.4. Every rule, numbered, with its pattern, its
 * source and a working example. Clicking a rule id in a trace lands here.
 *
 * This makes the app usable as a reference by people implementing stemmers,
 * which is a real audience — and it is the view that makes invariant 1 pay
 * off, since everything on this page is read straight out of the rule data.
 *
 * A server component: nothing here needs the browser.
 */

const GROUPS: ReadonlyArray<{ type: Rule['type']; id: string; en: string }> = [
  { type: 'partikel', id: 'Partikel', en: 'Particles' },
  { type: 'milik', id: 'Kata ganti milik', en: 'Possessives' },
  { type: 'akhiran', id: 'Akhiran derivasional', en: 'Derivational suffixes' },
  { type: 'awalan', id: 'Awalan derivasional', en: 'Derivational prefixes' },
]

function RuleCard({ rule, copy, locale }: { rule: Rule; copy: Copy; locale: Locale }) {
  return (
    <article id={rule.id} className="baris scroll-mt-24 py-4">
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="font-word text-sm text-pen">{rule.id}</h3>
        <span className="font-ui text-xs text-pencil">
          {locale === 'en' ? 'precedence' : 'urutan'} {rule.precedence}
        </span>
        {rule.type === 'awalan' && rule.peluruhan && (
          <span className="rounded-sm bg-highlight/40 px-1 font-ui text-xs">peluruhan</span>
        )}
        {rule.verification === 'unverified' && (
          <span
            className="font-ui text-xs text-pencil"
            title={copy.unverifiedRule}
          >
            ⚠ {locale === 'en' ? 'unverified' : 'belum diperiksa'}
          </span>
        )}
      </header>

      <p className="mt-1 max-w-2xl text-sm leading-relaxed">{rule.keterangan}</p>

      <dl className="mt-2 grid gap-x-4 gap-y-1 font-ui text-xs sm:grid-cols-[7rem_1fr]">
        <dt className="text-pencil">{locale === 'en' ? 'pattern' : 'pola'}</dt>
        <dd className="font-word">{rule.match}</dd>

        <dt className="text-pencil">{locale === 'en' ? 'readings' : 'bacaan'}</dt>
        <dd className="font-word">{rule.produces.join('  |  ')}</dd>

        <dt className="text-pencil">{locale === 'en' ? 'example' : 'contoh'}</dt>
        <dd className="font-word">
          {rule.examples.map((example) => (
            <span key={`${example.input}-${example.output}`} className="mr-4">
              {example.input} → {example.output}
              {example.note && (
                <span className="ml-1 font-ui text-pencil">({example.note})</span>
              )}
            </span>
          ))}
        </dd>

        <dt className="text-pencil">{locale === 'en' ? 'source' : 'sumber'}</dt>
        <dd>
          {rule.citation.source} — {rule.citation.locus}
          {rule.citation.quote && <span className="block text-pencil">“{rule.citation.quote}”</span>}
        </dd>
      </dl>
    </article>
  )
}

export function RuleReference({
  pack,
  copy,
  locale,
}: {
  pack: RulePack
  copy: Copy
  locale: Locale
}) {
  const unverified = pack.rules.filter((rule) => rule.verification === 'unverified').length

  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-word text-2xl">{copy.nav.aturan}</h1>
        <p className="text-sm leading-relaxed">
          {locale === 'en' ? pack.description : pack.deskripsi}
        </p>
        {unverified > 0 && (
          <p className="border-l-2 border-ruleLine pl-3 font-ui text-xs leading-relaxed text-pencil">
            {locale === 'en'
              ? `${unverified} of ${pack.rules.length} rules have not been checked against the source paper. Their citation says where to look, not that anybody has looked. Do not cite them as sourced.`
              : `${unverified} dari ${pack.rules.length} aturan belum diperiksa terhadap makalah sumber. Sitasinya menunjukkan tempat memeriksa, bukan bahwa sudah ada yang memeriksa. Jangan dikutip sebagai bersumber.`}
          </p>
        )}
      </header>

      {GROUPS.map((group) => {
        const rules = pack.rules
          .filter((rule) => rule.type === group.type)
          .sort((a, b) => a.precedence - b.precedence)
        if (rules.length === 0) return null
        return (
          <section key={group.type}>
            <h2 className="border-b border-pen pb-1 font-ui text-sm">
              {locale === 'en' ? group.en : group.id}
            </h2>
            {rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} copy={copy} locale={locale} />
            ))}
          </section>
        )
      })}

      <section>
        <h2 className="border-b border-pen pb-1 font-ui text-sm">
          {locale === 'en'
            ? 'Forbidden prefix–suffix combinations'
            : 'Kombinasi awalan–akhiran yang tidak diizinkan'}
        </h2>
        <ul>
          {pack.forbidden.map((entry) => (
            <li key={entry.jenis} className="baris flex flex-wrap gap-x-3 py-2 font-ui text-xs">
              <span className="font-word text-sm text-pen">
                {entry.jenis}- … {entry.akhiran.join(', ')}
              </span>
              <span>{entry.keterangan}</span>
              <span className="text-pencil">
                {entry.citation.source} — {entry.citation.locus}
              </span>
              {entry.verification === 'unverified' && (
                <span className="text-pencil">⚠ {locale === 'en' ? 'unverified' : 'belum diperiksa'}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-2xl font-ui text-xs leading-relaxed text-pencil">
        <h2 className="font-ui text-sm text-pen">
          {locale === 'en' ? 'Sources' : 'Sumber'}
        </h2>
        <ul className="mt-2 space-y-1">
          {Object.entries(pack.sources).map(([key, source]) => (
            <li key={key}>
              <span className="font-word">{key}</span> — {source.authors} ({source.year}).{' '}
              <cite>{source.title}</cite>. {source.venue}.
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
