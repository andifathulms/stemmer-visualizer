import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { DocumentMode } from '@/components/document/DocumentMode'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function DokumenPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <DocumentMode copy={getCopy(params.locale)} locale={params.locale} />
}
