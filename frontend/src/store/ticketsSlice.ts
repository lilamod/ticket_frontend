import { createSlice, createAsyncThunk, PayloadAction, createAction } from '@reduxjs/toolkit';
import api from '../lib/api';
import { Ticket, ApiResponse, TicketStatus } from '../types';  
import { emitTicketUpdate } from '../lib/socket';

interface TicketsState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  tickets: [],
  loading: false,
  error: null,
};

// Define raw API ticket shape to avoid 'any'
interface RawTicket {
  _id?: string;
  id?: string;
  projectId?: string;
  project?: string;
  description?: string;
  status?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const updateTicketInState = createAction<Ticket>('ticket/updateTicketInState');

const transformTicket = (apiTicket: RawTicket): Ticket => {
  if (!apiTicket) return {} as Ticket;

  return {
    id: apiTicket._id?.toString() || apiTicket.id || '',
    projectId: apiTicket.projectId?.toString() || apiTicket.project || '',
    description: apiTicket.description || '',
    status: (apiTicket.status as TicketStatus) || TicketStatus.TODO,
    createdBy: apiTicket.createdBy || undefined,
    updatedBy: apiTicket.updatedBy || undefined,
    createdAt: apiTicket.createdAt ? new Date(apiTicket.createdAt).getTime() : undefined,
    updatedAt: apiTicket.updatedAt ? new Date(apiTicket.updatedAt).getTime() : undefined,
    type: "",
  };
};

const transformTickets = (apiTickets: RawTicket[]): Ticket[] => apiTickets.map(transformTicket);

interface UpdateTicketPayload {
  id: string;
  updates: Partial<Ticket>; 
}

export const fetchTicketsByProject = createAsyncThunk<
  Ticket[],
  string,
  { rejectValue: string }
>(
  'tickets/fetchByProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<RawTicket[]>>(`/ticket/list?projectId=${projectId}`);
      const apiTickets = response.data.data || [];
      const transformed = transformTickets(apiTickets);
      console.log('Fetched tickets for project:', projectId, transformed.length);
      return transformed;
    } catch (error: unknown) {
      console.error('Fetch tickets error:', error);
      // Safely access error properties
      const err = error as Error;
      const message = err.message || 'Failed to fetch tickets';
      return rejectWithValue(message);
    }
  }
);

export const createTicket = createAsyncThunk<
  Ticket,
  { projectId: string; description: string },
  { rejectValue: string }
>(
  'tickets/createTicket',
  async ({ projectId, description }, { rejectWithValue }) => {
    try {
      if (!description.trim()) {
        return rejectWithValue('Description is required');
      }
      const payload = { projectId, description: description.trim(), status: TicketStatus.TODO };
      const response = await api.post<ApiResponse<RawTicket>>('/ticket/create', payload);
      const apiTicket = response.data.data;
      const transformed = transformTicket(apiTicket);
      if (!transformed.id) {
        throw new Error('Created ticket missing ID');
      }
      emitTicketUpdate({ 
        ...transformed, 
        projectId, 
        type: 'created' 
      });
      console.log('Ticket created:', transformed.id);
      return transformed;
    } catch (error: unknown) {
      console.error('Create ticket error:', error);
      // Safely access error properties
      const err = error as Error;
      const message = err.message || 'Failed to create ticket';
      return rejectWithValue(message);
    }
  }
);

export const updateTicket = createAsyncThunk<
  Ticket,
  UpdateTicketPayload,
  { rejectValue: string }
>(
  'tickets/updateTicket',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue('Ticket ID is required');
      }
      if (updates.status && !Object.values(TicketStatus).includes(updates.status)) {
        return rejectWithValue(`Invalid status: ${updates.status}`);
      }
      const response = await api.put<ApiResponse<RawTicket>>(`/ticket/update/${id}`, updates);
      const apiTicket = response.data.data;
      const transformed = transformTicket(apiTicket);

      emitTicketUpdate({ 
        id, 
        ...updates, 
        projectId: transformed.projectId,
        type: 'updated',
        updatedBy: transformed.updatedBy,
        updatedAt: transformed.updatedAt
      });
      console.log('Ticket updated:', id);
      return transformed;
    } catch (error: unknown) {
      console.error('Update ticket error:', error);
      const err = error as Error;
      const message = err.message || 'Failed to update ticket';
      return rejectWithValue(message);
    }
  }
);

export const deleteTicket = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'tickets/deleteTicket',
  async (id: string, { rejectWithValue }) => {
    if (!id) {
      return rejectWithValue('Ticket ID is required');
    }
    try {
      await api.delete(`/ticket/delete/${id}`);
      emitTicketUpdate({ 
        id, 
        deleted: true, 
        type: 'deleted' 
      });
      console.log('Ticket deleted:', id);
      return id;
    } catch (error: unknown) {
      console.error('Delete ticket error:', error);
      const err = error as Error;
      const message = err.message || 'Failed to delete ticket';
      return rejectWithValue(message);
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    updateTickets: (state, action: PayloadAction<Ticket>) => {
      const ticket = action.payload;
      const index = state.tickets.findIndex((t) => t.id === ticket.id);
      if (index !== -1) {
        state.tickets[index] = { ...state.tickets[index], ...ticket };
      } else {
        state.tickets.push(ticket);
      }
      console.log('Real-time ticket updated:', ticket.id);
    },
    removeTicket: (state, action: PayloadAction<string>) => {
      state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      console.log('Real-time ticket removed:', action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    resetTickets: (state) => {
      state.tickets = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTicketsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsByProject.fulfilled, (state, action: PayloadAction<Ticket[]>) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTicketsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch tickets';
      })
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create ticket';
      })
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.loading = false;
        const index = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update ticket';
      })
      .addCase(deleteTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.tickets = state.tickets.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete ticket';
      });
  },
});

export const { updateTickets, removeTicket, clearError, resetTickets } = ticketsSlice.actions;
export default ticketsSlice.reducer;