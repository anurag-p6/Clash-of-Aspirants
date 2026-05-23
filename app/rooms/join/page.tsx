'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

export default function JoinRoomPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    setError('');
    setIsJoining(true);
    
    try {
      // First check if the room exists
      const roomResponse = await fetch(`/api/rooms/${roomCode}`);
      
      if (!roomResponse.ok) {
        if (roomResponse.status === 404) {
          throw new Error('Room not found. Please check the code and try again.');
        }
        throw new Error('Failed to join room. Please try again.');
      }
      
      // Room exists, now try to join it
      const joinResponse = await fetch(`/api/rooms/${roomCode}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });
      
      if (!joinResponse.ok) {
        const errorData = await joinResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join the room. Please try again.');
      }
      
      // Successfully joined the room, redirect to the room page
      router.push(`/rooms/${roomCode}`);
      
    } catch (err) {
      console.error('Error joining room:', err);
      setError((err as Error).message || 'Failed to join the room');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-brand-gradient">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />

      <main className="flex-1 bg-brand-gradient">
        <div className="container mx-auto px-4 py-12">
          <div className="card-elevated max-w-md mx-auto p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Join a Quiz Room</h2>
            
            <form onSubmit={handleJoinRoom}>
              <div className="mb-6">
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  id="roomCode"
                  placeholder="Enter the room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-600"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter the room code shared by the room creator
                </p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="text-indigo-600 hover:underline dark:text-indigo-400">
                  Back to Dashboard
                </Link>
                <button
                  type="submit"
                  disabled={isJoining}
                  className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center ${
                    isJoining ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isJoining && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  )}
                  {isJoining ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}