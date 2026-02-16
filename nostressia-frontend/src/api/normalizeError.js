const toErrorList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const extractMessage = ({ message, payload, status }) => {
  const detail = payload?.detail;
  if (typeof message === "string" && message.trim()) return message;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) return "Validation error";
  if (status) return `Request failed (HTTP ${status}).`;
  return "Request failed.";
};

export const normalizeApiError = ({ message, status, payload } = {}) => {
  const normalizedMessage = extractMessage({ message, payload, status });

  return {
    message: normalizedMessage,
    status: Number.isFinite(status) ? status : null,
    errors: toErrorList(payload?.errors || payload?.detail),
    payload: payload ?? null,
  };
};

export const createApiError = (input = {}) => {
  const normalized = normalizeApiError(input);
  const error = new Error(normalized.message);
  error.status = normalized.status;
  error.errors = normalized.errors;
  error.payload = normalized.payload;
  return error;
};
