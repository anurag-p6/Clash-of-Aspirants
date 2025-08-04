'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

interface LeaderboardUser {
  id: string;
  username: string;
  score: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        if (data) {
          setLeaderboardData(data);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />

      <main className="flex-1 bg-slate-100 dark:bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Global Leaderboard</h1>
            
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-indigo-600 text-white">
                <h2 className="text-xl font-bold">Top Scoring Users</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800 border-b dark:border-gray-700">
                        <th className="py-3 px-6 text-left">Rank</th>
                        <th className="py-3 px-6 text-left">User</th>
                        <th className="py-3 px-6 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((leaderboardUser, index) => (
                        <tr 
                          key={leaderboardUser.id} 
                          className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 ${user && leaderboardUser.id === user.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                        >
                          <td className="py-3 px-6">
                            {index === 0 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white rounded-full font-bold">1</span>
                            ) : index === 1 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-300 text-white rounded-full font-bold">2</span>
                            ) : index === 2 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-600 text-white rounded-full font-bold">3</span>
                            ) : (
                              <span className="ml-3">{index + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-6 font-medium">
                            {leaderboardUser.username}
                            {user && leaderboardUser.id === user.id && (
                              <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-normal">(You)</span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-right font-bold">
                            {leaderboardUser.score} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No users have scored points yet. Be the first one!
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Link
                href={user ? '/dashboard' : '/auth/register'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md inline-block font-medium"
              >
                {user ? 'Back to Dashboard' : 'Join and Compete'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}