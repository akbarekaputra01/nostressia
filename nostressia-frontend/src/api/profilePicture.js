import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";

import client, { unwrapResponse } from "./client";

const MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024;

export const requestProfilePictureSas = async (file) => {
  // Request a short-lived SAS token so the browser never holds the storage key.
  const response = await client.post("/profile/picture/sas", {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
  return unwrapResponse(response);
};

const sanitizeFilename = (fileName) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

export const uploadProfilePictureToAzure = async (
  file,
  { sasUrl, containerName, blobName } = {}
) => {
  if (!sasUrl) {
    throw new Error("SAS URL is not available for upload.");
  }

  if (containerName) {
    const blobServiceClient = new BlobServiceClient(sasUrl);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const safeName = blobName || `${Date.now()}-${sanitizeFilename(file.name)}`;
    const blobClient = containerClient.getBlockBlobClient(safeName);

    await blobClient.uploadBrowserData(file, {
      blobHTTPHeaders: { blobContentType: file.type },
    });

    return { url: blobClient.url, blobName: safeName };
  }

  // Upload directly to Azure Blob using a single-blob SAS URL.
  const blobClient = new BlockBlobClient(sasUrl);
  await blobClient.uploadBrowserData(file, {
    blobHTTPHeaders: { blobContentType: file.type },
  });

  return { url: blobClient.url };
};

export const saveProfilePictureUrl = async (profileImageUrl) => {
  // Save the profile image URL in the backend.
  const response = await client.put("/profile/picture", {
    profileImageUrl,
  });
  return unwrapResponse(response);
};

export const validateProfilePictureFile = (file) => {
  if (!file) {
    return { ok: false, message: "No file selected." };
  }
  if (!file.type?.startsWith("image/")) {
    return { ok: false, message: "The file must be an image." };
  }
  if (file.size > MAX_PROFILE_PICTURE_SIZE) {
    return { ok: false, message: "The maximum file size is 2MB." };
  }
  return { ok: true };
};
