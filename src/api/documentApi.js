import axiosClient from "./axiosClient";
import { extractErrorMessage } from "./errorMessages";

// Mirrors DocumentService.AllowedContentTypes / MaxFileSizeBytes on the API.
// The server re-validates both, this just gives faster feedback in the UI.
export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain" // .txt
];
export const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt";
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_LABEL = "10 MB";

// DocumentController.GetAll -> GET api/Document
// Returns List<DocumentResponseDto>: [{ id, title, originalFileName, contentType, fileSizeBytes, uploadedAt }]
export async function getDocuments() {
  const response = await axiosClient.get("/Document");
  return response.data;
}

// DocumentController.Upload -> POST api/Document/upload (multipart/form-data: file + optional title)
export async function uploadDocument({ file, title, onProgress }) {
  const formData = new FormData();
  formData.append("file", file);
  if (title && title.trim()) formData.append("title", title.trim());

  const response = await axiosClient.post("/Document/upload", formData, {
    // The axios instance defaults to application/json, which would make axios convert
    // this FormData into a JSON string. Request multipart instead and let the browser
    // fill in the boundary itself.
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
    }
  });

  return response.data; // DocumentResponseDto
}

// DocumentController.Delete -> DELETE api/Document/{id} -> 204
export async function deleteDocument(id) {
  const response = await axiosClient.delete(`/Document/${id}`);
  return response.data;
}

// DocumentController.Download -> GET api/Document/{id}/download, then hand the blob to the browser
export async function downloadDocument(doc) {
  const response = await axiosClient.get(`/Document/${doc.id}/download`, {
    responseType: "blob"
  });

  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = doc.originalFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// A 401 on /Document/* means the JWT is missing or expired - not bad credentials.
export function extractDocumentErrorMessage(error) {
  return extractErrorMessage(error, {
    unauthorizedMessage: "Your session has expired. Please sign in again."
  });
}
