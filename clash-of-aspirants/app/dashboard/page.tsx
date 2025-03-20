'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

interface QuizRoom {
  id: string;
  name: string;
  topic: string;
  participantCount: number;
  createdAt: string;
  creatorName: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeRooms, setActiveRooms] = useState<QuizRoom[]>([]);
  const [userRooms, setUserRooms] = useState<QuizRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return;
      
      try {
        // Fetch active rooms
        const roomsResponse = await fetch('/api/rooms');
        const roomsData = await roomsResponse.json();
        
        if (roomsData.rooms) {
          setActiveRooms(roomsData.rooms);
        }
        
        // Fetch rooms created by the user
        const userRoomsResponse = await fetch(`/api/users/${user.id}/rooms`);
        const userRoomsData = await userRoomsResponse.json();
        
        if (userRoomsData.rooms) {
          setUserRooms(userRoomsData.rooms);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchRooms();
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />

      <main className="flex-1 bg-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <Link
              href="/rooms/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              Create Quiz Room
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Your Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-100 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold text-indigo-600">{user?.score || 0}</div>
                    <div className="text-sm text-gray-500">Total Score</div>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold text-indigo-600">{userRooms.length}</div>
                    <div className="text-sm text-gray-500">Rooms Created</div>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold text-indigo-600">0</div>
                    <div className="text-sm text-gray-500">Rooms Joined</div>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold text-indigo-600">0</div>
                    <div className="text-sm text-gray-500">Correct Answers</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Your Quiz Rooms</h3>
                  <Link href="/profile" className="text-indigo-600 hover:underline text-sm">
                    View All
                  </Link>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : userRooms.length > 0 ? (
                  <div className="space-y-4">
                    {userRooms.slice(0, 3).map((room) => (
                      <div key={room.id} className="border rounded-md p-4 hover:bg-slate-50">
                        <Link href={`/rooms/${room.id}`} className="block">
                          <h4 className="font-medium">{room.name}</h4>
                          <div className="flex justify-between mt-2 text-sm text-gray-500">
                            <span>Topic: {room.topic}</span>
                            <span>{room.participantCount} participants</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Created {new Date(room.createdAt).toLocaleDateString()}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4 text-center">
                    You haven't created any quiz rooms yet.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Active Quiz Rooms</h3>
                <Link href="/leaderboard" className="text-indigo-600 hover:underline text-sm">
                  Global Leaderboard
                </Link>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : activeRooms.length > 0 ? (
                <div className="space-y-4">
                  {activeRooms.map((room) => (
                    <div key={room.id} className="border rounded-md p-4 hover:bg-slate-50">
                      <Link href={`/rooms/${room.id}`} className="block">
                        <h4 className="font-medium">{room.name}</h4>
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                          <span>Topic: {room.topic}</span>
                          <span>{room.participantCount} participants</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          By {room.creatorName}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4 text-center">
                  No active quiz rooms available. Why not create one?
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 