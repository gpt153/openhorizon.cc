'use client';

import { useState, FormEvent } from 'react';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    // Simulate API call (replace with actual implementation later)
    setTimeout(() => {
      setStatus('success');
      setMessage('Thank you! We\'ll be in touch soon.');
      setEmail('');
    }, 1000);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        {/* Hero Headline */}
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          AI-Powered Project Management
          <br />
          <span className="text-accent">for Erasmus+</span>
        </h1>
        
        {/* Subheadline */}
        <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
          Streamline planning, compliance, and collaboration for EU-funded projects
          with intelligent automation and insights.
        </p>

        {/* Email Capture Form */}
        <div className="mt-10 flex flex-col items-center gap-4">
          {status === 'success' ? (
            <div className="rounded-lg bg-green-50 p-4 text-green-800">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-lg bg-cta px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-cta/90 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}
          
          {status === 'error' && (
            <p className="text-sm text-red-600">{message}</p>
          )}
          
          <p className="text-sm text-gray-500">
            Join 100+ project coordinators planning for 2025
          </p>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-accent to-primary opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </section>
  );
}
