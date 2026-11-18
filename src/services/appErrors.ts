export const APP_ERROR_EVENT = 'borewell:app-error';

export function reportAppError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  window.dispatchEvent(new CustomEvent(APP_ERROR_EVENT, { detail: message }));
}
