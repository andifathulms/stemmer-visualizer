import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { KupasProvider } from '@/components/app/KupasProvider'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const copy = getCopy(params.locale)

  return (
    <KupasProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader locale={params.locale} copy={copy} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-12">
          {children}
        </main>
        <SiteFooter copy={copy} />
      </div>
    </KupasProvider>
  )
}
