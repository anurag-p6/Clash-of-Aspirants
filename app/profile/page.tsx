'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

interface UserStats {
  totalScore: number;
  quizzesCreated: number;
  quizzesJoined: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswers: number;
  accuracy: number;
}

export default function ProfilePage() {
  const { user, loading, firebaseUser } = useAuth();
  const router = useRouter();
  const [memberSince, setMemberSince] = useState<Date | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalScore: 0,
    quizzesCreated: 0,
    quizzesJoined: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalAnswers: 0,
    accuracy: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Get Firebase user metadata for account creation date
    if (firebaseUser && firebaseUser.metadata && firebaseUser.metadata.creationTime) {
      const creationTime = new Date(firebaseUser.metadata.creationTime);
      setMemberSince(creationTime);
    }
  }, [firebaseUser]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user || !user.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user stats from the API
        const response = await fetch(`/api/users/${user.id}/stats`);
        
        if (!response.ok) {
          // Try to safely get the response text instead of assuming it's JSON
          const responseText = await response.text();
          let errorMessage;
          
          try {
            // Try to parse as JSON
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || `Error fetching stats: ${response.status}`;
          } catch (error) {
            // If not JSON, use status code
            console.error('Failed to parse error response:', error as Error);
            errorMessage = `Error fetching stats: ${response.status}`;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        if (data.stats) {
          setUserStats(data.stats);
        } else {
          throw new Error('Invalid stats data received');
        }
      } catch (error) {
        console.error('Error fetching user stats:', error as Error);
        setError((error as Error).message || 'Failed to load user statistics');
        
        // Set default stats as fallback
        setUserStats({
          totalScore: 0,
          quizzesCreated: 0,
          quizzesJoined: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          totalAnswers: 0,
          accuracy: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchUserStats();
    }
  }, [user]);

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
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Your Profile</h1>
              <Link
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                Back to Dashboard
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-gray-500 text-sm mb-1">Username</label>
                    <div className="font-medium">{user.username}</div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-sm mb-1">Email</label>
                    <div className="font-medium">{user.email}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-gray-500 text-sm mb-1">Member Since</label>
                    <div className="font-medium">
                      {memberSince 
                        ? memberSince.toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) 
                        : new Date(user.createdAt || Date.now()).toLocaleDateString()
                      }
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-sm mb-1">Total Score</label>
                    <div className="font-medium text-indigo-600">{userStats.totalScore} points</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Your Statistics</h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold text-indigo-600">{userStats.quizzesCreated}</div>
                      <div className="text-sm text-gray-500">Quizzes Created</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold text-indigo-600">{userStats.quizzesJoined}</div>
                      <div className="text-sm text-gray-500">Quizzes Joined</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold text-green-600">{userStats.correctAnswers}</div>
                      <div className="text-sm text-gray-500">Correct Answers</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-md text-center">
                      <div className="text-2xl font-bold text-red-600">{userStats.incorrectAnswers}</div>
                      <div className="text-sm text-gray-500">Incorrect Answers</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500">Total Questions Answered</span>
                        <span className="font-bold">{userStats.totalAnswers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Accuracy</span>
                        <span className="font-bold text-indigo-600">{userStats.accuracy}%</span>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-md">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600">{userStats.totalScore}</div>
                        <div className="text-sm text-gray-500">Total Score</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/rooms/create"
                  className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md"
                >
                  Create New Quiz Room
                </Link>
                <Link
                  href="/leaderboard"
                  className="block text-center bg-white hover:bg-gray-100 text-indigo-700 border border-indigo-300 px-4 py-3 rounded-md"
                >
                  View Global Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 