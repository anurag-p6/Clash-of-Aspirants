import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#151717] dark:bg-slate-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Clash of Aspirants</h3>
            <p className="text-slate-300 text-sm">
              An interactive quiz platform that leverages AI to generate dynamic questions for educational and entertainment purposes.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-300 hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Get Started</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/register" className="text-slate-300 hover:text-white">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-slate-300 hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/rooms/create" className="text-slate-300 hover:text-white">
                  Create Quiz Room
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-300">support@clashofaspirants.com</span>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Clash of Aspirants. All rights reserved.</p>
          <div className="mt-2">
            <Link href="/privacy" className="text-slate-400 hover:text-white mx-2">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white mx-2">
              Terms of Service
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-2">Made with ❤️ by <strong>Team V1</strong></p>
        </div>
      </div>
    </footer>
  );
} 