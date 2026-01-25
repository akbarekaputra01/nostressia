import { BlockBlobClient } from "@azure/storage-blob";

import client, { unwrapResponse } from "./client";

const MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024;

export const requestProfilePictureSas = async (file) => {
  // Minta SAS pendek dari backend supaya frontend tidak pegang key.
  const response = await client.post("/profile/picture/sas", {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
  return unwrapResponse(response);
};

export const uploadProfilePictureToAzure = async (file, sasUrl) => {
  // Upload langsung ke Azure Blob via SAS URL.
  const blobClient = new BlockBlobClient(sasUrl);
  await blobClient.uploadBrowserData(file, {
    blobHTTPHeaders: { blobContentType: file.type },
  });
};

export const saveProfilePictureUrl = async (profileImageUrl) => {
  // Simpan URL foto profil ke database via backend.
  const response = await client.put("/profile/picture", {
    profileImageUrl,
  });
  return unwrapResponse(response);
};

export const validateProfilePictureFile = (file) => {
  if (!file) {
    return { ok: false, message: "File belum dipilih." };
  }
  if (!file.type?.startsWith("image/")) {
    return { ok: false, message: "File harus berupa gambar." };
  }
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    return { ok: false, message: "Ukuran file maksimal 2MB." };
  }
  return { ok: true };
};
