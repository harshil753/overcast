import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

/**
 * Initialize FFmpeg for video conversion
 */
export const initializeFFmpeg = async (): Promise<boolean> => {
  try {
    if (isLoaded && ffmpeg) {
      console.log('[VideoConverter] FFmpeg already loaded');
      return true;
    }

    console.log('[VideoConverter] Initializing FFmpeg...');
    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with proper URLs
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    console.log('[VideoConverter] Loading FFmpeg core...');
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    isLoaded = true;
    console.log('[VideoConverter] FFmpeg loaded successfully');
    return true;
  } catch (error) {
    console.error('[VideoConverter] Failed to load FFmpeg:', error);
    isLoaded = false;
    ffmpeg = null;
    return false;
  }
};

/**
 * Convert WebM video to MP4 format using FFmpeg
 * @param webmBlob - WebM video blob
 * @returns Promise<Blob> - MP4 video blob
 */
export const convertWebMToMP4 = async (webmBlob: Blob): Promise<Blob> => {
  try {
    console.log('[VideoConverter] Starting WebM to MP4 conversion...');
    
    // Initialize FFmpeg if not already loaded
    const loaded = await initializeFFmpeg();
    if (!loaded || !ffmpeg) {
      console.warn('[VideoConverter] FFmpeg not available, returning original WebM');
      return webmBlob;
    }

    const inputFileName = 'input.webm';
    const outputFileName = 'output.mp4';

    console.log('[VideoConverter] Writing input file...');
    // Write input file
    await ffmpeg.writeFile(inputFileName, await fetchFile(webmBlob));

    console.log('[VideoConverter] Converting video...');
    // Convert WebM to MP4
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'fast',
      '-crf', '23',
      outputFileName
    ]);

    console.log('[VideoConverter] Reading output file...');
    // Read output file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Clean up files
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    console.log('[VideoConverter] Conversion completed successfully');
    // Return MP4 blob - handle both string and Uint8Array cases
    if (data instanceof Uint8Array) {
      return new Blob([data as BlobPart], { type: 'video/mp4' });
    } else {
      const encoded = new TextEncoder().encode(data);
      return new Blob([encoded as BlobPart], { type: 'video/mp4' });
    }
  } catch (error) {
    console.error('[VideoConverter] Conversion failed:', error);
    console.warn('[VideoConverter] Returning original WebM blob');
    // Return original blob if conversion fails
    return webmBlob;
  }
};

/**
 * Check if FFmpeg is available and loaded
 */
export const isFFmpegAvailable = (): boolean => {
  return isLoaded && ffmpeg !== null;
};
