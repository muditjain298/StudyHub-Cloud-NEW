import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import fileService from './fileService';

const initialState = {
  folders: [],
  files: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const fetchFolders = createAsyncThunk(
  'files/fetchFolders',
  async (_, thunkAPI) => {
    try {
      const user = thunkAPI.getState().auth.user;
      
      // Safety check: Agar user null hai toh yahin rok do
      if (!user || !user.$id) {
        return thunkAPI.rejectWithValue("User not authenticated. Please login again.");
      }

      return await fileService.getFolders(user.$id);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createNewFolder = createAsyncThunk(
  'files/createFolder',
  async (folderData, thunkAPI) => {
    try {
      const user = thunkAPI.getState().auth.user;
      
      // Safety check yahan bhi lagao
      if (!user || !user.$id) {
        return thunkAPI.rejectWithValue("User not authenticated. Please login again.");
      }

      const dataWithUser = { ...folderData, userId: user.$id };
      return await fileService.createFolder(dataWithUser);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeFolder = createAsyncThunk(
  'files/deleteFolder',
  async (id, thunkAPI) => {
    try {
      await fileService.deleteFolder(id);
      return id; // Sirf id return kar rahe hain taaki state update ho sake
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async ({ section, folderId }, thunkAPI) => {
    try {
      return await fileService.getFiles(folderId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const uploadNewFile = createAsyncThunk(
  'files/uploadFile',
  async (formData, thunkAPI) => {
    try {
      return await fileService.uploadFile(formData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const uploadNewLink = createAsyncThunk(
  'files/uploadLink',
  async (linkData, thunkAPI) => {
    try {
      return await fileService.uploadLink(linkData);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const removeFile = createAsyncThunk(
  'files/deleteFile',
  async (id, thunkAPI) => {
    try {
      await fileService.deleteFile(id);
      return id;
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    resetFilesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createNewFolder.fulfilled, (state, action) => {
        state.folders.unshift(action.payload);
      })
      .addCase(removeFolder.fulfilled, (state, action) => {
        // Appwrite ki id '$id' hoti hai isliye '_id' ko replace kar diya
        state.folders = state.folders.filter((folder) => folder.$id !== action.payload);
      })
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(uploadNewFile.fulfilled, (state, action) => {
        if (action.payload) state.files.unshift(action.payload);
      })
      .addCase(uploadNewLink.fulfilled, (state, action) => {
        if (action.payload) state.files.unshift(action.payload);
      })
      .addCase(removeFile.fulfilled, (state, action) => {
        state.files = state.files.filter((file) => file.$id !== action.payload);
      });
  },
});

export const { resetFilesState } = fileSlice.actions;
export default fileSlice.reducer;