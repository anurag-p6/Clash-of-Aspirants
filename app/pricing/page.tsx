'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';
import { Check } from 'lucide-react';

const pricingPlans = [
  {
    id: 'launch',
    name: 'Launch',
    tagline: 'RECOMMENDED',
    price: '$19',
    period: '/month',
    description: 'Perfect for educators and small communities creating occasional quizzes.',
    features: [
      { name: 'Generate 50 quizzes per month' },
      { name: '5 topics per quiz' },
      { name: 'Up to 10 questions per quiz' },
      { name: 'Basic analytics' },
      { name: '7-day quiz history' },
    ],
    additionalFeatures: [
      { name: 'Email support' }
    ]
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$69',
    period: '/month',
    description: 'Ideal for schools and growing communities with regular quiz needs.',
    features: [
      { name: 'Generate 200 quizzes per month' },
      { name: '10 topics per quiz' },
      { name: 'Up to 20 questions per quiz' },
      { name: 'Advanced analytics' },
      { name: '14-day quiz history' },
    ],
    additionalFeatures: [
      { name: 'Priority queue for generation' },
      { name: 'Custom branding' }
    ]
  },
  {
    id: 'business',
    name: 'Business',
    price: '$700',
    period: '/month',
    description: 'Comprehensive solution for educational institutions and enterprises.',
    features: [
      { name: 'Unlimited quizzes' },
      { name: 'Unlimited topics' },
      { name: 'Up to 50 questions per quiz' },
      { name: 'Enterprise analytics' },
      { name: '30-day quiz history' },
    ],
    additionalFeatures: [
      { name: 'Dedicated account manager' },
      { name: 'Custom AI fine-tuning' },
      { name: 'White-label solution' },
      { name: '99.95% uptime SLA' },
      { name: '24/7 priority support' }
    ]
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('launch');

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />

      <main className="flex-1 bg-gradient-to-b dark:from-black dark:via-black dark:to-[#200559] bg-slate-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">AI Quiz Generation Plans</h1>
              <p className="text-lg text-gray-500 max-w-3xl mx-auto">
                Unlock the power of AI to create engaging quizzes for education, training, or entertainment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`dark:bg-transparent bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
                    selectedPlan === plan.id ? 'border-indigo-500' : 'border-white'
                  }`}
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">{plan.name}</h2>
                      {plan.tagline && (
                        <span className=" dark:from-bg-black dark:to-indigo-600 bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                          {plan.tagline}
                        </span>
                      )}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
                    <button 
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full py-2 rounded font-medium transition-colors ${
                        selectedPlan === plan.id 
                          ? 'text-white hover: dark:from-bg-black dark:to-indigo-600 bg-indigo-700' 
                          : 'border border-gray-300 text-gray-500 hover: dark:from-bg-black dark:to-indigo-600 bg-gray-50'
                      }`}
                    >
                      Select plan
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5">
                            <Check size={20} />
                          </div>
                          <div className="ml-2">
                            <p className="text-sm text-gray-500">{feature.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {plan.additionalFeatures.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm font-medium mb-4">Everything in {plan.id === 'scale' ? 'Launch' : plan.id === 'business' ? 'Scale' : 'Free'}, plus:</p>
                        <div className="space-y-4">
                          {plan.additionalFeatures.map((feature, index) => (
                            <div key={index} className="flex items-start">
                              <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                                <Check size={20} />
                              </div>
                              <div className="ml-2">
                                <p className="text-sm text-gray-500">{feature.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <h3 className="text-xl font-bold mb-4">Create Better Quizzes, Faster</h3>
              <p className="text-gray-500 mb-6 max-w-3xl mx-auto">
                Our AI-powered platform helps you create high-quality, educational quizzes in seconds.
                Choose topics, set difficulty levels, and let our AI handle the rest. Perfect for classrooms,
                training sessions, or competitive learning.
              </p>
              <Link
                href={user ? '/rooms/create' : '/auth/register'}
                className=" hover: dark:from-bg-black dark:to-indigo-600 bg-indigo-700 text-white px-8 py-3 rounded-md font-medium"
              >
                {user ? 'Create Your First AI Quiz' : 'Sign Up & Start Creating'}
              </Link>
            </div>

            <div className=" dark:bg-transparent border border-indigo-700 bg-white rounded-lg shadow-md p-8 mt-16">
              <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2">How accurate are the AI-generated quizzes?</h4>
                  <p className="text-gray-500 text-sm">
                    Our AI model is designed to create factually accurate quiz content. However, we recommend reviewing questions before using them in formal educational settings.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Can I customize the difficulty level?</h4>
                  <p className="text-gray-500 text-sm">
                    Yes, you can specify difficulty levels from beginner to expert when creating your quiz. The AI will adjust questions accordingly.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Do you offer discounts for educational institutions?</h4>
                  <p className="text-gray-500 text-sm">
                    Yes, we offer special pricing for K-12 schools, universities, and non-profit educational organizations. Contact us for details.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">What topics can the AI generate quizzes for?</h4>
                  <p className="text-gray-500 text-sm">
                    Our AI can generate quizzes on a wide range of academic subjects, including science, history, literature, mathematics, and more. We&apos;re constantly expanding our topic coverage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 