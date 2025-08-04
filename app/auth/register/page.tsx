'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff } from "lucide-react";
import { BearAnimation } from '@/components/animation/LoginAnimation';
import Image from 'next/image';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim()) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await signUpWithEmail(email, password, username);
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError((error as Error).message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign up error:', error);
      setError((error as Error).message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-slate-100 bg-gradient-to-b dark:from-black dark:via-black dark:to-[#200559] px-4 py-6 md:px-10 relative">
      {/* Bear Animation - Hidden on small screens */}
      <div className="hidden md:block md:w-1/2">
        <BearAnimation />
      </div>

      {/* Registration Form */}
      <div className="w-full max-w-sm md:max-w-md bg-white border border-indigo-600 dark:bg-slate-900 p-6 md:p-8 rounded-lg shadow-md ">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold">Create an Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Join Clash of Aspirants and test your knowledge!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 px-4 py-2 mt-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleEmailSignUp}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-gray-600 dark:focus:border-indigo-500"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-gray-600 dark:focus:border-indigo-500"
              placeholder="your@email.com"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-gray-600 dark:focus:border-indigo-500"
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              className="absolute top-9 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {!showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center">
          <span className="flex-grow border-t border-gray-300 dark:border-gray-700"></span>
          <span className="px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">Or continue with</span>
          <span className="flex-grow border-t border-gray-300 dark:border-gray-700"></span>
        </div>


        <button
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="mt-4 w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:text-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
          Google
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
