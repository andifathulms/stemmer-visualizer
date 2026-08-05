import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §8. Components never use raw hex.
 *
 * `teacher` (red) is reserved for the final root and for genuine ambiguity.
 * Nothing else in the app may be red; see CLAUDE.md invariant 14.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F6F5',
        ruleLine: '#B3C6D6',
        pen: '#1F2733',
        pencil: '#8B8B84',
        highlight: '#E8C34A',
        teacher: '#C0392B',
      },
      fontFamily: {
        prose: ['Literata', 'Iowan Old Style', 'Georgia', 'serif'],
        word: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        ui: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
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
