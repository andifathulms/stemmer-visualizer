/**
 * Indonesian first, English secondary — PRD §8. Grammatical vocabulary stays
 * Indonesian in both locales (awalan, akhiran, konfiks, kata dasar,
 * peluruhan); the English copy glosses it rather than translating it away.
 *
 * The register is deliberately plain. A visitor who has never heard the word
 * "stemming" should be able to read the landing page and the trace page and
 * come away knowing what the tool does — so the first sentence of anything
 * user-facing names a concrete thing ("memotong imbuhan") before it names an
 * abstraction ("algoritma Nazief & Adriani"). Jargon is allowed once the
 * reader has a reason to want it, and glossed on first use via `istilah`.
 */
export const LOCALES = ['id', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** A section of the site, as it appears in the nav and on the landing page. */
export interface SectionCopy {
  readonly label: string
  readonly hint: string
}

export type SectionKey = 'kupas' | 'kandidat' | 'kamus' | 'aturan' | 'galeri' | 'dokumen'

/** An example word, with the reason it is worth trying. */
export interface ExampleCopy {
  readonly kata: string
  readonly alasan: string
}

export interface Copy {
  readonly tagline: string
  /** The product name. A proper noun, so it is the same in both locales. */
  readonly brandName: string
  readonly brandTagline: string

  readonly nav: Record<SectionKey, string>
  readonly navHint: Record<SectionKey, string>
  /** The two groups the nav and the landing grid are split into. */
  readonly navGroup: { readonly mulai: string; readonly dalam: string }

  readonly hero: {
    readonly eyebrow: string
    readonly title: string
    readonly lead: string
    readonly primary: string
    readonly secondary: string
  }

  readonly demo: {
    readonly title: string
    readonly lead: string
    readonly inputLabel: string
    readonly outputLabel: string
    readonly caption: string
    readonly cta: string
  }

  readonly why: {
    readonly title: string
    readonly points: readonly { readonly title: string; readonly body: string }[]
  }

  readonly legend: {
    readonly title: string
    readonly pen: string
    readonly pencil: string
    readonly highlight: string
    readonly teacher: string
  }

  /** Terms glossed on first use — PRD §8. */
  readonly glosariumLabel: string
  readonly glosarium: Record<
    'awalan' | 'akhiran' | 'imbuhan' | 'kataDasar' | 'peluruhan' | 'konfiks',
    string
  >

  readonly traceIntro: string
  readonly examplesLabel: string
  readonly examples: readonly ExampleCopy[]

  readonly wordLabel: string
  readonly wordPlaceholder: string
  readonly wordSubmit: string
  readonly variantLabel: string
  readonly resultLabel: string
  readonly notFound: string
  readonly ambiguous: string
  readonly ambiguousLead: string

  /** Why a word came back unstemmed — see lib/app/kegagalan.ts. */
  readonly kegagalan: {
    readonly title: string
    /** `{kata}` is the last form the algorithm reached. */
    readonly lead: string
    readonly triedLabel: string
    readonly add: string
    readonly added: string
    readonly note: string
  }
  readonly stepsLabel: string
  readonly stepsHint: string
  readonly abandoned: string
  readonly lookup: string
  readonly lookupHit: string
  readonly lookupMiss: string

  readonly player: {
    readonly first: string
    readonly prev: string
    readonly play: string
    readonly pause: string
    readonly next: string
    readonly last: string
    readonly progress: string
  }

  /** `{n}` is replaced with the count. A plain string, not a function: `Copy`
   *  crosses the server/client boundary and functions do not serialise. */
  readonly dictionaryCount: string
  readonly dictionaryEdited: string
  readonly dictionaryLoading: string

  readonly disclaimer: string
  readonly unverifiedRule: string
  readonly honesty: { readonly title: string; readonly body: string; readonly link: string }
}

const id: Copy = {
  tagline:
    'Algoritma Nazief & Adriani dibuka: setiap aturan yang berlaku, setiap pencarian kamus, setiap langkah yang dibatalkan — dan setiap kata dasar yang mungkin.',
  brandName: 'Stemmer Visualizer',
  brandTagline: 'Membuka cara kata Indonesia dipotong jadi kata dasar',

  nav: {
    kupas: 'Kupas',
    kandidat: 'Kandidat',
    kamus: 'Kamus',
    aturan: 'Aturan',
    galeri: 'Galeri kegagalan',
    dokumen: 'Dokumen',
  },
  navHint: {
    kupas: 'Kupas satu kata, langkah demi langkah',
    kandidat: 'Semua pemenggalan yang mungkin, bukan cuma yang dipilih',
    kamus: 'Sunting daftar kata dasarnya, lihat jawabannya berubah',
    aturan: 'Daftar aturan lengkap beserta sumbernya',
    galeri: 'Kata-kata yang dikupas keliru, dan sebabnya',
    dokumen: 'Tempel satu paragraf, lihat kata dasar tiap kata',
  },
  navGroup: { mulai: 'Mulai dari sini', dalam: 'Gali lebih dalam' },

  hero: {
    eyebrow: 'Alat belajar · algoritma Nazief & Adriani',
    title: 'Lihat satu kata Indonesia dikupas sampai ke kata dasarnya.',
    lead: 'Mesin pencari dan program pengolah bahasa memotong imbuhan lebih dulu, supaya “mempelajari”, “pelajaran”, dan “belajar” dikenali sebagai satu kata yang sama: ajar. Biasanya proses itu tertutup — kata masuk, hasil keluar. Alat ini membukanya potongan demi potongan, termasuk ketika hasilnya keliru.',
    primary: 'Coba satu kata',
    secondary: 'Kenapa ini perlu dibuka',
  },

  demo: {
    title: 'Contohnya begini',
    lead: 'Satu kata berimbuhan, dikupas dari luar ke dalam sampai tersisa bentuk dasarnya.',
    inputLabel: 'kata berimbuhan',
    outputLabel: 'kata dasar',
    caption:
      'Yang abu-abu adalah imbuhan yang sudah dilepas. Yang merah adalah jawaban akhirnya. Di halaman Kupas, setiap potongan itu punya barisnya sendiri — lengkap dengan aturan yang dipakai.',
    cta: 'Jalankan sendiri, langkah demi langkah',
  },

  why: {
    title: 'Kenapa perlu dibuka',
    points: [
      {
        title: 'Kalau keliru, kekeliruannya tidak kelihatan',
        body: 'Hasil yang salah tetap berupa untaian huruf yang wajar. Tanpa melihat aturan mana yang berlaku dan kamus mana yang cocok, jawaban salah dan jawaban benar sama-sama meyakinkan.',
      },
      {
        title: 'Jawabannya ikut kamus, bukan cuma ikut aturan',
        body: 'Algoritma ini mengecek daftar kata dasar hampir di setiap langkah. Ganti daftarnya, jawabannya ikut berubah. Di sini daftar itu terbuka dan bisa Anda sunting sendiri — cara tercepat memahaminya adalah dengan sengaja merusaknya.',
      },
      {
        title: 'Sering ada lebih dari satu jawaban yang benar',
        body: '“Beruang” bisa dibaca ber- + uang, bisa juga memang kata dasar beruang. Aturan sehalus apa pun tidak bisa memutuskannya. Algoritma memilih satu lalu diam; di sini semua kemungkinannya ditampilkan sekaligus.',
      },
    ],
  },

  legend: {
    title: 'Arti warnanya',
    pen: 'huruf yang masih diperiksa',
    pencil: 'imbuhan yang sudah lepas, atau percobaan yang dibatalkan',
    highlight: 'cocok dengan kamus',
    teacher: 'kata dasar akhir — atau tanda bahwa jawabannya lebih dari satu',
  },

  glosariumLabel: 'Istilah',
  glosarium: {
    awalan: 'Imbuhan di depan kata: me-, ber-, pe-, di-, ter-, ke-, se-.',
    akhiran: 'Imbuhan di belakang kata: -kan, -an, -i, -nya, -lah.',
    imbuhan: 'Potongan yang ditempelkan pada kata dasar untuk mengubah maknanya.',
    kataDasar: 'Bentuk kata sebelum diberi imbuhan apa pun — “ajar” dari “mempelajari”.',
    peluruhan:
      'Huruf yang luluh ketika awalan menempel, lalu perlu dikembalikan. “Menyapu” berasal dari “sapu”, bukan “nyapu” — huruf s-nya luluh jadi ny.',
    konfiks: 'Sepasang awalan dan akhiran yang datang bersamaan, misalnya per-…-an.',
  },

  traceIntro:
    'Ketik satu kata berimbuhan. Di bawahnya, setiap langkah yang benar-benar dijalankan algoritma — termasuk langkah yang kemudian dibatalkan, karena pencariannya sendiri yang ingin diperlihatkan di sini.',
  examplesLabel: 'Coba kata ini',
  examples: [
    { kata: 'mempelajari', alasan: 'awalan dan akhiran sekaligus' },
    { kata: 'menyapu', alasan: 'huruf yang luluh, lalu dikembalikan' },
    { kata: 'beruang', alasan: 'dua jawaban sama-sama masuk akal' },
    { kata: 'perusakan', alasan: 'sepasang konfiks' },
    { kata: 'mengupas', alasan: 'nama alat ini — dan ia memilih yang keliru' },
    { kata: 'terpercaya', alasan: 'algoritma menyerah, kata dikembalikan utuh' },
  ],

  wordLabel: 'Kata',
  wordPlaceholder: 'misalnya: mempelajari',
  wordSubmit: 'Kupas',
  variantLabel: 'Varian aturan',
  resultLabel: 'Kata dasar',
  notFound: 'Tidak ditemukan di kamus — kata dikembalikan apa adanya.',
  ambiguous: 'Jawabannya lebih dari satu',
  ambiguousLead:
    'Kata ini punya lebih dari satu kemungkinan kata dasar. Algoritma memilih salah satu.',
  kegagalan: {
    title: 'Algoritmanya jalan — kamusnya yang kurang',
    lead: 'Imbuhan berhasil dilepas dan algoritma sampai ke “{kata}”, lalu membuangnya: kata itu tidak ada di kamus ini. Jadi yang gagal bukan aturannya, melainkan daftar kata dasarnya.',
    triedLabel: 'Bentuk yang sempat dicoba dan tidak ketemu',
    add: 'tambahkan ke kamus',
    added: 'sudah ditambahkan',
    note: 'Tambahkan salah satunya, lalu lihat jawabannya berubah seketika. Itulah maksudnya: hasil algoritma ini bergantung pada kamus sama besarnya dengan pada aturannya. Belum tentu semua bentuk di atas adalah kata dasar yang sah — Anda yang menentukan.',
  },
  stepsLabel: 'Langkah',
  stepsHint: 'Arahkan kursor ke satu baris untuk melihat kata pada langkah itu.',
  abandoned: 'dibatalkan',
  lookup: 'Cek kamus',
  lookupHit: 'ada di kamus',
  lookupMiss: 'tidak ada di kamus',

  player: {
    first: 'Ke langkah pertama',
    prev: 'Langkah sebelumnya',
    play: 'Putar dari awal',
    pause: 'Jeda',
    next: 'Langkah berikutnya',
    last: 'Ke langkah terakhir',
    progress: 'Langkah ke',
  },

  dictionaryCount: '{n} kata dasar di kamus',
  dictionaryEdited: 'disunting',
  dictionaryLoading: 'memuat kamus lengkap…',

  disclaimer:
    'Proyek belajar pribadi yang mengikuti makalah aslinya. Bukan Sastrawi, dan tidak mengklaim hasil yang sama dengan Sastrawi.',
  unverifiedRule: 'Aturan ini belum diperiksa terhadap makalah sumber.',
  honesty: {
    title: 'Alat ini bisa salah, dan itu memang bagian dari isinya',
    body: 'Alat ini menerapkan makalah yang diterbitkan, bukan menyalin pustaka yang sudah ada. Perbedaan hasil dengan Sastrawi memang ada, dicatat, dan diterbitkan apa adanya alih-alih ditutupi. Untuk dipakai di produksi, gunakan Sastrawi.',
    link: 'Sastrawi — pustaka yang dipakai di produksi',
  },
}

const en: Copy = {
  tagline:
    'The Nazief & Adriani stemmer opened up: every rule that fired, every dictionary lookup, every backtrack — and every root the word could plausibly have.',
  brandName: 'Stemmer Visualizer',
  brandTagline: 'Opening up how Indonesian words are cut back to their roots',

  nav: {
    kupas: 'Trace',
    kandidat: 'Candidates',
    kamus: 'Dictionary',
    aturan: 'Rules',
    galeri: 'Failure gallery',
    dokumen: 'Document',
  },
  navHint: {
    kupas: 'Peel one word, step by step',
    kandidat: 'Every possible split, not just the chosen one',
    kamus: 'Edit the list of roots and watch the answer move',
    aturan: 'The full rule set with its citations',
    galeri: 'Words the algorithm gets wrong, and why',
    dokumen: 'Paste a paragraph, get a root for every word',
  },
  navGroup: { mulai: 'Start here', dalam: 'Go deeper' },

  hero: {
    eyebrow: 'A learning tool · the Nazief & Adriani algorithm',
    title: 'Watch an Indonesian word peeled back to its root.',
    lead: 'Search engines and language software strip affixes first, so that “mempelajari”, “pelajaran” and “belajar” are all recognised as the same word: ajar. Normally that happens behind a closed door — word in, answer out. This tool opens it one layer at a time, including the times it gets the answer wrong.',
    primary: 'Try a word',
    secondary: 'Why this needs opening',
  },

  demo: {
    title: 'It looks like this',
    lead: 'One affixed word, peeled from the outside in until only the root is left.',
    inputLabel: 'affixed word',
    outputLabel: 'root (kata dasar)',
    caption:
      'Grey is an affix that has come off. Red is the final answer. On the trace page every one of those cuts gets its own line, with the rule that made it.',
    cta: 'Run it yourself, step by step',
  },

  why: {
    title: 'Why this needs opening',
    points: [
      {
        title: 'When it is wrong, the wrongness is invisible',
        body: 'A bad result is still a plausible-looking string. Without seeing which rule fired and which dictionary lookup succeeded, a wrong answer and a right one are equally convincing.',
      },
      {
        title: 'The answer depends on the dictionary, not only the rules',
        body: 'The algorithm checks a list of roots at nearly every step. Swap the list and the answer changes. Here that list is visible and you can edit it — and the fastest way to understand it is to break it on purpose.',
      },
      {
        title: 'More than one answer is often correct',
        body: '“Beruang” reads as ber- + uang, or as the root beruang. No amount of rule refinement settles it. The algorithm picks one and says nothing; here they are all shown at once.',
      },
    ],
  },

  legend: {
    title: 'What the colours mean',
    pen: 'letters still under examination',
    pencil: 'an affix already removed, or an attempt that was abandoned',
    highlight: 'found in the dictionary',
    teacher: 'the final root — or the fact that there is more than one answer',
  },

  glosariumLabel: 'Terms',
  glosarium: {
    awalan: 'A prefix: me-, ber-, pe-, di-, ter-, ke-, se-.',
    akhiran: 'A suffix: -kan, -an, -i, -nya, -lah.',
    imbuhan: 'An affix — a piece attached to a root to change its meaning.',
    kataDasar: 'The root: the word before any affix was attached — “ajar” inside “mempelajari”.',
    peluruhan:
      'A letter dissolved by an attaching prefix, which then has to be restored. “Menyapu” comes from “sapu”, not “nyapu” — the s assimilated into ny.',
    konfiks: 'A prefix and suffix that arrive as a pair, such as per-…-an.',
  },

  traceIntro:
    'Type an affixed word. Below it, every step the algorithm actually took — including the ones it later undid, because the search being visible as a search is the point.',
  examplesLabel: 'Try one of these',
  examples: [
    { kata: 'mempelajari', alasan: 'a prefix and a suffix at once' },
    { kata: 'menyapu', alasan: 'an assimilated letter, then restored' },
    { kata: 'beruang', alasan: 'two answers, both defensible' },
    { kata: 'perusakan', alasan: 'a konfiks pair' },
    { kata: 'mengupas', alasan: 'the name of this tool — and it picks the wrong root' },
    { kata: 'terpercaya', alasan: 'the algorithm gives up and hands the word back' },
  ],

  wordLabel: 'Word',
  wordPlaceholder: 'e.g. mempelajari',
  wordSubmit: 'Peel it',
  variantLabel: 'Rule variant',
  resultLabel: 'Root (kata dasar)',
  notFound: 'Not in the dictionary — the word is returned unchanged.',
  ambiguous: 'More than one answer',
  ambiguousLead:
    'This word has more than one plausible root (kata dasar). The algorithm picks one of them.',
  kegagalan: {
    title: 'The algorithm worked — the dictionary came up short',
    lead: 'The affixes came off and the algorithm reached “{kata}”, then discarded it: that word is not in this dictionary. What failed is the list of roots, not the rules.',
    triedLabel: 'Forms it tried and did not find',
    add: 'add to dictionary',
    added: 'added',
    note: 'Add one and watch the answer change immediately. That is the point: this algorithm depends on its dictionary as much as on its rules. Not every form above is necessarily a legitimate root — that judgement is yours.',
  },
  stepsLabel: 'Steps',
  stepsHint: 'Hover a line to see the word as it stood at that step.',
  abandoned: 'abandoned',
  lookup: 'Dictionary lookup',
  lookupHit: 'in dictionary',
  lookupMiss: 'not in dictionary',

  player: {
    first: 'Go to the first step',
    prev: 'Previous step',
    play: 'Play from the start',
    pause: 'Pause',
    next: 'Next step',
    last: 'Go to the last step',
    progress: 'Step',
  },

  dictionaryCount: '{n} roots in the dictionary',
  dictionaryEdited: 'edited',
  dictionaryLoading: 'loading the full dictionary…',

  disclaimer:
    'A personal educational project implementing the published papers. Not Sastrawi, and no parity with Sastrawi is claimed.',
  unverifiedRule: 'This rule has not been checked against the source paper.',
  honesty: {
    title: 'This tool can be wrong, and that is part of what it is for',
    body: 'This tool implements the published papers rather than copying an existing library. Divergences from Sastrawi exist, are recorded, and are published rather than papered over. For production work, use Sastrawi.',
    link: 'Sastrawi — the production library',
  },
}

const COPY: Record<Locale, Copy> = { id, en }

export function getCopy(locale: Locale): Copy {
  return COPY[locale]
}
