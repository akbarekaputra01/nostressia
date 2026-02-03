import client, { unwrapResponse } from "../api/client";

export const login = async (payload) => {
  const response = await client.post("/auth/login", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};

export const register = async (payload) => {
  const response = await client.post("/auth/register", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};

export const verifyOtp = async (payload) => {
  const response = await client.post("/auth/verify-otp", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};

export const forgotPassword = async (payload) => {
  const response = await client.post("/auth/forgot-password", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};

export const resetPasswordConfirm = async (payload) => {
  const response = await client.post("/auth/reset-password-confirm", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};

export const verifyResetPasswordOtp = async (payload) => {
  const response = await client.post("/auth/reset-password-verify", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};

export const getProfile = async () => {
  const response = await client.get("/auth/me");
  return unwrapResponse(response);
};

export const updateProfile = async (payload) => {
  const response = await client.put("/auth/me", payload);
  return unwrapResponse(response);
};

export const uploadProfileAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post("/auth/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapResponse(response);
};

export const changePassword = async (payload) => {
  const response = await client.put("/auth/change-password", payload);
  return unwrapResponse(response);
};

export const verifyCurrentPassword = async (payload) => {
  const response = await client.post("/auth/verify-current-password", payload);
  return unwrapResponse(response);
};

export const adminLogin = async (payload) => {
  const response = await client.post("/auth/admin/login", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return unwrapResponse(response);
};
