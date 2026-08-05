'use client'

import { useEffect, useMemo, useState } from 'react'
import { useKupas } from '@/components/app/KupasProvider'
import { Kata } from '@/components/word/Kata'
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

  useEffect(() => setVisible(trace.steps.length), [trace])

  const segmentation = useMemo(() => segmentAt(trace, visible), [trace, visible])
  const atEnd = visible >= trace.steps.length

  return (
    <div className="space-y-8">
      <WordInput copy={copy} />

      <section className="bg-ruled bg-[length:100%_32px] py-4">
        <Kata segmentation={segmentation} />
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

      <Comparison copy={copy} locale={locale} />

      <section>
        <div className="flex items-center justify-between gap-4 pb-2">
          <h2 className="font-ui text-sm text-pencil">
            {copy.stepsLabel} ({trace.steps.length})
          </h2>
          <div className="flex items-center gap-2 font-ui text-xs">
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => setVisible(1)}
              disabled={visible <= 1}
            >
              ⏮
            </button>
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => setVisible((v) => Math.max(1, v - 1))}
              disabled={visible <= 1}
            >
              ←
            </button>
            <span className="w-16 text-center text-pencil">
              {visible}/{trace.steps.length}
            </span>
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => setVisible((v) => Math.min(trace.steps.length, v + 1))}
              disabled={atEnd}
            >
              →
            </button>
            <button
              className="border border-ruleLine px-2 py-1 disabled:opacity-40"
              onClick={() => setVisible(trace.steps.length)}
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
          onHover={setVisible}
        />
      </section>
    </div>
  )
}
