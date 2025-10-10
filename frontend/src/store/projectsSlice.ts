import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../lib/api';
import type { ProjectsState, Project, ProjectResponse } from '../types';

export const fetchProjects = createAsyncThunk<
  ProjectResponse,
  void,
  { rejectValue: string }
>(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('http://localhost:4000/api/project/list');
      if (!response.data || !Array.isArray(response.data.list)) {
        throw new Error('Invalid API response format');
      }
      return response.data as ProjectResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch projects');
    }
  }
);

export const createProject = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>(
  'projects/createProject',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('http://localhost:4000/api/project/create', { name });
      if (!response.data || !response.data.id) {
        throw new Error('Invalid create response');
      }
      return response.data as Project;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create project');
    }
  }
);

const initialState: ProjectsState = {
  list: [],
  count: 0,
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetProjects: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<ProjectResponse>) => {
        state.loading = false;
        state.list = action.payload.list;
        state.count = action.payload.count;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch projects';
      })
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.list.push(action.payload);
        state.count += 1;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create project';
      });
  },
});

export const { clearError, resetProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
