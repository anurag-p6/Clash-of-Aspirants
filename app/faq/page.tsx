'use client';

import { useState } from 'react';
import Link from 'next/link';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqItems: FaqItem[] = [
    {
      question: "What is Clash of Aspirants?",
      answer: "Clash of Aspirants is an interactive quiz platform that uses AI to generate dynamic questions. It allows users to create custom quiz rooms on any topic and compete with others in real-time."
    },
    {
      question: "How does the AI question generation work?",
      answer: "We use OpenAI&apos;s powerful language models to generate questions based on the topic you provide. The AI creates multiple-choice questions with explanations, ensuring each quiz is unique and tailored to your specified subject matter."
    },
    {
      question: "Do I need to create an account to use the platform?",
      answer: "Yes, you need to create an account to create quiz rooms, join competitions, and track your progress on the leaderboard. Registration is free and only takes a minute with email or Google authentication."
    },
    {
      question: "How many people can join a quiz room?",
      answer: "There&apos;s no strict limit on the number of participants, but for optimal performance, we recommend up to 50 participants per room. For larger events, consider creating multiple rooms."
    },
    {
      question: "Can I create private quiz rooms?",
      answer: "Yes, when creating a quiz room, you can set it as private. You&apos;ll receive a unique link to share with only those you want to invite."
    },
    {
      question: "How is the scoring calculated?",
      answer: "Points are awarded based on correct answers and the speed of your response. Answering quickly and correctly will earn you more points. The exact scoring formula considers both factors to reward knowledge and quick thinking."
    },
    {
      question: "Can I use this for educational purposes in my classroom?",
      answer: "Absolutely! Many educators use Clash of Aspirants to make learning more engaging. You can create custom quizzes for your students on specific topics and monitor their progress."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, we offer a mobile-responsive web application that works well on smartphones and tablets. A dedicated mobile app is on our roadmap and will be released in the near future."
    },
    {
      question: "How can I report inappropriate content or technical issues?",
      answer: "You can report any issues through our Contact page or by emailing support@clashofaspirants.com. We take all reports seriously and aim to address them promptly."
    },
    {
      question: "Is my data secure on the platform?",
      answer: "Yes, we take data security very seriously. We use industry-standard encryption for all data transmission and storage. We do not share your personal information with third parties without your consent."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen relative">
      <MainNav />

      <main className="flex-1 bg-brand-gradient z-10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-violet-950 dark:text-white">Frequently Asked Questions</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              Find answers to the most common questions about Clash of Aspirants. If you can&apos;t find what you&apos;re looking for, please visit our{' '}
              <Link href="/contact" className="text-indigo-600 hover:underline dark:text-indigo-400 dark:hover:underline">Contact page</Link> to reach out to our support team.
            </p>
            
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div 
                  key={index} 
                  className="card-elevated overflow-hidden"
                >
                  <button
                    className="w-full text-left p-4 flex justify-between items-center focus:outline-none"
                    onClick={() => toggleFaq(index)}
                  >
                    <h2 className="text-xl font-semibold">{faq.question}</h2>
                    <svg 
                      className={`w-5 h-5 transition-transform ${activeIndex === index ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeIndex === index && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-700 dark:text-gray-300 mb-4">Still have questions?</p>
              <Link 
                href="/contact" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium inline-block"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
