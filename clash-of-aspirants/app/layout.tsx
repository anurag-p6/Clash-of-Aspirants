import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SocketProvider } from "@/lib/socket-context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clash of Aspirants - Interactive Quiz Platform",
  description: "An interactive quiz platform that leverages OpenAI to generate dynamic quiz questions.",
  icons:{
    icon:"/logo.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
