import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateTickets, removeTicket } from '../store/ticketsSlice';
import { addNotification } from '../store/notificationsSlice'; 
import type { Ticket } from '../types';

let socket: Socket | null = null;

export const initSocket = (token?: string) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('http://localhost:4000', { 
    auth: { token }, 
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('ticketUpdated', (updatedTicket: Ticket) => {
    store.dispatch(updateTickets(updatedTicket)); 
    store.dispatch(addNotification({
      id: `notif-${updatedTicket.id}-${Date.now()}`,
      message: `Ticket "${updatedTicket.description}" updated`,
      timestamp: Date.now(),
      read: false,
    }));
  });

  socket.on('ticketDeleted', (ticketId: string) => {
    store.dispatch(removeTicket(ticketId)); 
    store.dispatch(addNotification({
      id: `notif-delete-${ticketId}`,
      message: `Ticket ${ticketId} deleted`,
      timestamp: Date.now(),
      read: false,
    }));
  });

  socket.on('ticketCreated', (newTicket: Ticket) => {
    store.dispatch(updateTickets(newTicket)); 
    store.dispatch(addNotification({
      id: `notif-create-${newTicket.id}`,
      message: `New ticket "${newTicket.description}" created`,
      timestamp: Date.now(),
      read: false,
    }));
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitTicketUpdate = (data: Partial<Ticket> & { id?: string; deleted?: boolean }) => {
  if (socket) {
    socket.emit('ticketUpdate', data);
  }
};

export { socket };