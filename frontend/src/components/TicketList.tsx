'use client';

import React from 'react';
import { useDispatch } from 'react-redux';
import { updateTicket } from '../store/ticketsSlice';
import { Ticket, TicketStatus } from '../types';
import { AppDispatch } from '../store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TicketListProps {
  tickets: Ticket[];
  projectId: string;
  showUserInfo?: boolean;
}

const statusOrder = [
  TicketStatus.TODO,
  TicketStatus.IN_PROGRESS,
  TicketStatus.DONE,
];

const TicketList: React.FC<TicketListProps> = ({ tickets, showUserInfo = false }) => {
  const dispatch = useDispatch<AppDispatch>();

  const groupedTickets = statusOrder.reduce((acc, status) => {
    acc[status] = tickets.filter(t => t.status === status);
    return acc;
  }, {} as Record<string, Ticket[]>);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const dragged = tickets.find(t => t.id === draggableId);
    if (!dragged) return;

    // Status updated
    if (source.droppableId !== destination.droppableId) {
      await dispatch(
        updateTicket({
          id: dragged.id,
          updates: { status: destination.droppableId as TicketStatus }
        })
      );
    }

    // --- NEW: broadcast realtime movement to other users ---
    if (showUserInfo) {
      const ws = new WebSocket("wss://your-realtime-server.com");
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "ticket-movement",
            ticketId: dragged.id,
            newStatus: destination.droppableId,
          })
        );
        ws.close();
      };
    }
  };

  const userInfo = (ticket: Ticket) => {
    if (!showUserInfo) return null;

    return (
      <p className="text-xs text-gray-500 mt-1">
        {ticket.createdBy && `Created by: ${ticket.createdBy}`}
        {ticket.updatedBy && ` | Updated by: ${ticket.updatedBy}`}
        {ticket.updatedAt && ` | Last updated: ${new Date(ticket.updatedAt).toLocaleString()}`}
      </p>
    );
  };

  const label = (status: TicketStatus) => {
    if (status === TicketStatus.TODO) return 'To Do';
    if (status === TicketStatus.IN_PROGRESS) return 'In Progress';
    if (status === TicketStatus.DONE) return 'Done';
    return status;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4 w-full">

        {statusOrder.map(status => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`w-1/3 p-4 rounded-md border ${
                  snapshot.isDraggingOver ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
                }`}
              >
                <h3 className="text-lg font-semibold mb-3">{label(status)}</h3>

                {groupedTickets[status].map((ticket, index) => (
                  <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                    {(draggableProvided, snapshotDraggable) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        className={`p-4 mb-3 rounded bg-white border shadow-sm cursor-pointer transition ${
                          snapshotDraggable.isDragging ? 'shadow-lg bg-blue-50' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-900">{ticket.description}</p>
                        {userInfo(ticket)}
                      </div>
                    )}
                  </Draggable>
                ))}

                {groupedTickets[status].length === 0 && (
                  <p className="text-sm text-gray-400 italic">No tickets</p>
                )}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}

      </div>
    </DragDropContext>
  );
};

export default TicketList;
