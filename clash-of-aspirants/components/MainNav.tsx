'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/public/logo';

export default function MainNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-slate-900 text-white border-b-[0.01rem] border-slate-500">
      <div className="container mx-auto px-4 py-6 flex justify-between">
        <div className="flex justify-end items-center">
          {/* Left Side - Logo */}
          <div className="flex items-center justify-evenly space-x-8">
            <Logo />
          </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6 absolute left-1/2 transform -translate-x-1/2">
              {!loading && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`hover:text-indigo-300 ${isActive('/dashboard') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`hover:text-indigo-300 ${isActive('/leaderboard') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/profile"
                    className={`hover:text-indigo-300 ${isActive('/profile') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/about"
                    className={`hover:text-indigo-300 ${isActive('/about') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    About
                  </Link>
                  <Link
                    href="/faq"
                    className={`hover:text-indigo-300 ${isActive('/faq') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/contact"
                    className={`hover:text-indigo-300 ${isActive('/contact') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Contact
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Side - User Authentication */}
          <div className="flex items-center space-x-4 ">
            {!loading && user ? (
              <>
                <span className="hidden md:inline">Hi, {user.username}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : !loading ? (
              <>
                <Link href="/auth/login" className="hover:text-indigo-300">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="h-8 w-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>
      
    </header>
  );
}
