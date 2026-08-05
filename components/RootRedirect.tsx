'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEFAULT_LOCALE } from '@/lib/i18n'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function RootRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/${DEFAULT_LOCALE}/`)
  }, [router])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-8">
      <noscript>
        <meta httpEquiv="refresh" content={`0; url=${basePath}/${DEFAULT_LOCALE}/`} />
      </noscript>
      <p className="text-pencil">
        <Link className="underline decoration-ruleLine" href={`/${DEFAULT_LOCALE}/`}>
          Lanjut ke Kupas
        </Link>
      </p>
    </main>
  )
}
