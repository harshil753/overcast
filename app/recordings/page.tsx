/**
 * Recordings Page for Overcast Video Classroom
 * 
 * This page displays all available recordings for the current user and provides
 * download functionality. It integrates with the DownloadManager component to
 * handle recording downloads and management.
 * 
 * Key Features:
 * - List all recordings for the current user
 * - Download individual recordings
 * - Download all recordings at once
 * - View recording details (duration, size, status)
 * - Automatic cleanup of expired recordings
 * 
 * WHY: Centralized location for users to access and download their recordings
 * after leaving a classroom session.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useUserSession } from '../components/UserSessionProvider';
import DownloadManager from '../components/DownloadManager';
import { Recording } from '../../lib/types';
import { getRecordings, cleanupExpiredRecordings } from '../../lib/storage-utils';

/**
 * Recordings page component
 */
export default function RecordingsPage() {
  const { session } = useUserSession();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load recordings from storage
   */
  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session?.sessionId) {
        setRecordings([]);
        return;
      }

      // Get all recordings for the current user
      const userRecordings = getRecordings(session.sessionId);
      setRecordings(userRecordings);

      // Clean up expired recordings
      const cleanupResult = cleanupExpiredRecordings(session.sessionId);
      if (cleanupResult.removedCount > 0) {
        console.log(`Cleaned up ${cleanupResult.removedCount} expired recordings`);
        // Reload recordings after cleanup
        const updatedRecordings = getRecordings(session.sessionId);
        setRecordings(updatedRecordings);
      }

    } catch (err) {
      console.error('Failed to load recordings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recordings');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle recording download start
   */
  const handleDownloadStart = (recording: Recording) => {
    console.log('[Recordings] Download started:', recording.id);
  };

  /**
   * Handle recording download complete
   */
  const handleDownloadComplete = (recording: Recording) => {
    console.log('[Recordings] Download completed:', recording.id);
  };

  /**
   * Handle recording download error
   */
  const handleDownloadError = (recording: Recording, error: string) => {
    console.error('[Recordings] Download error:', recording.id, error);
  };

  /**
   * Load recordings on component mount
   */
  useEffect(() => {
    loadRecordings();
  }, [session?.sessionId]);

  /**
   * Refresh recordings periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      loadRecordings();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [session?.sessionId]);

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">Please log in to view your recordings.</p>
          <a
            href="/"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Lobby
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Recordings</h1>
            <p className="text-gray-400 text-sm mt-1">
              Download your classroom recordings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadRecordings}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Lobby
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading recordings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">⚠</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Recordings</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadRecordings}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <DownloadManager
              recordings={recordings}
              onDownloadStart={handleDownloadStart}
              onDownloadComplete={handleDownloadComplete}
              onDownloadError={handleDownloadError}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-4">
        <div className="text-center text-gray-400 text-sm">
          <p>Recordings are automatically deleted after 24 hours</p>
        </div>
      </div>
    </div>
  );
}
