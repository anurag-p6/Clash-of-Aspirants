import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-violet-200/80 bg-gradient-to-br from-violet-100 via-indigo-50 to-violet-50 py-8 text-violet-950 dark:border-slate-800 dark:from-slate-950 dark:via-black dark:to-[#200559] dark:text-white">
      <div className="container mx-auto px-4">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">Clash of Aspirants</h3>
            <p className="text-sm text-violet-800/80 dark:text-slate-300">
              An interactive quiz platform that leverages AI to generate dynamic questions for educational and entertainment purposes.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Get Started</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/register" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/rooms/create" className="text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  Create Quiz Room
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-violet-800/90 dark:text-slate-300">support@clashofaspirants.com</span>
              </li>
              <li>
                <Link href="/contact" className="flex items-center text-violet-800/90 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-violet-300/60 pt-6 text-center text-sm text-violet-700/80 dark:border-slate-700 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} Clash of Aspirants. All rights reserved.</p>
          <div className="mt-2">
            <Link href="/privacy" className="mx-2 hover:text-indigo-700 dark:hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="mx-2 hover:text-indigo-700 dark:hover:text-white">
              Terms of Service
            </Link>
          </div>
          <p className="mt-2 text-sm">Made with ❤️ by <strong>Team V1</strong></p>
        </div>
      </div>
    </footer>
  );
}
