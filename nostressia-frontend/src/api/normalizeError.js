const toErrorList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const prettifyCode = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const normalized = value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const extractDetailMessage = (detail) => {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first?.msg === "string" && first.msg.trim()) {
      return "Validation error";
    }
  }
  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string" && detail.message.trim()) return detail.message;
    if (typeof detail.code === "string" && detail.code.trim()) return prettifyCode(detail.code);
  }
  return "";
};

const extractMessage = ({ message, payload, status }) => {
  if (typeof message === "string" && message.trim()) return message;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;

  const detailMessage = extractDetailMessage(payload?.detail);
  if (detailMessage) return detailMessage;

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
