import type { Metadata } from 'next'
import { Inter, Literata } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

/**
 * The type system of PRD §8, actually loaded.
 *
 * Literata for prose and headings — a screen-native text serif in the register
 * of a school textbook. Geist Mono for the word under analysis, morpheme
 * segmentation and rule ids, so boundaries align vertically down the trace and
 * the peeling reads as a column. Inter for controls.
 *
 * All three are self-hosted at build time: `output: 'export'` ships to GitHub
 * Pages with no runtime font fetch, and `display: 'swap'` keeps the trace
 * readable before they land. Geist Mono comes from the `geist` package rather
 * than next/font/google, which does not carry it.
 */
const literata = Literata({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-prose',
  // 400 for prose, 600 for headings and the emphasis inside them.
  weight: ['400', '600'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
})

export const metadata: Metadata = {
  title: 'Stemmer Visualizer — melihat kata Indonesia dipotong jadi kata dasar',
  description:
    'Ketik satu kata Indonesia dan lihat imbuhannya dikupas satu per satu: aturan mana yang berlaku, kamus mana yang dicek, langkah mana yang dibatalkan — dan kata dasar lain yang sebenarnya juga mungkin.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${literata.variable} ${inter.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
