import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { FailureGallery } from '@/components/gallery/FailureGallery'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function GaleriPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <FailureGallery copy={getCopy(params.locale)} locale={params.locale} />
}
