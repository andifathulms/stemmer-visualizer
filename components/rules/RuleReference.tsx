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

function rulesOfGroup(pack: RulePack, type: Rule['type']): Rule[] {
  return pack.rules.filter((rule) => rule.type === type).sort((a, b) => a.precedence - b.precedence)
}

/**
 * The four rule-type groups, as ordered pipeline stages — DESIGN-REWORK.md
 * §3: invariant 1 exists so a linguist who doesn't code can audit the rule
 * set, and the first question that reader asks is what fires before what.
 * A "precedence 3" label on an individual card answers that only one rule
 * at a time; this answers it for the whole pack at a glance.
 */
function Pipeline({ pack, locale }: { pack: RulePack; locale: Locale }) {
  const stages = GROUPS.map((group) => ({ group, rules: rulesOfGroup(pack, group.type) })).filter(
    (stage) => stage.rules.length > 0,
  )

  return (
    <nav aria-label={locale === 'en' ? 'Rule pipeline' : 'Urutan tahap aturan'} className="overflow-x-auto">
      <ol className="flex items-stretch gap-2">
        {stages.map((stage, index) => (
          <li key={stage.group.type} className="flex items-stretch gap-2">
            <div className="min-w-[10rem] border border-ruleLine bg-paperEdge/50 p-3">
              <h3 className="font-ui text-xs font-semibold uppercase tracking-wide text-pencil">
                {index + 1}. {locale === 'en' ? stage.group.en : stage.group.id}
              </h3>
              <ul className="mt-2 space-y-0.5">
                {stage.rules.map((rule) => (
                  <li key={rule.id}>
                    <a
                      href={`#${rule.id}`}
                      className="font-word text-xs text-pen underline decoration-ruleLine hover:decoration-pen"
                    >
                      {rule.id.split('.').pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {index < stages.length - 1 && (
              <span aria-hidden="true" className="self-center font-ui text-pencil">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

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

/**
 * The forbidden prefix–suffix table — genuinely two-dimensional data
 * (`pack.forbidden` is keyed by prefix type, each with several forbidden
 * suffixes), rendered as an actual `<table>` instead of a `<ul>` of
 * sentences — DESIGN-REWORK.md §3. `.tabel-responsif` (globals.css) reflows
 * it to stacked rows on narrow viewports, each cell still labelled by its
 * column via `data-th`.
 */
function ForbiddenTable({ pack, locale }: { pack: RulePack; locale: Locale }) {
  if (pack.forbidden.length === 0) return null

  const akhiranColumns = [...new Set(pack.forbidden.flatMap((entry) => entry.akhiran))].sort()

  return (
    <section>
      <h2 className="border-b border-pen pb-1 font-ui text-sm">
        {locale === 'en'
          ? 'Forbidden prefix–suffix combinations'
          : 'Kombinasi awalan–akhiran yang tidak diizinkan'}
      </h2>
      <div className="mt-2 overflow-x-auto">
        <table className="tabel-responsif w-full border-collapse font-ui text-xs">
          <caption className="mb-2 text-left text-pencil">
            {locale === 'en'
              ? 'Consulted before removing a prefix — PRD §3 step 4. A match means the search stops rather than continues.'
              : 'Dicek sebelum membuang awalan — PRD §3 langkah 4. Kalau cocok, pencarian berhenti, bukan dilanjutkan.'}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-pen p-2 text-left font-ui font-normal text-pencil">
                {locale === 'en' ? 'prefix ↓ / suffix →' : 'awalan ↓ / akhiran →'}
              </th>
              {akhiranColumns.map((akhiran) => (
                <th key={akhiran} scope="col" className="border-b border-pen p-2 text-left font-word">
                  {akhiran}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pack.forbidden.map((entry) => (
              <tr key={entry.jenis}>
                <th scope="row" className="baris p-2 text-left font-word text-pen">
                  {entry.jenis}-
                </th>
                {akhiranColumns.map((akhiran) => {
                  const forbidden = entry.akhiran.includes(akhiran)
                  return (
                    <td key={akhiran} data-th={akhiran} className="baris p-2 align-top">
                      {forbidden ? (
                        <span>
                          {entry.keterangan}{' '}
                          <span className="text-pencil">
                            ({entry.citation.source} — {entry.citation.locus})
                          </span>
                          {entry.verification === 'unverified' && (
                            <span className="ml-1 text-pencil" title={locale === 'en' ? 'unverified' : 'belum diperiksa'}>
                              ⚠
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-pencil" aria-hidden="true">
                          —
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
        <h1>{copy.nav.aturan}</h1>
        <p className="mt-3 max-w-baca leading-relaxed">
          {locale === 'en' ? pack.description : pack.deskripsi}
        </p>
        {unverified > 0 && (
          <p className="border-l-2 border-ruleLine pl-3 font-ui text-xs leading-relaxed text-pencil">
            {locale === 'en'
              ? `${unverified} of ${pack.rules.length} rules have not been checked against the source paper. Their citation says where to look, not that anybody has looked. Do not cite them as sourced. `
              : `${unverified} dari ${pack.rules.length} aturan belum diperiksa terhadap makalah sumber. Sitasinya menunjukkan tempat memeriksa, bukan bahwa sudah ada yang memeriksa. Jangan dikutip sebagai bersumber. `}
            <a
              className="text-pen underline decoration-ruleLine underline-offset-4 hover:decoration-pen"
              href="https://github.com/andifathulms/stemmer-visualizer/blob/main/data/rules/GAPS.md"
              rel="noreferrer noopener"
              target="_blank"
            >
              {locale === 'en' ? 'What is checked and in what order (GAPS.md)' : 'Apa yang sudah diperiksa dan urutannya (GAPS.md)'} ↗
            </a>
          </p>
        )}
      </header>

      <Pipeline pack={pack} locale={locale} />

      {GROUPS.map((group) => {
        const rules = rulesOfGroup(pack, group.type)
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

      <ForbiddenTable pack={pack} locale={locale} />

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
