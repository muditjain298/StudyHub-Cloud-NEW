import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import fileService from './fileService';
import { account } from '../../lib/appwrite';
import { setUser } from '../auth/authSlice';

const initialState = {
  folders: [],
  files: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Helper: Redux mein user na mile to Appwrite se fallback le aao
// (App.jsx ka race-condition wala purana bug #3 dubara na ho, isliye har thunk khud-nirbhar hai)
const getUserId = async (thunkAPI) => {
  let userId = thunkAPI.getState().auth.user?.$id;
  if (!userId) {
    const me = await account.get();
    thunkAPI.dispatch(setUser(me));
    userId = me.$id;
  }
  return userId;
};

export const fetchFolders = createAsyncThunk(
  'files/fetchFolders',
  async ({ section, parentId = null } = {}, thunkAPI) => {
    try {
      const userId = await getUserId(thunkAPI);
      return await fileService.getFolders(userId, section, parentId);
    } catch (error) {
      console.error('[fetchFolders]', error?.code, error?.type, error?.message);
      return thunkAPI.rejectWithValue(error?.message || 'Failed to load folders');
    }
  }
);

export const createNewFolder = createAsyncThunk(
  'files/createFolder',
  async (folderData, thunkAPI) => {
    try {
      const userId = await getUserId(thunkAPI);
      return await fileService.createFolder({ ...folderData, userId });
    } catch (error) {
      console.error('[createNewFolder]', error?.code, error?.type, error?.message);
      return thunkAPI.rejectWithValue(error?.message || 'Failed to create folder');
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

export const toggleFolderStar = createAsyncThunk(
  'files/toggleFolderStar',
  async ({ id, isStarred }, thunkAPI) => {
    try {
      return await fileService.updateFolder(id, { isStarred });
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
      return await fileService.getFiles(folderId, section);
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
      // BUG FIX: formData ek real FormData object hai — { ...formData } spread
      // karne se uska .get() method chala jaata hai aur plain {} ban jaata hai.
      // Isliye userId ko FormData mein hi append karo, spread mat karo.
      if (!formData.get('userId')) {
        const userId = await getUserId(thunkAPI);
        formData.append('userId', userId);
      }
      return await fileService.uploadFile(formData);
    } catch (error) {
      console.error('[uploadNewFile] Full Error:', error);
      console.error('[uploadNewFile] Code:', error?.code);
      console.error('[uploadNewFile] Type:', error?.type);
      console.error('[uploadNewFile] Message:', error?.message);
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const uploadNewLink = createAsyncThunk(
  'files/uploadLink',
  async (linkData, thunkAPI) => {
    try {
      const userId = linkData.userId || (await getUserId(thunkAPI));
      return await fileService.uploadLink({ ...linkData, userId });
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

export const toggleFileStar = createAsyncThunk(
  'files/toggleFileStar',
  async ({ id, isStarred }, thunkAPI) => {
    try {
      return await fileService.updateFile(id, { isStarred });
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
      .addCase(toggleFolderStar.fulfilled, (state, action) => {
        const folder = state.folders.find((item) => item.$id === action.payload.$id);
        if (folder) folder.isStarred = action.payload.isStarred;
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
      })
      .addCase(toggleFileStar.fulfilled, (state, action) => {
        const file = state.files.find((item) => item.$id === action.payload.$id);
        if (file) file.isStarred = action.payload.isStarred;
      });
  },
});

export const { resetFilesState } = fileSlice.actions;
export default fileSlice.reducer;