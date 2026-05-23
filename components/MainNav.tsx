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

  const linkClass = (path: string) =>
    `nav-link ${isActive(path) ? 'nav-link-active' : ''}`;

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  const authLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const links = !loading && user ? authLinks : publicLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/80 bg-white/90 text-violet-950 backdrop-blur-md dark:border-slate-700 dark:bg-black/90 dark:text-white">
      <div className="container mx-auto flex justify-between px-4 py-5">
        <div className="flex items-center justify-end">
          <div className="flex items-center justify-evenly space-x-8">
            <Logo />
          </div>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-end space-x-6 md:flex">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {!loading && user ? (
            <div className="relative" ref={dropdownRef}>
              <div className="flex cursor-pointer items-center gap-4">
                <ModeToggle />
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  onClick={toggleDropdown}
                >
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-violet-200/80 dark:bg-slate-800 dark:ring-slate-700">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-violet-900 hover:bg-violet-50 dark:text-white dark:hover:bg-slate-900"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User size={16} className="mr-2" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-violet-50 dark:hover:bg-slate-900"
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
              <Link href="/auth/login" className="nav-link hidden md:block">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 dark:border-white" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
