'use client';

/**
 * Landing Page with Name Entry
 * 
 * This is the entry point for the Overcast Video Classroom application.
 * Users enter their name here before accessing the lobby.
 * 
 * WHY: FR-015 requires name entry before accessing classrooms.
 * Simple authentication approach (no password) per clarification 2025-10-05.
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidUserName } from '@/lib/types';
import { USER_NAME_MIN_LENGTH, USER_NAME_MAX_LENGTH, APP_NAME } from '@/lib/constants';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by only rendering client-side specific features after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Validates and submits the name entry form
   * WHY: Enforces name validation (1-50 characters) before lobby access
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Trim whitespace
    const trimmedName = name.trim();

    // Validate name using type guard from lib/types.ts
    if (!isValidUserName(trimmedName)) {
      setError(`Name must be between ${USER_NAME_MIN_LENGTH} and ${USER_NAME_MAX_LENGTH} characters`);
      return;
    }

    // Navigate to lobby with name in URL params
    // WHY: Name is passed to lobby for session creation
    setIsSubmitting(true);
    router.push(`/lobby?name=${encodeURIComponent(trimmedName)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black uppercase tracking-wider text-white mb-4">
            {APP_NAME}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#00FFD1] animate-pulse"></div>
            <p className="text-[#00FFD1] text-sm font-bold uppercase tracking-wide">
              Video Classroom Platform
            </p>
          </div>
          <p className="text-gray-400 text-sm">
            AI Engineering Accelerator
          </p>
        </div>

        {/* Name Entry Form */}
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Enter your name to join a classroom
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                disabled={isSubmitting}
                className={`
                  w-full px-4 py-3 
                  bg-black border rounded-lg 
                  text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-[#00FFD1] focus:border-transparent
                  transition-all duration-200
                  ${error ? 'border-red-500' : 'border-[#333333]'}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                maxLength={USER_NAME_MAX_LENGTH}
                autoComplete="name"
                autoFocus={isClient}
              />
              
              {/* Character Count */}
              <div className="flex justify-between items-center mt-2">
                <div>
                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}
                </div>
                <p className="text-gray-500 text-xs">
                  {name.length}/{USER_NAME_MAX_LENGTH}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={`
                w-full py-3 px-6 rounded-lg font-bold uppercase tracking-wide
                transition-all duration-200
                ${
                  isSubmitting || !name.trim()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-[#FFBD17] text-black hover:bg-[#FFD147] shadow-lg shadow-[#FFBD17]/20'
                }
              `}
            >
              {isSubmitting ? 'Joining...' : 'Enter Lobby'}
            </button>
          </form>

          {/* Helper Text */}
          <p className="text-gray-500 text-xs text-center mt-6">
            No password required • Simple name-based access
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00FFD1] mb-1">6</div>
            <div className="text-gray-400 text-xs">Classrooms</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[#00FFD1] mb-1">10</div>
            <div className="text-gray-400 text-xs">Max Per Room</div>
          </div>
        </div>
      </div>
    </main>
  );
}
