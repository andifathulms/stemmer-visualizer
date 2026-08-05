'use client'

import { useEffect, useMemo, useState } from 'react'
import { useKupas } from '@/components/app/KupasProvider'
import { Kata, type Peeling } from '@/components/word/Kata'
import { StepList } from './StepList'
import { WordInput } from '@/components/app/WordInput'
import { AmbiguityNote } from './AmbiguityNote'
import { Comparison } from './Comparison'
import { segmentAt } from '@/lib/app/segmentation'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * The signature view — PRD §5.1. The word with its morpheme boundaries above,
 * the ordered steps below, and a control that walks them.
 *
 * This component computes nothing (invariant 13): the trace comes from the
 * engine and the segmentation from a pure helper.
 */
export function TraceView({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { trace } = useKupas()
  const [visible, setVisible] = useState(trace.steps.length)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setVisible(trace.steps.length)
    setPlaying(false)
  }, [trace])

  const segmentation = useMemo(() => segmentAt(trace, visible), [trace, visible])
  const atEnd = visible >= trace.steps.length

  /**
   * What the step now on screen did, so the word can act it out — PRD §8. An
   * abandoned removal is a backtrack: the word does not change, so the peeling
   * plays in reverse instead of nothing happening at all.
   */
  const peeling: Peeling = useMemo(() => {
    const step = trace.steps[visible - 1]
    if (!step) return null
    if (step.type === 'cek-kamus') return step.found ? { kind: 'ketemu' } : null
    if (step.type !== 'buang') return null
    if (step.abandoned) return { kind: 'mundur' }
    return step.rule.type === 'awalan' ? { kind: 'buang-awalan' } : { kind: 'buang-akhiran' }
  }, [trace, visible])

  // Walking the trace one step at a time, on a timer. Stops at the end, and at
  // any manual interaction.
  useEffect(() => {
    if (!playing) return
    if (visible >= trace.steps.length) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setVisible((v) => Math.min(trace.steps.length, v + 1)), 900)
    return () => clearTimeout(timer)
  }, [playing, visible, trace.steps.length])

  const step = (next: number) => {
    setPlaying(false)
    setVisible(next)
  }

  return (
    <div className="space-y-8">
      <WordInput copy={copy} />

      <section className="bg-ruled bg-[length:100%_32px] py-4">
        <Kata segmentation={segmentation} peeling={peeling} beat={visible} />
      </section>

      <section className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-ui text-sm text-pencil">{copy.resultLabel}:</span>
        {trace.found ? (
          // Teacher's red: the answer. Nothing else in the app is red, except
          // genuine ambiguity — PRD §8, invariant 14.
          <span className="font-word text-2xl text-teacher">{trace.result}</span>
        ) : (
          <span className="font-word text-2xl text-pen">
            {trace.result}{' '}
            <span className="font-ui text-sm text-pencil">— {copy.notFound}</span>
          </span>
        )}
      </section>

      {trace.ambiguity && (
        <AmbiguityNote ambiguity={trace.ambiguity} copy={copy} locale={locale} />
      )}

      <Comparison locale={locale} />

      <section>
        <div className="flex items-center justify-between gap-4 pb-2">
          <h2 className="font-ui text-sm text-pencil">
            {copy.stepsLabel} ({trace.steps.length})
          </h2>
          <div className="flex items-center gap-2 font-ui text-xs">
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => step(1)}
              disabled={visible <= 1}
            >
              ⏮
            </button>
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => step(Math.max(1, visible - 1))}
              disabled={visible <= 1}
            >
              ←
            </button>
            <button
              className="border border-ruleLine px-2 py-1"
              onClick={() => {
                if (playing) return setPlaying(false)
                if (atEnd) setVisible(1)
                setPlaying(true)
              }}
              title={locale === 'en' ? 'play the trace' : 'putar jejaknya'}
            >
              {playing ? '❙❙' : '▶'}
            </button>
            <span className="w-16 text-center text-pencil">
              {visible}/{trace.steps.length}
            </span>
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => step(Math.min(trace.steps.length, visible + 1))}
              disabled={atEnd}
            >
              →
            </button>
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => step(trace.steps.length)}
              disabled={atEnd}
            >
              ⏭
            </button>
          </div>
        </div>

        <StepList
          trace={trace}
          copy={copy}
          locale={locale}
          visible={visible}
          onHover={step}
        />
      </section>
    </div>
  )
}
