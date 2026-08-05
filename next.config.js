/**
 * Static export for GitHub Pages. `basePath` must match the repository name —
 * PRD §11. Override with BASE_PATH when the repository is renamed or when
 * serving from a custom domain (BASE_PATH="").
 */
const basePath = process.env.BASE_PATH ?? '/stemmer-visualizer'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

module.exports = nextConfig
