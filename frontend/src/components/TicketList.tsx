'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { updateTicket } from '../store/ticketsSlice';  
import  { Ticket, TicketStatus } from '../types';
import  { AppDispatch } from '../store';

interface TicketListProps {
  tickets: Ticket[];
  projectId: string;
  showUserInfo?: boolean; 
}

const TicketList: React.FC<TicketListProps> = ({ tickets, showUserInfo = false }) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleUpdateStatus = async (ticket: Ticket, newStatus: TicketStatus) => {
    if (!ticket.id) {
      console.error('Cannot update ticket: ID is missing', ticket);
      alert('Ticket ID missing. Please refresh.');
      return;
    }

    if (ticket.status === newStatus) {
      return;
    }

    try {
      await dispatch(updateTicket({ 
        id: ticket.id, 
        updates: { status: newStatus } 
      })).unwrap();
      console.log('Ticket status updated to:', newStatus);
    } catch (err: any) {
      if (err instanceof Error) {
        console.error('Update failed:', err);
        alert(err.message || 'Failed to update ticket');
      } else {
        console.error('Update failed: Unknown error');
        alert('An unknown error occurred. Please try again.');
      }
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatUserInfo = (ticket: Ticket) => {
    if (!showUserInfo) return null;
    
    const createdInfo = ticket.createdBy ? `Created by: ${ticket.createdBy}` : '';
    const updatedInfo = ticket.updatedBy ? ` | Updated by: ${ticket.updatedBy}` : '';
    
    return (
      <p className="text-xs text-gray-500 mt-1">
        {createdInfo}{updatedInfo}
        {ticket.updatedAt && ` | Last updated: ${new Date(ticket.updatedAt).toLocaleDateString()}`}
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <p className="text-gray-500 italic">No tickets yet. Create one above!</p>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{ticket.description}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.status === TicketStatus.TODO ? 'bg-gray-100 text-gray-800' :
                    ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {formatStatus(ticket.status)}
                  </span>
                </p>
                {formatUserInfo(ticket)}
              </div>
            </div>
            
            {ticket.id && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleUpdateStatus(ticket, TicketStatus.TODO)}
                  disabled={ticket.status === TicketStatus.TODO}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  To Do
                </button>
                <button
                  onClick={() => handleUpdateStatus(ticket, TicketStatus.IN_PROGRESS)}
                  disabled={ticket.status === TicketStatus.IN_PROGRESS}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(ticket, TicketStatus.DONE)}
                  disabled={ticket.status === TicketStatus.DONE}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default TicketList; 