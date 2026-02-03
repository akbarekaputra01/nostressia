import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import {
  adminLoginResponseSchema,
  emailResponseSchema,
  userResponseSchema,
  userTokenResponseSchema,
} from "../api/contracts/authSchemas";
import { z } from "zod";

const emptyResponseSchema = apiResponseSchema(z.null());
const emailApiResponseSchema = apiResponseSchema(emailResponseSchema);
const userTokenApiResponseSchema = apiResponseSchema(userTokenResponseSchema);
const userApiResponseSchema = apiResponseSchema(userResponseSchema);
const adminLoginApiResponseSchema = apiResponseSchema(adminLoginResponseSchema);

export const login = async (payload) => {
  const response = await client.post("/auth/login", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(userTokenApiResponseSchema, response.data);
};

export const register = async (payload) => {
  const response = await client.post("/auth/register", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(emailApiResponseSchema, response.data);
};

export const verifyOtp = async (payload) => {
  const response = await client.post("/auth/verify-otp", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const forgotPassword = async (payload) => {
  const response = await client.post("/auth/forgot-password", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const resetPasswordConfirm = async (payload) => {
  const response = await client.post("/auth/reset-password-confirm", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const verifyResetPasswordOtp = async (payload) => {
  const response = await client.post("/auth/reset-password-verify", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const getProfile = async () => {
  const response = await client.get("/auth/me");
  return parseApiResponse(userApiResponseSchema, response.data);
};

export const updateProfile = async (payload) => {
  const response = await client.put("/auth/me", payload);
  return parseApiResponse(userApiResponseSchema, response.data);
};

export const uploadProfileAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post("/auth/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return parseApiResponse(userApiResponseSchema, response.data);
};

export const changePassword = async (payload) => {
  const response = await client.put("/auth/change-password", payload);
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const verifyCurrentPassword = async (payload) => {
  const response = await client.post("/auth/verify-current-password", payload);
  return parseApiResponse(emptyResponseSchema, response.data);
};

export const adminLogin = async (payload) => {
  const response = await client.post("/auth/admin/login", payload, {
    authScope: false,
    skipAuthRedirect: true,
  });
  return parseApiResponse(adminLoginApiResponseSchema, response.data);
};
