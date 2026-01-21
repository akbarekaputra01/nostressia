export const readAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt");

export const persistAuthToken = (token) => {
  if (!token) return;
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("jwt", token);
};
