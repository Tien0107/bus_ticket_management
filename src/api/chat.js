import axiosClient from "./axiosClient";

export const getChatBoxes = (params = {}) => {
  return axiosClient.get("/chat/box", { params });
};

export const createChatBox = (data) => {
  return axiosClient.post("/chat/box", data);
};

export const getChatMessages = (boxId, params = {}) => {
  return axiosClient.get(`/chat/box/${boxId}/message`, { params });
};

export const sendChatMessage = (boxId, data) => {
  return axiosClient.post(`/chat/box/${boxId}/message`, data);
};

export const markChatBoxRead = (boxId) => {
  return axiosClient.put(`/chat/box/${boxId}/unread-count`);
};

export const recallChatMessage = (boxId, messageId) => {
  return axiosClient.put(`/chat/box/${boxId}/message/${messageId}`, {});
};

export const getChatUploadPresigned = (boxId) => {
  return axiosClient.get("/file/upload/auth/presigned", {
    params: {
      folder: "chat",
      id: String(boxId),
    },
  });
};

export const uploadChatFile = async (file, presignedConfig) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", presignedConfig.apiKey);
  formData.append("timestamp", presignedConfig.timestamp);
  formData.append("signature", presignedConfig.signature);

  if (presignedConfig.folder) {
    formData.append("folder", presignedConfig.folder);
  }

  const response = await fetch(presignedConfig.uploadUrl, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "Upload ảnh thất bại");
  }

  return data;
};
