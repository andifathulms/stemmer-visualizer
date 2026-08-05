'use client'

import Link from 'next/link'
import type { Copy, Locale } from '@/lib/i18n'
import type { StemTrace, TraceStep } from '@/lib/engine/trace'

/**
 * The steps, as numbered ruled lines — PRD §8. Numbering is right here: the
 * algorithm's steps are a real ordered sequence, and the number is what a
 * reader cites when they ask about one.
 *
 * Abandoned attempts are struck through and indented, never hidden
 * (invariant 9).
 */

function stopText(step: Extract<TraceStep, { type: 'berhenti' }>, locale: Locale): string {
  const id: Record<typeof step.reason, string> = {
    'ditemukan-di-kamus': 'Berhenti: kata dasar ditemukan di kamus.',
    'awalan-berulang': 'Berhenti: awalan yang sama muncul lagi.',
    'batas-iterasi-awalan': 'Berhenti: batas tiga kali pembuangan awalan tercapai.',
    'kombinasi-terlarang': 'Berhenti: kombinasi awalan–akhiran ini tidak diizinkan.',
    'tidak-ada-aturan-yang-cocok': 'Berhenti: tidak ada aturan yang cocok. Kata dikembalikan utuh.',
  }
  const en: Record<typeof step.reason, string> = {
    'ditemukan-di-kamus': 'Stop: the root is in the dictionary.',
    'awalan-berulang': 'Stop: a prefix repeated the one just removed.',
    'batas-iterasi-awalan': 'Stop: the three-prefix limit was reached.',
    'kombinasi-terlarang': 'Stop: this prefix–suffix combination is not allowed.',
    'tidak-ada-aturan-yang-cocok': 'Stop: no rule matched. The word is returned unchanged.',
  }
  return locale === 'en' ? en[step.reason] : id[step.reason]
}

function StepRow({
  step,
  copy,
  locale,
  active,
  onSelect,
}: {
  step: TraceStep
  copy: Copy
  locale: Locale
  active: boolean
  onSelect(): void
}) {
  const abandoned = step.type === 'buang' && step.abandoned

  return (
    <li
      className={`baris flex gap-3 py-2.5 transition-colors ${
        active ? 'bg-highlight/15' : 'hover:bg-paperEdge/70'
      }`}
      // Depth of prefix iteration, as indentation. Abandoned branches are
      // indented and struck through rather than hidden.
      style={{ paddingLeft: `${Math.min(step.iterasi, 3) * 1.25}rem` }}
      onMouseEnter={onSelect}
      // Reachable by keyboard: stepping the trace with the arrow buttons and
      // scrubbing it by pointer were the only two ways in, and the second was
      // mouse-only.
      tabIndex={0}
      onFocus={onSelect}
    >
      <span className="w-6 shrink-0 pt-0.5 text-right font-word text-xs tabular-nums text-pencil">
        {step.index + 1}
      </span>

      <div className={`min-w-0 flex-1 font-ui text-sm ${abandoned ? 'dicoret' : ''}`}>
        {step.type === 'cek-kamus' && (
          <span>
            {copy.lookup} <span className="font-word text-pen">{step.kata}</span> —{' '}
            {step.found ? (
              <span className="rounded-sm bg-highlight/50 px-1">{copy.lookupHit}</span>
            ) : (
              <span className="text-pencil">{copy.lookupMiss}</span>
            )}
          </span>
        )}

        {step.type === 'buang' && (
          <span>
            <span className="font-word">{step.dari}</span>
            <span className="mx-1 text-pencil">→</span>
            <span className="font-word">{step.ke}</span>
            {step.restored !== null && (
              <span className="ml-2 rounded-sm bg-highlight/40 px-1 text-xs">
                peluruhan: +{step.restored}
              </span>
            )}
            {step.totalReadings > 1 && (
              <span className="ml-2 text-xs text-pencil">
                bacaan {step.readingIndex + 1}/{step.totalReadings}
              </span>
            )}
            <span className="ml-2 text-xs text-pencil">{step.rule.keterangan}</span>{' '}
            <Link
              className="font-word text-xs text-pencil underline decoration-ruleLine hover:text-pen"
              href={`/${locale}/aturan/#${step.ruleId}`}
            >
              {step.ruleId}
            </Link>
            {abandoned && <span className="ml-2 text-xs">({copy.abandoned})</span>}
          </span>
        )}

        {step.type === 'kombinasi-terlarang' && (
          <span>
            <span className="font-word">
              {step.jenis}- … {step.akhiran}
            </span>{' '}
            — {step.keterangan}{' '}
            <span className="text-xs text-pencil">
              ({step.citation.source} {step.citation.locus})
            </span>
          </span>
        )}

        {step.type === 'berhenti' && (
          <span className="text-pencil">{stopText(step, locale)}</span>
        )}
      </div>
    </li>
  )
}

export function StepList({
  trace,
  copy,
  locale,
  visible,
  onHover,
}: {
  trace: StemTrace
  copy: Copy
  locale: Locale
  visible: number
  onHover(index: number): void
}) {
  return (
    <ol className="border-t border-ruleLine">
      {trace.steps.slice(0, visible).map((step) => (
        <StepRow
          key={step.index}
          step={step}
          copy={copy}
          locale={locale}
          active={step.index === visible - 1}
          onSelect={() => onHover(step.index + 1)}
        />
      ))}
    </ol>
  )
}
