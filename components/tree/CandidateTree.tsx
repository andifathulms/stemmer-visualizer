'use client'

import Link from 'next/link'
import { useKupas } from '@/components/app/KupasProvider'
import { WordInput } from '@/components/app/WordInput'
import type { CandidateNode } from '@/lib/engine/enumerate'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * Candidate mode — PRD §5.2. Every segmentation the morphology admits, as a
 * tree, with each leaf marked dictionary-valid or not and the algorithm's
 * chosen path highlighted.
 *
 * For genuinely ambiguous words this is the whole story: the app says there
 * are several valid readings instead of silently returning one.
 */

function Node({
  node,
  chosen,
  chosenPath,
  locale,
}: {
  node: CandidateNode
  chosen: string
  chosenPath: ReadonlySet<string>
  locale: Locale
}) {
  const onChosenPath = chosenPath.has(node.kata)

  return (
    <li className="border-l border-ruleLine pl-3">
      <div className="flex flex-wrap items-baseline gap-x-2 py-1">
        <span
          className={`font-word text-sm ${
            node.dictionaryValid
              ? node.kata === chosen
                ? 'text-teacher'
                : 'text-pen'
              : 'text-pencil'
          } ${node.dictionaryValid ? 'rounded-sm bg-highlight/30 px-1' : ''}`}
        >
          {node.restored !== null && <span className="opacity-70">+{node.restored} </span>}
          {node.kata}
        </span>

        {node.ruleId && (
          <Link
            className="font-word text-xs text-pencil underline decoration-ruleLine hover:text-pen"
            href={`/${locale}/aturan/#${node.ruleId}`}
          >
            {node.ruleId}
            {node.readingIndex !== null && node.rule && node.rule.produces.length > 1
              ? `#${node.readingIndex + 1}`
              : ''}
          </Link>
        )}

        {node.kata === chosen && (
          <span className="font-ui text-xs text-teacher">
            {locale === 'en' ? 'the algorithm returns this' : 'ini yang dikembalikan algoritma'}
          </span>
        )}
        {onChosenPath && node.kata !== chosen && (
          <span className="font-ui text-xs text-pencil">
            {locale === 'en' ? 'on the chosen path' : 'di jalur yang dipilih'}
          </span>
        )}
        {node.truncated && (
          <span className="font-ui text-xs text-pencil">
            {locale === 'en' ? '… cut off by the cap' : '… dipotong oleh batas'}
          </span>
        )}
      </div>

      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <Node
              key={child.id}
              node={child}
              chosen={chosen}
              chosenPath={chosenPath}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function CandidateTreeView({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { tree, trace } = useKupas()

  // Every intermediate form the algorithm actually passed through.
  const chosenPath = new Set(
    trace.steps
      .filter((step) => step.type === 'buang' && !step.abandoned)
      .map((step) => (step.type === 'buang' ? step.ke : '')),
  )

  return (
    <div className="space-y-10">
      {/* The heading leads. It used to sit below the input, so the page
          announced what it was only after asking you to use it. */}
      <header>
        <h1>{copy.nav.kandidat}</h1>
        <p className="mt-3 max-w-baca leading-relaxed">{copy.navHint.kandidat}</p>
      </header>

      <WordInput copy={copy} locale={locale} />

      <section>
        <h2 className="font-ui text-sm text-pencil">
          {locale === 'en' ? 'Dictionary-valid readings' : 'Bacaan yang sah menurut kamus'} (
          {tree.candidates.length})
        </h2>
        <ul className="mt-2 space-y-1">
          {tree.candidates.map((candidate) => (
            <li key={candidate.kata} className="font-word text-sm">
              <span className={candidate.kata === trace.result ? 'text-teacher' : 'text-pen'}>
                {candidate.kata}
              </span>
              {candidate.jalur.length > 0 && (
                <span className="ml-2 font-ui text-xs text-pencil">
                  {candidate.jalur.join(' → ')}
                </span>
              )}
            </li>
          ))}
          {tree.candidates.length === 0 && (
            <li className="font-ui text-sm text-pencil">
              {locale === 'en'
                ? 'No reading of this word is in the dictionary.'
                : 'Tidak ada bacaan kata ini yang ada di kamus.'}
            </li>
          )}
        </ul>
        {tree.candidates.length > 1 && (
          <p className="mt-3 max-w-2xl border-l-2 border-teacher pl-3 text-sm">
            {copy.ambiguousLead}
          </p>
        )}
      </section>

      <section>
        <h2 className="font-ui text-sm text-pencil">
          {locale === 'en' ? 'Every admissible segmentation' : 'Semua pemenggalan yang diizinkan'}
        </h2>
        <ul className="mt-2">
          <Node node={tree.root} chosen={trace.result} chosenPath={chosenPath} locale={locale} />
        </ul>
        <p className="mt-3 font-ui text-xs text-pencil">
          {tree.nodeCount}{' '}
          {locale === 'en' ? 'nodes, depth limit' : 'simpul, batas kedalaman'} {tree.maxDepth}
          {tree.capped && (
            // The cap is reported, never applied silently — PRD §12.
            <>
              {' '}
              ·{' '}
              <span className="text-pen">
                {locale === 'en'
                  ? 'the cap was reached: this tree is incomplete'
                  : 'batas tercapai: pohon ini belum lengkap'}
              </span>
            </>
          )}
        </p>
      </section>
    </div>
  )
}
