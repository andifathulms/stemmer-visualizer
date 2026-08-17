/**
 * Build-time contrast check over every token pair the UI actually puts text
 * or a mark on top of. Pure arithmetic on the token values from
 * `tailwind.config.ts` — no browser, nothing rendered.
 *
 * `tailwind.config.ts` already records that `pencil` was split from the
 * PRD's original `#8B8B84` after that value measured 3.16:1 on `paper` and
 * failed WCAG AA. This script is that same measurement, generalised and run
 * for every other pair the app puts on screen, so a colour decision doesn't
 * stay undocumented just because nobody happened to compute it by hand.
 *
 * Each PAIR below is cited to the file(s) that actually produce it — the
 * same discipline as a rule citation: an address to check, not a claim
 * nobody looked. Opacity variants (`bg-highlight/40` etc.) are alpha-
 * composited over the surface they actually sit on before the ratio is
 * computed, because a translucent fill is not the same colour as its token.
 *
 * WCAG 2.1 thresholds: 4.5:1 for text (§1.4.3), 3:1 for non-text marks and
 * graphical objects (§1.4.11) — pencil slashes, strike-through rules,
 * swatch fills, the ruled hairline.
 */
type Rgb = readonly [number, number, number]

const TOKENS = {
  paper: '#F4F6F5',
  paperEdge: '#EAEDEC',
  ruleLine: '#B3C6D6',
  pen: '#1F2733',
  pencil: '#6B6B64',
  pencilMark: '#8B8B84',
  highlight: '#E8C34A',
  teacher: '#C0392B',
} as const

type Token = keyof typeof TOKENS

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

// WCAG relative luminance, sRGB — 2.1 §1.4.3.
function luminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

// Alpha-composite `fg` at `alpha` over opaque `bg` — "over" operator with an
// opaque backdrop, which is what a Tailwind `bg-highlight/40` on a solid
// page actually renders as.
function compositeOver(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha))
  return [mix(fg[0], bg[0]), mix(fg[1], bg[1]), mix(fg[2], bg[2])]
}

type Layer = { token: Token; alpha?: number }

// Resolve a stack of layers (bottom to top) to one opaque RGB triple.
function resolve(stack: readonly Layer[]): Rgb {
  let base = hexToRgb(TOKENS[stack[0]!.token])
  for (const layer of stack.slice(1)) {
    const alpha = layer.alpha ?? 1
    base = compositeOver(hexToRgb(TOKENS[layer.token]), alpha, base)
  }
  return base
}

type Pair = {
  label: string
  kind: 'text' | 'mark'
  fg: readonly Layer[]
  bg: readonly Layer[]
  usedIn: readonly string[]
}

