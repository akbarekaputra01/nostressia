const API_URL = "https://mfv81z.h.filess.io/api";

export async function getAllMotivations() {
  const res = await fetch(`${API_URL}/motivations`);
  return res.json();
}

export async function createMotivation(data) {
  const res = await fetch(`${API_URL}/motivations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
