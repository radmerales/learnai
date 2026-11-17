/**
 * Convert thrown values into a message safe to show in the UI.
 * `unknown` is TypeScript's way of forcing us to check a value before using it.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
}
