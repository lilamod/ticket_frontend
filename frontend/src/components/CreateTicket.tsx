import { FC, useState } from 'react';

interface CreateTicketProps {
  onCreate: (description: string) => void;
}

const CreateTicket: FC<CreateTicketProps> = ({ onCreate }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      onCreate(description.trim());
      setDescription('');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to create ticket:', error);
        alert(error.message || 'Failed to create ticket');
      } else {
        console.error('Failed to create ticket: Unknown error');
        alert('An unknown error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-2">
      <input
        type="text"
        placeholder="Ticket Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
        disabled={!description.trim() || loading}
      >
        {loading ? 'Adding...' : 'Add Ticket'}
      </button>
    </form>
  );
};

export default CreateTicket;