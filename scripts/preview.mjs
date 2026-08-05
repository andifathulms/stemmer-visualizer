/**
 * Serve ./out under the production basePath, so what you click is what Pages
 * will serve — PRD §11. Deliberately dependency-free.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const PORT = Number(process.env.PORT ?? 4173)
const BASE_PATH = process.env.BASE_PATH ?? '/stemmer-visualizer'
const ROOT = new URL('../out/', import.meta.url).pathname

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

async function resolve(pathname) {
  const candidates = [pathname, join(pathname, 'index.html'), `${pathname}.html`]
  for (const candidate of candidates) {
    const file = join(ROOT, normalize(candidate))
    if (!file.startsWith(ROOT)) continue
    try {
      if ((await stat(file)).isFile()) return file
    } catch {
      /* try the next candidate */
    }
  }
  return null
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname === '/' || url.pathname === BASE_PATH) {
    res.writeHead(302, { Location: `${BASE_PATH}/` })
    return res.end()
  }
  if (!url.pathname.startsWith(BASE_PATH)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    return res.end(`Not found. The site is served under ${BASE_PATH}/`)
  }

  const file = await resolve(url.pathname.slice(BASE_PATH.length) || '/')
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end('<h1>404</h1>')
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(PORT, () => {
  console.log(`kupas → http://localhost:${PORT}${BASE_PATH}/`)
})
