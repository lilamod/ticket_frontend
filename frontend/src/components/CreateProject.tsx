import { FC, useState } from 'react';

interface CreateProjectProps {
  onCreate: (name: string) => void;
}

const CreateProject: FC<CreateProjectProps> = ({ onCreate }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim());
      setName('');
    } catch (error) {
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        required
        disabled={loading}
      />
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
        disabled={!name.trim() || loading}
      >
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
};

export default CreateProject;