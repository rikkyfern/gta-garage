export function getPrismaErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : null
}

export function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()

  return (
    error.name === 'PrismaClientInitializationError' ||
    message.includes("can't reach database server") ||
    message.includes('connection refused') ||
    message.includes('econnrefused')
  )
}

export function isDatabaseSchemaOutOfDate(error: unknown) {
  const code = getPrismaErrorCode(error)
  if (code === 'P2021' || code === 'P2022') return true

  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return message.includes('does not exist in the current database')
}
