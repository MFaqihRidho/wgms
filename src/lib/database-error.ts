type SupabaseLikeError = {
  code?: string
  message?: string
}

export function normalizeDatabaseError(error: unknown): Error {
  if (isSupabaseLikeError(error) && error.code === 'PGRST205') {
    return new Error(
      'WGMS database tables are missing in this Supabase project. Run supabase/schema.sql in the Supabase SQL editor, then reload the app.',
    )
  }

  if (isSupabaseLikeError(error) && error.message) {
    return new Error(error.message)
  }

  return error instanceof Error ? error : new Error('Database request failed.')
}

function isSupabaseLikeError(error: unknown): error is SupabaseLikeError {
  return Boolean(error && typeof error === 'object' && ('code' in error || 'message' in error))
}
