'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainNav from '@/components/MainNav';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { name: '', email: '', subject: '', message: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
      valid = false;
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => router.push('/'), 2000);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <MainNav />
      <main className="flex-1 bg-brand-gradient px-4 sm:px-6 lg:px-8 py-12 z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-violet-950 dark:text-white">Contact Us</h1>
          {submitSuccess ? (
            <div className="bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400 px-4 py-3 rounded relative mb-6">
              <strong className="font-bold">Thank you!</strong> Your message has been sent.
            </div>
          ) : (
            <div className="card-elevated p-6 sm:p-8">
              <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">Have questions? Reach out to us!</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" placeholder="Your name" value={formData.name} onChange={handleChange} className={`w-full p-3 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-slate-800`} />
                {errors.name && <p className="text-red-500 dark:text-red-400 text-sm">{errors.name}</p>}
                <input type="email" name="email" placeholder="Your email" value={formData.email} onChange={handleChange} className={`w-full p-3 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-slate-800`} />
                {errors.email && <p className="text-red-500 dark:text-red-400 text-sm">{errors.email}</p>}
                <select name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 border rounded-md dark:bg-slate-800 dark:border-gray-600">
                  <option value="">Select a subject</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                </select>
                {errors.subject && <p className="text-red-500 dark:text-red-400 text-sm">{errors.subject}</p>}
                <textarea name="message" placeholder="Your message" value={formData.message} onChange={handleChange} className={`w-full p-3 border rounded-md ${errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-slate-800`} rows={4}></textarea>
                {errors.message && <p className="text-red-500 dark:text-red-400 text-sm">{errors.message}</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition duration-200 disabled:bg-indigo-400" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Message'}</button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
