import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kupas — pengupas imbuhan bahasa Indonesia',
  description:
    'Algoritma Nazief & Adriani dibuka: setiap aturan yang berlaku, setiap pencarian kamus, setiap langkah yang dibatalkan — dan setiap kata dasar yang mungkin.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
