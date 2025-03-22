'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

export default function CreateRoomPage() {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ id: string; name: string } | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      setError('You must be logged in to create a room');
      return;
    }
    
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
      console.log('Creating room with creator ID:', user.id);
      
      // Create the room
      const roomResponse = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          topic,
          creatorId: user.id,
          numQuestions
        }),
      });

      if (!roomResponse.ok) {
        const errorData = await roomResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create room');
      }

      let roomData;
      try {
        roomData = await roomResponse.json();
      } catch (jsonError) {
        console.error('Error parsing room response:', jsonError);
        throw new Error('Invalid response from server');
      }

      const roomId = roomData.room.id;

      // Set the created room to show sharing options
      setCreatedRoom({
        id: roomId,
        name: name
      });
      
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.id);
      alert('Room code copied to clipboard!');
    }
  };

  const enterRoom = () => {
    if (createdRoom) {
      router.push(`/rooms/${createdRoom.id}`);
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
    <div className="flex flex-col min-h-screen">
      <MainNav />

      <main className="flex-1 bg-slate-100">
        <div className="container mx-auto px-4 py-8">
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

            {createdRoom ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  <div className="mb-2 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Room Created Successfully!</h2>
                  <p className="text-gray-600 mb-6">
                    Your quiz room "{createdRoom.name}" is ready. Share the code with others to join.
                  </p>
                  
                  <div className="bg-indigo-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <p className="text-sm text-indigo-700 mb-2">Room Code:</p>
                    <div className="flex items-center justify-center">
                      <span className="font-mono text-xl font-bold text-indigo-800 mr-2">
                        {createdRoom.id}
                      </span>
                      <button
                        onClick={copyRoomCode}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 p-1 rounded-md"
                        title="Copy room code"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={enterRoom}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      Enter Room
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 px-4 rounded-md"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 