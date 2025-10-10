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

export const updateTicketInState = createAction<Ticket>('ticket/updateTicketInState');

const transformTicket = (apiTicket: any): Ticket => {
  if (!apiTicket) return {} as Ticket;

  return {
    id: apiTicket._id?.toString() || apiTicket.id || '',
    projectId: apiTicket.projectId?.toString() || apiTicket.project || '',
    description: apiTicket.description || '',
    status: apiTicket.status as TicketStatus,
    createdBy: apiTicket.createdBy || undefined,  
    updatedBy: apiTicket.updatedBy || undefined,
    createdAt: apiTicket.createdAt ? new Date(apiTicket.createdAt).getTime() : undefined,
    updatedAt: apiTicket.updatedAt ? new Date(apiTicket.updatedAt).getTime() : undefined,
    type:""
  };
};

const transformTickets = (apiTickets: any[]): Ticket[] => apiTickets.map(transformTicket);

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
      const response = await api.get<ApiResponse<any[]>>(`/ticket/list?projectId=${projectId}`);
      const apiTickets = response.data.data || [];
      const transformed = transformTickets(apiTickets);
      console.log('Fetched tickets for project:', projectId, transformed.length);
      return transformed;
    } catch (error: any) {
      console.error('Fetch tickets error:', error);
      return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch tickets');
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
      const response = await api.post<ApiResponse<any>>('http://localhost:4000/api/ticket/create', payload);
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
    } catch (error: any) {
      console.error('Create ticket error:', error);
      return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to create ticket');
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
      const response = await api.put<ApiResponse<any>>(`http://localhost:4000/api/ticket/update/${id}`, updates);
      console.log("calling")
      const apiTicket = response.data.data;
      const transformed = transformTicket(apiTicket);
      if (!transformed.id) {
        throw new Error('Updated ticket missing ID');
      }
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
    } catch (error: any) {
      console.error('Update ticket error:', error);
      return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to update ticket');
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
    } catch (error: any) {
      console.error('Delete ticket error:', error);
      return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to delete ticket');
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