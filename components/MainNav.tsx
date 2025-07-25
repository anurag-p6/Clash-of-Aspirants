'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/public/logo';
import { User, LogOut } from 'lucide-react';
import { ModeToggle } from '@/components/ThemeToggle';

export default function MainNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-slate-100 dark:bg-black dark:text-white border-b-[0.03rem] border-black dark:border-slate-500">
      <div className="container mx-auto px-4 py-6 flex justify-between">
        <div className="flex justify-end items-center">
          {/* Left Side - Logo */}
          <div className="flex items-center justify-evenly space-x-8">
            <Logo />
          </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6 absolute left-1/2 transform -translate-x-1/2 items-end">
              {!loading && user ? (
                <>
                  <Link
                    href="/"
                    className={`hover:text-slate-900 dark:hover:text-indigo-500 ${isActive('/') ?  'text-black dark:text-indigo-300 font-medium' : 'text-slate-700 '}`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`hover:text-slate-900 dark:hover:text-indigo-500 ${isActive('/dashboard') ? 'text-black dark:text-indigo-300 font-medium' : 'text-slate-700'}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/pricing"
                    className={` hover:text-slate-900 dark:hover:text-indigo-500 ${isActive('/pricing') ? 'text-black dark:text-indigo-300 font-medium' : 'text-slate-700'}`}
                  >
                    Pricing
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={`hover:text-indigo-500 ${isActive('/') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className={`hover:text-indigo-400 ${isActive('/about') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    About
                  </Link>
                  <Link
                    href="/pricing"
                    className={`hover:text-indigo-500 ${isActive('/pricing') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/faq"
                    className={`hover:text-indigo-500 ${isActive('/faq') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/contact"
                    className={`hover:text-indigo-500 ${isActive('/contact') ? 'text-indigo-300 font-medium' : ''}`}
                  >
                    Contact
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Side - User Authentication */}
          <div className="flex items-center space-x-4">
            {!loading && user ? (
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-7 cursor-pointer">
                      <ModeToggle />
                  <div 
                  className="h-9 w-9 text-white bg-black dark:bg-indigo-500 rounded-full flex items-center justify-center hover:bg-slate-800 dark:hover:bg-indigo-600 transition-colors"
                  onClick={toggleDropdown}>
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 dark:text-white dark:bg-slate-600 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm dark:text-white text-gray-700 hover:bg-gray-100">
                      <User size={16} className="mr-2" />
                      <span>Profile</span>
                    </Link>
                    <button 
                      onClick={() => {
                        signOut();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-800 dark:text-red-300 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <>
              <ModeToggle />
                <Link href="/auth/login" className="hover:text-indigo-500">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 border howve hover:bg-indigo-700 text-white px-3 py-1 rounded-sm"
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
