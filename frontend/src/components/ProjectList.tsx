import { FC } from 'react';
import type { Project } from '../types';
import { useRouter } from 'next/navigation';

interface ProjectListProps {
  projects: Project[];
  onSelect?: (id: string) => void;
}

const ProjectList: FC<ProjectListProps> = ({ projects, onSelect }) => {
  const router = useRouter();

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      router.push(`/project/${id}`);
    }
  };

  return (
    <ul className="space-y-2">
      {projects?.map((project) => (
        <li
          key={project._id}
          className="p-3 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors flex justify-between items-center"
          onClick={() => handleSelect(project._id)}
        >
          <span>{project.name}</span>
          <span className="text-xs text-gray-500">
            {new Date(project.createdAt || '').toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ProjectList;
