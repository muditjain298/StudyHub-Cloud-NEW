import axios from 'axios';

const API_URL = "/api/auth";

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

  const response = await axios.get(API_URL + 'folders', config);
  return response.data;
};

const createFolder = async (folderData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL + 'folders', folderData, config);
  return response.data;
};

const deleteFolder = async (folderId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + 'folders/' + folderId, config);
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

  const response = await axios.get(API_URL + 'files', config);
  return response.data;
};

const uploadFile = async (formData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  };

  const response = await axios.post(API_URL + 'files', formData, config);
  return response.data;
};

const uploadLink = async (linkData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL + 'files', linkData, config);
  return response.data;
};

const fetchMetadata = async (url, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL + 'files/metadata', { url }, config);
  return response.data;
};

const deleteFile = async (fileId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + 'files/' + fileId, config);
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
