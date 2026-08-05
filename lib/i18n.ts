/**
 * Indonesian first, English secondary — PRD §8. Grammatical vocabulary stays
 * Indonesian in both locales (awalan, akhiran, konfiks, kata dasar,
 * peluruhan); the English copy glosses it rather than translating it away.
 */
export const LOCALES = ['id', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export interface Copy {
  readonly tagline: string
  readonly nav: {
    readonly kupas: string
    readonly kandidat: string
    readonly kamus: string
    readonly aturan: string
    readonly galeri: string
    readonly dokumen: string
  }
  readonly navHint: {
    readonly kupas: string
    readonly kandidat: string
    readonly kamus: string
    readonly aturan: string
    readonly galeri: string
    readonly dokumen: string
  }
  readonly wordLabel: string
  readonly variantLabel: string
  readonly resultLabel: string
  readonly notFound: string
  readonly ambiguous: string
  readonly ambiguousLead: string
  readonly stepsLabel: string
  readonly abandoned: string
  readonly lookup: string
  readonly lookupHit: string
  readonly lookupMiss: string
  readonly disclaimer: string
  readonly unverifiedRule: string
}

const id: Copy = {
  tagline:
    'Algoritma Nazief & Adriani dibuka: setiap aturan yang berlaku, setiap pencarian kamus, setiap langkah yang dibatalkan — dan setiap kata dasar yang mungkin.',
  nav: {
    kupas: 'Kupas',
    kandidat: 'Kandidat',
    kamus: 'Kamus',
    aturan: 'Aturan',
    galeri: 'Galeri kegagalan',
    dokumen: 'Dokumen',
  },
  navHint: {
    kupas: 'Jejak langkah demi langkah',
    kandidat: 'Semua pemenggalan yang mungkin',
    kamus: 'Kamus kata dasar — bisa disunting',
    aturan: 'Rujukan aturan beserta sitasinya',
    galeri: 'Kata yang salah dikupas',
    dokumen: 'Tempel teks, lihat kata dasarnya',
  },
  wordLabel: 'Kata',
  variantLabel: 'Varian',
  resultLabel: 'Kata dasar',
  notFound: 'Tidak ditemukan di kamus — kata dikembalikan apa adanya.',
  ambiguous: 'Ambigu',
  ambiguousLead: 'Kata ini punya lebih dari satu kemungkinan kata dasar. Algoritma memilih salah satu.',
  stepsLabel: 'Langkah',
  abandoned: 'dibatalkan',
  lookup: 'Cek kamus',
  lookupHit: 'ada di kamus',
  lookupMiss: 'tidak ada di kamus',
  disclaimer:
    'Proyek belajar pribadi yang mengikuti makalah aslinya. Bukan Sastrawi, dan tidak mengklaim hasil yang sama dengan Sastrawi.',
  unverifiedRule: 'Aturan ini belum diperiksa terhadap makalah sumber.',
}

const en: Copy = {
  tagline:
    'The Nazief & Adriani stemmer opened up: every rule that fired, every dictionary lookup, every backtrack — and every root the word could plausibly have.',
  nav: {
    kupas: 'Trace',
    kandidat: 'Candidates',
    kamus: 'Dictionary',
    aturan: 'Rules',
    galeri: 'Failure gallery',
    dokumen: 'Document',
  },
  navHint: {
    kupas: 'Step-by-step trace',
    kandidat: 'Every admissible segmentation',
    kamus: 'Root dictionary — editable',
    aturan: 'Rule reference with citations',
    galeri: 'Words the algorithm gets wrong',
    dokumen: 'Paste text, get roots',
  },
  wordLabel: 'Word',
  variantLabel: 'Variant',
  resultLabel: 'Root (kata dasar)',
  notFound: 'Not in the dictionary — the word is returned unchanged.',
  ambiguous: 'Ambiguous',
  ambiguousLead:
    'This word has more than one plausible root (kata dasar). The algorithm picks one of them.',
  stepsLabel: 'Steps',
  abandoned: 'abandoned',
  lookup: 'Dictionary lookup',
  lookupHit: 'in dictionary',
  lookupMiss: 'not in dictionary',
  disclaimer:
    'A personal educational project implementing the published papers. Not Sastrawi, and no parity with Sastrawi is claimed.',
  unverifiedRule: 'This rule has not been checked against the source paper.',
}

const COPY: Record<Locale, Copy> = { id, en }

export function getCopy(locale: Locale): Copy {
  return COPY[locale]
}
