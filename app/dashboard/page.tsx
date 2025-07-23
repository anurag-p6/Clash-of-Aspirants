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
  const [userStats, setUserStats] = useState({
    totalScore: 0,
    roomsJoined: 0,
    correctAnswers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user || !user.id) {
        console.log('User not fully loaded yet, skipping room fetch');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch active rooms
        const roomsResponse = await fetch('/api/rooms');
        let roomsData;
        try {
          roomsData = await roomsResponse.json();
          setActiveRooms(roomsData.rooms.slice(0,5) || []);
        } catch (jsonError) {
          console.error('Error parsing rooms response:', jsonError);
          setActiveRooms([]);
        }
        
        // Fetch user's rooms
        try {
          const userRoomsResponse = await fetch(`/api/users/${user.id}/rooms`);
          if (userRoomsResponse.ok) {
            const userRoomsData = await userRoomsResponse.json();
            setUserRooms(userRoomsData.rooms || []);
          } else {
            setUserRooms([]);
          }
        } catch (error) {
          console.error('Error fetching user rooms:', error);
          setUserRooms([]);
        }
        
        // Fetch user stats
        try {
          const statsResponse = await fetch(`/api/users/${user.id}/stats`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
              setUserStats({
              totalScore: statsData.stats?.totalScore || 0,
              roomsJoined: statsData.stats?.quizzesJoined || 0, 
              correctAnswers: statsData.stats?.correctAnswers || 0
            });
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setActiveRooms([]);
        setUserRooms([]);
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchRooms();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />

      <main className="flex-1 bg-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">Dashboard</h2>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
              <Link
                href="/rooms/join"
                className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-md text-center"
              >
                Join Room
              </Link>
              <Link
                href="/rooms/create"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-center"
              >
                Create Room
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Statistics Section */}
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Your Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Score', value: userStats.totalScore },
                    { label: 'Rooms Created', value: userRooms.length },
                    { label: 'Rooms Joined', value: userStats.roomsJoined },
                    { label: 'Correct Answers', value: userStats.correctAnswers }
                  ].map((stat, index) => (
                    <div key={index} className="bg-slate-100 p-4 rounded-md text-center">
                      <div className="text-xl sm:text-2xl font-bold text-indigo-600">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                  ))}
                </div>
              </div>

              {/* User Quiz Rooms Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold">Your Quiz Rooms</h3>
                  <Link href="/profile" className="text-indigo-600 hover:underline text-sm">
                    View All
                  </Link>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : userRooms.length > 0 ? (
                  <div className="space-y-4">
                    {userRooms.slice(0, 3).map((room) => (
                      <Link key={room.id} href={`/rooms/${room.id}`} className="block border rounded-md p-4 hover:bg-slate-50">
                          <h4 className="font-medium">{room.name}</h4>
                          <div className="flex justify-between mt-2 text-sm text-gray-500">
                            <span>Topic: {room.topic}</span>
                            <span>{room.participantCount} participants</span>
                          </div>
                        </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">You haven’t created any quiz rooms yet.</p>
                )}
              </div>
            </div>

            {/* Active Quiz Rooms Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold">Active Quiz Rooms</h3>
                <Link href="/leaderboard" className="text-indigo-600 hover:underline text-sm">
                  Global Leaderboard
                </Link>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : activeRooms.length > 0 ? (
                <div className="space-y-4">
                  {activeRooms.map((room) => (
                    <Link key={room.id} href={`/rooms/${room.id}`} className="block border rounded-md p-4 hover:bg-slate-50">
                        <h4 className="font-medium">{room.name}</h4>
                      <div className="text-sm text-gray-500">{room.topic} · {room.participantCount} participants</div>
                      </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No active quiz rooms available.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 
