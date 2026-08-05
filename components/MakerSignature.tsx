/**
 * The maker's mark — a quiet author credit, on every page via SiteFooter.
 *
 * Deliberately *not* merged with the disclaimer it sits opposite. That line is
 * the project's legal and framing note ("not Sastrawi, no parity claimed") and
 * this one is a personal signature; running them together would make the
 * credit read as part of the legal text and the legal text read as decoration.
 * They share the footer's existing bottom seam rather than earning a second
 * divider — one rule across the foot of the page, two things sitting on it.
 *
 * Every token here already exists in the design system: `pencil` for muted
 * text, `pen` for the brighter name, `ruleLine`/`pen` for the underline, and
 * the same `highlight/20` hover wash the `.tombol` and `.contoh` controls use.
 * Nothing red — invariant 14 keeps teacher's red for the final root and for
 * genuine ambiguity, so it is not available as a UI accent.
 */

/** Identity and links, in one place, so this is trivial to reuse or update. */
const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: 'https://andifathulms.github.io/en/',
} as const

type IconName = 'portfolio' | 'github' | 'linkedin' | 'instagram'

const LINKS: readonly { readonly label: string; readonly href: string; readonly icon: IconName }[] =
  [
    { label: 'Portfolio', href: MAKER.portfolio, icon: 'portfolio' },
    { label: 'GitHub', href: 'https://github.com/andifathulms', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andifathulmukminin/', icon: 'linkedin' },
    { label: 'Instagram', href: 'https://www.instagram.com/andifathulms/', icon: 'instagram' },
  ]

/**
 * 18px, `currentColor`, so the icons inherit the muted/bright transition from
 * the link rather than carrying colours of their own. `aria-hidden` because the
 * anchor already carries the platform name as its accessible name.
 */
function Icon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
  } as const

  switch (name) {
    case 'portfolio':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
        </svg>
      )
    case 'github':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58l-.01-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...common} fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.65h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4V9z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    default: {
      const never: never = name
      return never
    }
  }
}

export function MakerSignature() {
  // Build time, not request time: this is a static export, so the year is
  // stamped when the site is generated.
  const year = new Date().getFullYear()

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <p className="font-ui text-xs leading-relaxed text-pencil">
        Designed &amp; built by{' '}
        <a
          className="text-pen underline decoration-ruleLine underline-offset-4 transition-colors hover:decoration-pen"
          href={MAKER.portfolio}
          rel="noopener noreferrer"
          target="_blank"
        >
          {MAKER.name}
        </a>{' '}
        <span aria-hidden>·</span>{' '}
        {/* The year in the mono face, tabular, like every other figure here. */}
        <span className="font-word tabular-nums">© {year}</span>
      </p>

      <ul className="-mx-1.5 flex items-center gap-0.5">
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              className="inline-flex rounded-sm p-1.5 text-pencil transition-colors hover:bg-highlight/20 hover:text-pen"
              href={link.href}
              aria-label={link.label}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon name={link.icon} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
