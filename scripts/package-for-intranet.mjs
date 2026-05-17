import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const version = pkg.version || '0.0.0'
const bundleName = `intra-welcome-app-${version}`
const releaseRoot = path.join(root, 'release')
const bundleDir = path.join(releaseRoot, bundleName)
const wwwDir = path.join(bundleDir, 'www')
const deployDir = path.join(bundleDir, 'deploy')

function run(command) {
  execSync(command, { cwd: root, stdio: 'inherit' })
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(from, to)
    } else {
      copyFile(from, to)
    }
  }
}

console.log('Building production bundle...')
run('npm run build')

if (fs.existsSync(bundleDir)) {
  fs.rmSync(bundleDir, { recursive: true, force: true })
}

fs.mkdirSync(wwwDir, { recursive: true })
copyDir(path.join(root, 'dist'), wwwDir)

fs.mkdirSync(deployDir, { recursive: true })
for (const file of [
  'nginx.conf',
  'nginx-docker.conf',
  'apache.htaccess',
  'Dockerfile',
  'docker-compose.yml',
]) {
  copyFile(path.join(root, 'deploy', file), path.join(deployDir, file))
}

const installText = `Intranet Welcome App — deployment package v${version}
============================================================

CONTENTS
  www/     Static site (copy to your web server document root)
  deploy/  Example configs for nginx, Apache, and Docker

OPTION 1 — nginx (recommended)
  1. Copy www/ to e.g. /var/www/intra-welcome
  2. Point server root at that folder
  3. Include deploy/nginx.conf in your server block

OPTION 2 — Apache
  1. Copy www/ to your document root
  2. Copy deploy/apache.htaccess to the same folder as index.html

OPTION 3 — Docker (on the intranet host)
  1. From the project root (with source), run:
       docker compose -f deploy/docker-compose.yml up -d --build
  2. Or use the Dockerfile in deploy/ with the built www/ copied into nginx

OPTION 4 — any static file host
  Serve the www/ folder. Ensure unknown paths fall back to index.html.

SUBDIRECTORY DEPLOYMENT
  If the app is not at the site root, set VITE_BASE_PATH before building, e.g.:
    VITE_BASE_PATH=/welcome/ npm run package:intranet

Built: ${new Date().toISOString()}
`

fs.writeFileSync(path.join(bundleDir, 'INSTALL.txt'), installText)

const archivePath = path.join(releaseRoot, `${bundleName}.tar.gz`)
if (fs.existsSync(archivePath)) {
  fs.unlinkSync(archivePath)
}

fs.mkdirSync(releaseRoot, { recursive: true })
run(`tar -czf "${archivePath}" -C "${releaseRoot}" "${bundleName}"`)

console.log('')
console.log(`Package ready:`)
console.log(`  Folder:  ${bundleDir}`)
console.log(`  Archive: ${archivePath}`)
