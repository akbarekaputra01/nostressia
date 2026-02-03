import client from "./client";
import { apiResponseSchema, parseApiResponse } from "./contracts/apiResponse";
import { userResponseSchema } from "./contracts/authSchemas";
import { storageUploadSasSchema } from "./contracts/storageSchemas";

const MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const storageSasResponseSchema = apiResponseSchema(storageUploadSasSchema);
const userResponseApiSchema = apiResponseSchema(userResponseSchema);

export const requestUploadSas = async (file, folder = "uploads") => {
  const response = await client.post("/storage/sas/upload", {
    fileName: file.name,
    contentType: file.type,
    folder,
  });
  return parseApiResponse(storageSasResponseSchema, response.data);
};

export const uploadToAzure = async (file, folder = "uploads") => {
  if (!file) {
    throw new Error("No file selected.");
  }

  const sasPayload = await requestUploadSas(file, folder);
  const uploadUrl = sasPayload?.uploadUrl;

  if (!uploadUrl) {
    throw new Error("The upload URL is not available.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    if (uploadResponse.status === 401 || uploadResponse.status === 403) {
      throw new Error("Upload token expired or invalid. Please try again.");
    }
    throw new Error("Upload failed. Please try again.");
  }

  return sasPayload?.blobUrl;
};

export const saveProfilePictureUrl = async (profileImageUrl) => {
  // Save the profile image URL in the backend.
  const response = await client.put("/profile/picture", {
    profileImageUrl,
  });
  return parseApiResponse(userResponseApiSchema, response.data);
};

export const validateProfilePictureFile = (file) => {
  if (!file) {
    return { ok: false, message: "No file selected." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, message: "Only JPG, PNG, or WebP images are allowed." };
  }
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    return { ok: false, message: "The maximum file size is 2MB." };
  }
  return { ok: true };
};
