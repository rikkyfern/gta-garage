import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const args = new Set(process.argv.slice(2))
const shouldSeed = args.has('--seed')
const confirmed = args.has('--yes')
const forceProduction = args.has('--force-production')

function readEnvFile() {
  if (!existsSync('.env')) return {}

  return readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return values

      const separator = trimmed.indexOf('=')
      if (separator === -1) return values

      const key = trimmed.slice(0, separator).trim()
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^"|"$/g, '')
        .replace(/^'|'$/g, '')

      values[key] = value
      return values
    }, {})
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const envFile = readEnvFile()
const databaseUrl = process.env.DATABASE_URL ?? envFile.DATABASE_URL ?? ''
const nodeEnv = process.env.NODE_ENV ?? envFile.NODE_ENV ?? 'development'
const isLocalDatabase =
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1') ||
  databaseUrl.includes('host.docker.internal')

if (!confirmed) {
  console.error('Refusing to reset database without --yes.')
  process.exit(1)
}

if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Add it to .env before resetting the database.')
  process.exit(1)
}

if ((nodeEnv === 'production' || !isLocalDatabase) && !forceProduction) {
  console.error('Refusing to wipe a non-local or production database.')
  console.error('For a real production reset, run manually:')
  console.error('node scripts/db-reset.mjs --seed --yes --force-production')
  process.exit(1)
}

console.log('Resetting database with Prisma migrations...')
run('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed'])

if (shouldSeed) {
  console.log('Seeding demo data...')
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'db:seed'])
}

console.log(shouldSeed ? 'Database wiped and seeded.' : 'Database wiped.')
