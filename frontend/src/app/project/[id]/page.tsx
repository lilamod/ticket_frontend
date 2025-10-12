'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { fetchProjects } from '../../../store/projectsSlice';
import { fetchTicketsByProject, createTicket, updateTickets, removeTicket } from '../../../store/ticketsSlice';
import { logout } from '../../../store/authSlice'; 
import type { RootState, AppDispatch } from '../../../store';
import type { Project, Ticket } from '../../../types';
import SuperUserToggle from '../../../components/SuperUserToggle';
import Notifications from '../../../components/Notifications';
import CreateTicket from '../../../components/CreateTicket';
import TicketList from '../../../components/TicketList';
import { initSocket } from '../../../lib/socket';  
import type { Socket } from 'socket.io-client';

export default function ProjectDetail() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { list: projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const { tickets, loading: ticketsLoading, error: ticketsError } = useSelector((state: RootState) => state.tickets);
  const { isSuperUser } = useSelector((state: RootState) => state.ui); 
  const { isAuthenticated, loading: authLoading, error: authError, user } = useSelector((state: RootState) => state.auth);  // Auth state from your slice
  const [project, setProject] = useState<Project | null>(null);
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    

    dispatch(fetchProjects());

    if (projectId) {
      dispatch(fetchTicketsByProject(projectId));
    }

    socketRef.current = initSocket();

    if (socketRef.current && projectId) {
      socketRef.current.emit('joinProject', projectId);  

      socketRef.current.on('ticketUpdated', (updatedTicket: Ticket) => {
        console.log('Real-time ticket update received:', updatedTicket);
        if (updatedTicket.projectId === projectId) {
          dispatch(updateTickets(updatedTicket)); 
        }
      });

      socketRef.current.on('ticketCreated', (newTicket: Ticket) => {
        console.log('Real-time ticket created received:', newTicket);
        if (newTicket.projectId === projectId) {
          dispatch(updateTickets(newTicket)); 
        }
      });

      socketRef.current.on('ticketDeleted', (deletedId: string) => {
        console.log('Real-time ticket deleted received:', deletedId);
        dispatch(removeTicket(deletedId));  
      });
    }

    const interval = setInterval(() => {
      if (projectId) {
        dispatch(fetchTicketsByProject(projectId));
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (socketRef.current && projectId) {
        socketRef.current.emit('leaveProject', projectId);
        socketRef.current.off('ticketUpdated');
        socketRef.current.off('ticketCreated');
        socketRef.current.off('ticketDeleted');
      }
    };
  }, [dispatch, router, isAuthenticated, projectId]);

  useEffect(() => {
    if (projects && projects.length > 0) {
      const foundProject = projects.find((p: Project) => p._id === projectId); 
      setProject(foundProject || null);
    }
  }, [projects, projectId]);

  const handleCreateTicket = async (description: string) => {
    if (!projectId) {
      console.error('No projectId for ticket creation');
      alert('Project ID missing. Please refresh.');
      return;
    }

    if (!description.trim()) {
      alert('Description is required');
      return;
    }

    console.log('Creating ticket for project:', projectId, 'Description:', description);

    try {
      const result = await dispatch(createTicket({ projectId, description: description.trim() })).unwrap();
      console.log('Ticket created successfully:', result);
      dispatch(fetchTicketsByProject(projectId));
      alert('Ticket created successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Create ticket error:', err);
        const errorMsg = err?.message || ticketsError || 'Failed to create ticket';
        alert(errorMsg);
      } else {
        alert('Create ticket error');
      }
    }
  };

  
  const handleLogout = () => {
    dispatch(logout());  
    router.push('/');
  };

 
  if (authLoading || projectsLoading || ticketsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading project and tickets...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-red-500">Project not found. <button onClick={() => router.push('/dashboard')} className="underline">Go to Dashboard</button></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg p-4 overflow-y-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 text-blue-500 hover:underline text-sm"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-xl font-bold mb-6 text-gray-800">{project.name}</h2>
        <SuperUserToggle />  
        <Notifications />
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
        {authError && <p className="text-red-500 text-xs mt-2">{authError}</p>}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{project.name} Tickets</h1>
          <p className="text-gray-600">Manage tickets with real-time updates. Logged in as: {user?.email || 'User'}</p> 
        </div>
        <CreateTicket onCreate={handleCreateTicket} />  
        <TicketList tickets={tickets} projectId={projectId} showUserInfo={isSuperUser} />  
        {ticketsError && <p className="text-red-500 mt-4">{ticketsError}</p>}
      </div>
    </div>
  );
}