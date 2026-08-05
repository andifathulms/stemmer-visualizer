import type { Metadata, Viewport } from 'next'
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

const TITLE = 'Stemmer Visualizer — melihat kata Indonesia dipotong jadi kata dasar'
const DESCRIPTION =
  'Ketik satu kata Indonesia dan lihat imbuhannya dikupas satu per satu: aturan mana yang berlaku, kamus mana yang dicek, langkah mana yang dibatalkan — dan kata dasar lain yang sebenarnya juga mungkin.'

/**
 * `metadataBase` is what turns the `app/opengraph-image.png` file convention
 * into the absolute URL that link unfurlers require — a relative path is
 * silently ignored by every scraper. It has to include `basePath`, since Pages
 * serves this from a subdirectory.
 *
 * The icons themselves come from file conventions rather than being listed
 * here: `app/icon.svg` for the tab, `app/apple-icon.png` for the iOS home
 * screen, `app/manifest.ts` for Android and PWA install. Next resolves
 * `basePath` for those; hand-written URLs it does not.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const origin = 'https://andifathulms.github.io'
const siteUrl = `${origin}${basePath}`

export const metadata: Metadata = {
  // The ORIGIN, not the site root. Paths produced by the file conventions
  // already carry `basePath`, so resolving them against a base that also
  // carried it produced `/stemmer-visualizer/stemmer-visualizer/…` and a
  // broken preview card on every unfurl.
  metadataBase: new URL(origin),
  // Written by hand because Next does not apply `basePath` to this one —
  // unlike the icon conventions above it. Left alone it points at the domain
  // root and 404s on Pages.
  manifest: `${basePath}/manifest.webmanifest`,
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Stemmer Visualizer',
  authors: [{ name: 'Andi Fathul Mukminin', url: 'https://andifathulms.github.io/en/' }],
  creator: 'Andi Fathul Mukminin',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    alternateLocale: 'en_GB',
    url: siteUrl,
    siteName: 'Stemmer Visualizer',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

/** Ink, from the brand palette — the colour the mark sits on. */
export const viewport: Viewport = {
  themeColor: '#1B2430',
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
