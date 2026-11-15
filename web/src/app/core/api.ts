import { HttpErrorResponse } from '@angular/common/http';

/** Every API route lives under this prefix. In development, the dev server proxies `/api`. */
export const API_BASE = '/api/v1';

/** Nest's standard error body. */
interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * A short, user-facing message for a failed API call. `byStatus` overrides the message for
 * specific status codes; otherwise the API's own message is used, then a generic one.
 */
export function errorMessage(err: unknown, byStatus: Partial<Record<number, string>> = {}): string {
  if (!(err instanceof HttpErrorResponse)) return 'Something went wrong. Try again.';
  const override = byStatus[err.status];
  if (override) return override;
  if (err.status === 0)
    return 'Can’t reach crumbtrail right now. Check your connection and try again.';
  if (err.status === 429) return 'Too many tries. Wait a minute, then try again.';
  const message = apiMessages(err)[0];
  if (message && err.status < 500) return capitalize(message);
  return 'Something went wrong on our end. Try again.';
}

/** The API's error messages, as a list. */
export function apiMessages(err: HttpErrorResponse): string[] {
  const body = err.error as Partial<ApiErrorBody> | null;
  const message = body?.message;
  if (Array.isArray(message)) return message.filter((m) => typeof m === 'string');
  return typeof message === 'string' ? [message] : [];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
