export const parseJsonResponse = async (res) => {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const detail = payload?.detail || payload?.message;
    const error = new Error(
      detail ? String(detail) : `Request failed (HTTP ${res.status}).`
    );
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};
