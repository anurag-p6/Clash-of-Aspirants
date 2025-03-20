'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function CreateRoomPage() {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !topic.trim()) {
      setError('Room name and topic are required');
      return;
    }

    if (numQuestions < 1 || numQuestions > 20) {
      setError('Number of questions must be between 1 and 20');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Create the room
      const roomResponse = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          topic,
          creatorId: user?.id,
        }),
      });

      if (!roomResponse.ok) {
        throw new Error('Failed to create room');
      }

      const roomData = await roomResponse.json();
      const roomId = roomData.room.id;

      // Generate questions for the room
      const questionsResponse = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          numQuestions,
          roomId,
        }),
      });

      if (!questionsResponse.ok) {
        throw new Error('Failed to generate questions');
      }

      // Redirect to the new room
      router.push(`/rooms/${roomId}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            Clash of Aspirants
          </Link>
          <div className="flex items-center gap-4">
            <span>Welcome, {user.username}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Create Quiz Room</h1>
            <Link
              href="/dashboard"
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-md"
            >
              Cancel
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleCreateRoom}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter a name for your quiz room"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                    Quiz Topic
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., World History, Python Programming, Science Fiction"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This topic will be used to generate AI-powered quiz questions
                  </p>
                </div>

                <div>
                  <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <input
                    id="numQuestions"
                    type="number"
                    min="1"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Choose between 1 and 20 questions for your quiz
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Creating Quiz Room...
                      </div>
                    ) : (
                      'Create Quiz Room'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 