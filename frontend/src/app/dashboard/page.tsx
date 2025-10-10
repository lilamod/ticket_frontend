'use client';

import { useEffect } from 'react';  // Removed unused useState (createMode not used)
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchProjects, createProject } from '../../store/projectsSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Project } from '../../types';
import SuperUserToggle from '../../components/SuperUserToggle';
import Notifications from '../../components/Notifications';
import ProjectList from '../../components/ProjectList';
import CreateProject from '../../components/CreateProject';
import { initSocket } from '../../lib/socket';

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { list: projects, count, loading, error } = useSelector((state: RootState) => state.projects);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
  
    dispatch(fetchProjects());

    initSocket();

    const interval = setInterval(() => {
      dispatch(fetchProjects());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, router, isAuthenticated]);

  const handleCreate = async (name: string) => {
    try {
      await dispatch(createProject(name)).unwrap();  
      dispatch(fetchProjects());
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-red-500">Error: {error}</div>
        <button
          onClick={() => dispatch(fetchProjects())}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-6 text-gray-800">Ticket Dashboard</h1>
        <SuperUserToggle />
        <Notifications />
        {projects.length === 0 ? (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-4">No Projects Yet</h2>
            <CreateProject onCreate={handleCreate} />
          </div>
        ) : (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-4">
              Projects ({count} total)
            </h2>
            <ProjectList 
              projects={projects} 
              onSelect={(id) => router.push(`/project/${id}`)} 
            />
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
            <p>Create your first project to get started with tickets.</p>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-2xl font-bold mb-4">Select a Project</h2>
            <p>Click on a project in the sidebar to view and manage tickets.</p>
          </div>
        )}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}