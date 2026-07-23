type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  data?: unknown;
  details?: unknown;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isApiErrorPayload(error)) return fallback;

  const payload = isApiErrorPayload(error.data) ? error.data : error;
  const nestedError = isApiErrorPayload(payload.error) ? payload.error : null;
  const details = Array.isArray(nestedError?.data)
    ? nestedError.data
    : Array.isArray(nestedError?.details)
      ? nestedError.details
      : [];

  const detailMessage = details.find(
    (detail): detail is { message: string } =>
      isApiErrorPayload(detail) && typeof detail.message === 'string'
  )?.message;

  if (detailMessage) return detailMessage;
  if (typeof nestedError?.message === 'string') return nestedError.message;
  if (typeof payload.error === 'string') return payload.error;
  if (typeof payload.message === 'string') return payload.message;

  return fallback;
}
