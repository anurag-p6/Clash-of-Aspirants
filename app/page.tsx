'use client';

import Link from 'next/link';
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleRoomAction = (action: 'create' | 'join') => {
    if (user) {
      router.push(`/rooms/${action}`);
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 bg-gradient-to-b dark:from-black dark:to-[#200559]">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              className="md:text-5xl text-4xl font-bold mb-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              Test Your Knowledge, Challenge Your Friends!
            </motion.h2>
            <p className="md:text-xl text-lg mb-12">
              Clash of Aspirants is an interactive Platform that leverages AI to generate dynamic quiz questions.
              Create or join quiz rooms, compete in real-time, and track your performance on leaderboards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {!loading && !user ? (
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-md text-md font-medium"
                >
                  Sign Up
                </Link>
              ) : !loading && user ? (
                <Link
                  href="/dashboard"
                  className=" bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-md text-md font-medium"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <div className="h-14 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleRoomAction('create')}
                  className=" bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-md text-md font-medium cursor-pointer"
              >
                Create Room
              </button>
              <button
                onClick={() => handleRoomAction('join')}
                className="  bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-md text-md font-medium cursor-pointer"
              >
                Join Room
              </button>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800 text-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Dynamic Questions</h3>
              <p>
                Input topics or prompts, and the system generates relevant quiz questions using OpenAI&apos;s language model.
              </p>
            </div>
            <div className="bg-slate-800 text-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Real-Time Competition</h3>
              <p>
                Create or join quiz rooms where you compete against peers in real-time with instant updates.
              </p>
            </div>
            <div className="bg-slate-800 text-white dark:bg-white/10 backdrop-blur-lg p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Leaderboard System</h3>
              <p>
                Track your performance and compete for the top spot on dynamic leaderboards in each quiz room.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
