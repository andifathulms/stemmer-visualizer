'use client'

import { useEffect, useMemo, useState } from 'react'
import { useKupas } from '@/components/app/KupasProvider'
import { Kata, type Peeling } from '@/components/word/Kata'
import { StepList } from './StepList'
import { WordInput } from '@/components/app/WordInput'
import { AmbiguityNote } from './AmbiguityNote'
import { Comparison } from './Comparison'
import { Legenda } from '@/components/Legenda'
import { KegagalanNote } from './KegagalanNote'
import { Istilah } from '@/components/Istilah'
import { PohonPelusuran } from '@/components/tree/PohonPelusuran'
import { buildPohon } from '@/lib/tree/pohon'
import { segmentAt } from '@/lib/app/segmentation'
import { jelaskanKegagalan } from '@/lib/app/kegagalan'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * The signature view — PRD §5.1. The word with its morpheme boundaries above,
 * the ordered steps below, and a control that walks them.
 *
 * This component computes nothing (invariant 13): the trace comes from the
 * engine and the segmentation from a pure helper.
 *
 * The layout change is about the payoff. The answer used to be a line of body
 * text several sections below the word, so the two halves of the sentence this
 * page is making — "this word" and "becomes this root" — were never on screen
 * together. They now share one panel.
 */

/** The vocabulary a reader needs before the trace means anything. */
const ISTILAH = ['awalan', 'akhiran', 'kataDasar', 'peluruhan', 'konfiks'] as const

