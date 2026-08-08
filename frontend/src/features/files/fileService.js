import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL; 
const FOLDER_URL = `${API_BASE}/api/folders`; 
const FILE_URL = `${API_BASE}/api/files`;
const getFolders = async (section, parentId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      section,
      parent: parentId || '',
    }
  };

 const response = await axios.get(FOLDER_URL, config);
  return response.data;
};

const createFolder = async (folderData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
const response = await axios.post(FOLDER_URL, folderData, config);
  return response.data;
};

const deleteFolder = async (folderId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
const response = await axios.delete(`${FOLDER_URL}/${folderId}`, config);
  return response.data;
};

const getFiles = async (section, folderId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      section,
      folder: folderId || '',
    }
  };

const response = await axios.get(FILE_URL, config);
  return response.data;
};

const uploadFile = async (formData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  };
const response = await axios.post(FILE_URL, formData, config);
  return response.data;
};

const uploadLink = async (linkData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

const response = await axios.post(FILE_URL, linkData, config);
  return response.data;
};

const fetchMetadata = async (url, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

 const response = await axios.post(`${FILE_URL}/metadata`, { url }, config);
  return response.data;
};

const deleteFile = async (fileId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

const response = await axios.delete(`${FILE_URL}/${fileId}`, config);
  return response.data;
};

const fileService = {
  getFolders,
  createFolder,
  deleteFolder,
  getFiles,
  uploadFile,
  uploadLink,
  fetchMetadata,
  deleteFile
};

export default fileService;
