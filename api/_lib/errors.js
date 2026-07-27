export class ApiError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function usableStatus(value) {
  return Number.isInteger(value) && value >= 400 && value < 600 ? value : 500;
}

export function publicError(error) {
  const status = usableStatus(error?.status);
  const safeMessage = status < 500
    ? (error?.message || 'Request could not be completed.')
    : 'An internal error occurred.';

  return {
    status,
    body: {
      error: safeMessage,
      ...(status < 500 && error?.details ? { details: error.details } : {}),
    },
  };
}