export function TraceView({ copy, locale }: { copy: Copy; locale: Locale }) {
  const { trace, tree } = useKupas()
  const [visible, setVisible] = useState(trace.steps.length)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setVisible(trace.steps.length)
    setPlaying(false)
  }, [trace])

  const segmentation = useMemo(() => segmentAt(trace, visible), [trace, visible])
  const kegagalan = useMemo(() => jelaskanKegagalan(trace), [trace])
  const atEnd = visible >= trace.steps.length

  // The same tree PohonPelusuran draws, computed once here so the step
  // player's cursor (`visible`) and the tree's highlighted node are the same
  // fact, expressed two ways — DESIGN-REWORK.md §2.2/§2.3.
  const pohon = useMemo(() => buildPohon(trace, tree), [trace, tree])
  const activeNodeId =
    visible > 0 ? (pohon.positionAfterStep[visible - 1] ?? pohon.root.id) : pohon.root.id

  // Hovering a tree node scrubs the player to the latest step that left the
  // search standing on that node — the reverse of the highlight above.
  const stepForNode = (nodeId: string): number => {
    if (nodeId === pohon.root.id) return 1
    for (let i = pohon.positionAfterStep.length - 1; i >= 0; i -= 1) {
      if (pohon.positionAfterStep[i] === nodeId) return i + 1
    }
    return visible
  }

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
    <div className="space-y-10">
      <header>
        <h1>{copy.nav.kupas}</h1>
        <p className="mt-3 max-w-baca leading-relaxed">{copy.traceIntro}</p>

        {/* The grammatical vocabulary stays Indonesian in both locales
            (invariant 15), so it is explained in place rather than replaced. */}
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-xs text-pencil">
          <span className="label">{copy.glosariumLabel}</span>
          {ISTILAH.map((term) => (
            <Istilah key={term} term={term} copy={copy}>
              <span className="font-ui text-xs">
                {term === 'kataDasar' ? 'kata dasar' : term}
              </span>
            </Istilah>
          ))}
        </p>
      </header>

      <WordInput copy={copy} locale={locale} />

      {/* The word and its answer, together, on the ruling. */}
      <section aria-label={copy.resultLabel} className="kartu overflow-hidden">
        <div className="bg-ruled bg-[length:100%_32px] px-5 py-6">
          <Kata segmentation={segmentation} peeling={peeling} beat={visible} />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-ruleLine bg-paperEdge/60 px-5 py-4">
          <span className="label">{copy.resultLabel}</span>
          {trace.found ? (
            // Teacher's red: the answer. Nothing else in the app is red, except
            // genuine ambiguity — PRD §8, invariant 14.
            <span className="font-word text-3xl text-teacher">{trace.result}</span>
          ) : (
            <>
              <span className="font-word text-3xl text-pen">{trace.result}</span>
              <span className="font-ui text-xs text-pencil">— {copy.notFound}</span>
            </>
          )}
        </div>
      </section>

      {kegagalan && <KegagalanNote kegagalan={kegagalan} copy={copy} />}

      <Legenda copy={copy} />

      {trace.ambiguity && (
        <AmbiguityNote ambiguity={trace.ambiguity} copy={copy} locale={locale} />
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 pb-3">
          <div>
            <h2 className="font-prose text-base font-semibold">
              {copy.stepsLabel}{' '}
              <span className="font-word text-sm font-normal text-pencil">
                ({trace.steps.length})
              </span>
            </h2>
            <p className="mt-0.5 font-ui text-xs text-pencil">{copy.stepsHint}</p>
          </div>

          {/* Every control is labelled. The bare glyphs were silent to a screen
              reader and ambiguous to everyone else. */}
          <div className="flex items-center gap-1.5 font-ui text-xs">
            <button
              className="tombol px-2 py-1"
              onClick={() => step(1)}
              disabled={visible <= 1}
              aria-label={copy.player.first}
              title={copy.player.first}
            >
              ⏮
            </button>
            <button
              className="tombol px-2 py-1"
              onClick={() => step(Math.max(1, visible - 1))}
              disabled={visible <= 1}
              aria-label={copy.player.prev}
              title={copy.player.prev}
            >
              ←
            </button>
            <button
              className="tombol px-2 py-1"
              onClick={() => {
                if (playing) return setPlaying(false)
                if (atEnd) setVisible(1)
                setPlaying(true)
              }}
              aria-label={playing ? copy.player.pause : copy.player.play}
              title={playing ? copy.player.pause : copy.player.play}
            >
              {playing ? '❙❙' : '▶'}
            </button>
            <span
              className="w-14 text-center font-word text-pencil"
              aria-label={`${copy.player.progress} ${visible}/${trace.steps.length}`}
            >
              {visible}/{trace.steps.length}
            </span>
            <button
              className="tombol px-2 py-1"
              onClick={() => step(Math.min(trace.steps.length, visible + 1))}
              disabled={atEnd}
              aria-label={copy.player.next}
              title={copy.player.next}
            >
              →
            </button>
            <button
              className="tombol px-2 py-1"
              onClick={() => step(trace.steps.length)}
              disabled={atEnd}
              aria-label={copy.player.last}
              title={copy.player.last}
            >
              ⏭
            </button>
          </div>
        </div>

        {/* How far through the trace we are, as a rule that fills. */}
        <div
          className="h-0.5 w-full bg-ruleLine/50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={trace.steps.length}
          aria-valuenow={visible}
          aria-label={copy.player.progress}
        >
          <div
            className="h-full bg-pen transition-[width] duration-300"
            style={{
              width: trace.steps.length ? `${(visible / trace.steps.length) * 100}%` : '0%',
            }}
          />
        </div>

        {/* The drawn search tree — DESIGN-REWORK.md §2. The precedence path
            at full weight, every other branch faint but present ("jalur"
            mode); the step player above and this share one cursor. */}
        <div className="mt-4">
          <PohonPelusuran
            trace={trace}
            tree={tree}
            mode="jalur"
            copy={copy}
            locale={locale}
            activeNodeId={activeNodeId}
            onHoverNode={(nodeId) => step(stepForNode(nodeId))}
          />
        </div>

        <StepList trace={trace} copy={copy} locale={locale} visible={visible} onHover={step} />
      </section>

      <Comparison locale={locale} />
    </div>
  )
}