// Every token pair actually in use. `bg` and `fg` are layer stacks so
// translucent fills composite over the surface they really sit on — e.g.
// `bg-highlight/40` inside a `kartu` sits on `paper`, and `paperEdge/60`
// (the result strip) itself sits on `paper` before `teacher` text is laid
// on top of that.
const PAIRS: readonly Pair[] = [
  {
    label: 'pen on paper',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }],
    usedIn: ['app/globals.css:10 (body)'],
  },
  {
    label: 'pen on paperEdge',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paperEdge' }],
    usedIn: ['components/trace/AmbiguityNote.tsx', 'components/home/Peragaan.tsx:35'],
  },
  {
    label: 'pencil on paper',
    kind: 'text',
    fg: [{ token: 'pencil' }],
    bg: [{ token: 'paper' }],
    usedIn: ['components/trace/StepList.tsx', 'components/SiteFooter.tsx:14'],
  },
  {
    label: 'pencil on paperEdge',
    kind: 'text',
    fg: [{ token: 'pencil' }],
    bg: [{ token: 'paperEdge' }],
    usedIn: ['components/trace/TraceView.tsx:115 (result strip)'],
  },
  {
    label: 'paper (text) on pen',
    kind: 'text',
    fg: [{ token: 'paper' }],
    bg: [{ token: 'pen' }],
    usedIn: ['app/globals.css:78 (.tombol-utama)', 'components/SiteHeader.tsx:102 (active locale pill)'],
  },
  {
    label: 'teacher on paper',
    kind: 'text',
    fg: [{ token: 'teacher' }],
    bg: [{ token: 'paper' }],
    usedIn: [
      'components/trace/AmbiguityNote.tsx:26',
      'components/tree/CandidateTree.tsx:38,60,132',
      'components/document/DocumentMode.tsx:71,111',
      'components/home/Peragaan.tsx:56',
    ],
  },
  {
    label: 'teacher on paperEdge',
    kind: 'text',
    fg: [{ token: 'teacher' }],
    bg: [{ token: 'paperEdge' }],
    usedIn: ['components/trace/Comparison.tsx:49'],
  },
  {
    label: 'teacher on paperEdge/60 (over paper)',
    kind: 'text',
    fg: [{ token: 'teacher' }],
    bg: [{ token: 'paper' }, { token: 'paperEdge', alpha: 0.6 }],
    usedIn: ['components/trace/TraceView.tsx:106-111 (result readout, text-3xl)'],
  },
  {
    label: 'pen on highlight/50 (over paper)',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.5 }],
    usedIn: ['components/trace/StepList.tsx:73 (dictionary-hit tag)'],
  },
  {
    label: 'pen on highlight/40 (over paper)',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.4 }],
    usedIn: [
      'components/app/WordInput.tsx:125 (edited badge, explicit text-pen)',
      'components/trace/StepList.tsx:86 (peluruhan tag, inherits body pen)',
      'components/word/Kata.tsx:88 (restored letter, inherits body pen)',
      'components/rules/RuleReference.tsx:31 (peluruhan badge, inherits body pen)',
    ],
  },
  {
    label: 'pen on highlight/30 (over paper)',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.3 }],
    usedIn: ['components/tree/CandidateTree.tsx:41 (dictionary-valid node, unselected path)'],
  },
  {
    label: 'teacher on highlight/30 (over paper)',
    kind: 'text',
    fg: [{ token: 'teacher' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.3 }],
    usedIn: ['components/tree/CandidateTree.tsx:41 (dictionary-valid node, chosen path)'],
  },
  {
    label: 'pen on highlight/20 (over paper)',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.2 }],
    usedIn: ['components/dictionary/DictionaryPanel.tsx:159 (consulted-word row)'],
  },
  {
    label: 'pencil on highlight/20 (over paper)',
    kind: 'text',
    fg: [{ token: 'pencil' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.2 }],
    usedIn: ['components/dictionary/DictionaryPanel.tsx:161 (provenance, in the same row)'],
  },
  {
    label: 'pencil on highlight/20 (SiteHeader, over paper)',
    kind: 'text',
    fg: [{ token: 'pencil' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.2 }],
    usedIn: ['components/SiteHeader.tsx:102 (inactive locale, hover)'],
  },
  {
    label: 'pen on highlight/15 (over paper)',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.15 }],
    usedIn: ['components/trace/StepList.tsx:52 (active/selected step row)', 'app/globals.css:71 (.tombol hover)'],
  },
  {
    label: 'pencil on highlight/15 (over paper)',
    kind: 'text',
    fg: [{ token: 'pencil' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.15 }],
    usedIn: ['components/trace/StepList.tsx:64 (step index, in the active row)'],
  },
  {
    label: 'pen on highlight/10 (over paper)',
    kind: 'text',
    fg: [{ token: 'pen' }],
    bg: [{ token: 'paper' }, { token: 'highlight', alpha: 0.1 }],
    usedIn: ['app/[locale]/page.tsx:40 (nav card hover)'],
  },
  {
    label: 'pencilMark (mark) on paper',
    kind: 'mark',
    fg: [{ token: 'pencilMark' }],
    bg: [{ token: 'paper' }],
    usedIn: ['components/word/Kata.tsx (morpheme slash)', 'app/globals.css:52 (.dicoret strike-through)'],
  },
  {
    label: 'ruleLine (mark) on paper',
    kind: 'mark',
    fg: [{ token: 'ruleLine' }],
    bg: [{ token: 'paper' }],
    usedIn: ['app/globals.css:44 (.baris)', 'tailwind.config.ts (bg-ruled)'],
  },
  {
    label: 'highlight (mark, full fill) on paper',
    kind: 'mark',
    fg: [{ token: 'highlight' }],
    bg: [{ token: 'paper' }],
    usedIn: ['components/Legenda.tsx:19 (swatch)'],
  },
] as const

function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}

function main(): void {
  const threshold = { text: 4.5, mark: 3.0 }
  const problems: string[] = []
  const results: string[] = []

  for (const pair of PAIRS) {
    const fg = resolve(pair.fg)
    const bg = resolve(pair.bg)
    const ratio = contrastRatio(fg, bg)
    const min = threshold[pair.kind]
    const pass = ratio >= min
    const line = `${pass ? '✓' : '✗'} ${pair.label} — ${formatRatio(ratio)} (needs ${min}:1 for ${pair.kind})`
    results.push(line)
    if (!pass) {
      problems.push(`${pair.label}: ${formatRatio(ratio)}, below ${min}:1 — used in ${pair.usedIn.join('; ')}`)
    }
  }

  console.log(results.join('\n'))

  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} pair(s) below threshold:`)
    for (const problem of problems) console.error(`  ${problem}`)
    process.exit(1)
  }

  console.log('\n✓ every used token pair clears its WCAG threshold')
}

main()
