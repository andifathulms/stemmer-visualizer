import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §8. Components never use raw hex.
 *
 * `teacher` (red) is reserved for the final root and for genuine ambiguity.
 * Nothing else in the app may be red; see CLAUDE.md invariant 14.
 *
 * The palette is the one PRD §8 fixes. Two additions, and both are the same
 * colour split by job rather than new colours:
 *
 * - `pencil` is the *text* pencil. The PRD's #8B8B84 measures 3.16:1 on paper
 *   and fails WCAG AA, and pencil carries nearly every piece of secondary text
 *   in the app — labels, hints, nav, rule descriptions, the footer. #6B6B64 is
 *   4.95:1 on paper and 4.56:1 on `paperEdge`, so it clears AA on both
 *   surfaces, and still reads as a soft graphite next to the pen.
 * - `pencilMark` keeps the original #8B8B84 for marks that are not text: the
 *   slashes between morphemes, strike-through rules, hairlines. Contrast
 *   minima do not apply to those, and the lighter grey is what makes a
 *   working-out look like a working-out.
 *
 * The rest of the pairs the app actually renders — computed by
 * `pnpm contrast:check` (scripts/check-contrast.ts), which alpha-composites
 * every translucent fill over the surface it really sits on before measuring,
 * and fails under 4.5:1 for text / 3:1 for non-text marks per WCAG 2.1
 * §1.4.3 / §1.4.11. Re-run it after touching any token; this comment is a
 * record of its last run, not a substitute for it.
 *
 *   pen on paper                              13.86:1  text  ✓
 *   pen on paperEdge                          12.76:1  text  ✓
 *   paper (text) on pen                       13.86:1  text  ✓
 *   teacher on paper                           5.01:1  text  ✓
 *   teacher on paperEdge                       4.62:1  text  ✓
 *   teacher on paperEdge/60 (over paper)       4.78:1  text  ✓
 *   pen on highlight/50 (over paper)          11.09:1  text  ✓
 *   pen on highlight/40 (over paper)          11.59:1  text  ✓
 *   pen on highlight/30 (over paper)          12.11:1  text  ✓
 *   pen on highlight/20 (over paper)          12.69:1  text  ✓
 *   pen on highlight/15 (over paper)          12.91:1  text  ✓
 *   pen on highlight/10 (over paper)          13.26:1  text  ✓
 *   pencil on highlight/20 (over paper)        4.53:1  text  ✓ (clears by 0.03)
 *   pencil on highlight/15 (over paper)        4.61:1  text  ✓
 *   pencilMark on paper                        3.16:1  mark  ✓
 *
 * Failing, unresolved, colour NOT changed pending a decision (see the run
 * that added this block):
 *
 *   teacher on highlight/30 (over paper)       4.38:1  text  ✗ needs 4.50
 *     — components/tree/CandidateTree.tsx:41, the chosen dictionary-valid
 *       node. Below AA by 0.12; teacher alone is 5.01:1 on paper, so the
 *       highlight/30 wash is what pulls it under.
 *   ruleLine on paper                          1.62:1  mark  ✗ needs 3.00
 *     — the hairline border/ruling (app/globals.css .baris, bg-ruled). Never
 *       measured against §1.4.11 before; whether it counts as a UI-component
 *       boundary or an exempt decorative pattern is an open question, not a
 *       code call.
 *   highlight (full fill) on paper             1.57:1  mark  ✗ needs 3.00
 *     — components/Legenda.tsx swatch. Same open question: a colour-key
 *       swatch's own fill against the page, not text on a fill.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F6F5',
        // A half-tone above paper, for panels that must read as laid *on* the
        // page without becoming cards with shadows.
        paperEdge: '#EAEDEC',
        ruleLine: '#B3C6D6',
        pen: '#1F2733',
        pencil: '#6B6B64',
        pencilMark: '#8B8B84',
        highlight: '#E8C34A',
        teacher: '#C0392B',
      },
      fontFamily: {
        prose: ['var(--font-prose)', 'Iowan Old Style', 'Georgia', 'serif'],
        word: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        ui: ['var(--font-ui)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Measure. Prose caps at ~68ch, the width a school text is set to.
      maxWidth: {
        baca: '68ch',
      },
      // The one orchestrated moment — PRD §8. An affix detaches and slides
      // aside, the stem re-centres, the lookup flashes its result, and on a
      // backtrack the affix slides back. Nothing else in the app animates.
      // globals.css zeroes all of it under prefers-reduced-motion, which
      // leaves the full trace rendered statically.
      keyframes: {
        'lepas-awalan': {
          '0%': { transform: 'translateX(0)', opacity: '1', color: '#1F2733' },
          '100%': { transform: 'translateX(-0.35em)', opacity: '0.75', color: '#8B8B84' },
        },
        'lepas-akhiran': {
          '0%': { transform: 'translateX(0)', opacity: '1', color: '#1F2733' },
          '100%': { transform: 'translateX(0.35em)', opacity: '0.75', color: '#8B8B84' },
        },
        'kilat-kamus': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '35%': { backgroundColor: '#E8C34A99' },
        },
        kembali: {
          '0%': { transform: 'translateX(-0.35em)', opacity: '0.6' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'lepas-awalan': 'lepas-awalan 320ms ease-out both',
        'lepas-akhiran': 'lepas-akhiran 320ms ease-out both',
        'kilat-kamus': 'kilat-kamus 600ms ease-out 1',
        kembali: 'kembali 260ms ease-out 1',
      },
      backgroundImage: {
        // The ruling is what makes it a buku tulis rather than a card — PRD §8.
        ruled: 'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, #B3C6D6 31px, #B3C6D6 32px)',
      },
    },
  },
  plugins: [],
}

export default config
