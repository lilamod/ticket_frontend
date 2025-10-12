import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../lib/api';
import type { ProjectsState, Project, ProjectResponse } from '../types';

// Define raw API project shape to avoid 'any'
interface RawProject {
  _id?: string;
  id?: string;
  name?: string;
  createdAt?: string | Date;
}

export const fetchProjects = createAsyncThunk<
  ProjectResponse,
  void,
  { rejectValue: string }
>(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ list: RawProject[]; count: number }>('/project/list');  // Typed response
      if (!response.data || !Array.isArray(response.data.list)) {
        throw new Error('Invalid API response format');
      }
      // Transform raw projects to typed Project[] (assuming backend returns basic shape)
      const transformedList: Project[] = response.data.list.map((raw) => ({
        _id: raw._id || raw.id || '',
        name: raw.name || '',
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
      }));
      return { list: transformedList, count: response.data.count } as ProjectResponse;
    } catch (error: unknown) {
      console.error('Fetch projects error:', error);
      // Safely access error properties
      const err = error as Error;
      const message = err.message || 'Failed to fetch projects';
      return rejectWithValue(message);
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
      const response = await api.post<{ id: string; name: string; createdAt?: string }>('/project/create', { name });  // Typed response
      if (!response.data || !response.data.id) {
        throw new Error('Invalid create response');
      }
      // Transform raw response to typed Project
      const transformed: Project = {
        _id: response.data.id,
        name: response.data.name || name,
        createdAt: response.data.createdAt ? new Date(response.data.createdAt).toISOString() : undefined,
      };
      return transformed;
    } catch (error: unknown) {
      console.error('Create project error:', error);
      // Safely access error properties
      const err = error as Error;
      const message = err.message || 'Failed to create project';
      return rejectWithValue(message);
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