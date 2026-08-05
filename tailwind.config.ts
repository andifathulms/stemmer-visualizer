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
