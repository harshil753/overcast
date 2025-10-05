'use client';

import React, { useState, useEffect } from 'react';
import Lobby from '@/app/components/Lobby';
import { RoomsResponse } from '@/lib/types';

/**
 * Lobby page component
 * Fetches classroom status from GET /api/rooms and renders Lobby component
 * Handles loading and error states for classroom data
 */
export default function LobbyPage() {
  const [, setClassroomData] = useState<RoomsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch classroom data from API
  useEffect(() => {
    const fetchClassroomData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/rooms');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch classrooms: ${response.status} ${response.statusText}`);
        }
        
        const data: RoomsResponse = await response.json();
        setClassroomData(data);
      } catch (err) {
        console.error('Error fetching classroom data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load classrooms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassroomData();
  }, []);


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading classrooms...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching classroom data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Classrooms</h2>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main lobby view with classroom data
  return (
    <div className="min-h-screen bg-black">
      <Lobby />
    </div>
  );
}
