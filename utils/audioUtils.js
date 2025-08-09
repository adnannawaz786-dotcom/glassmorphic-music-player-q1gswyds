// Audio utility functions for file handling and processing

/**
 * Validates if the uploaded file is a valid MP3 file
 * @param {File} file - The file to validate
 * @returns {boolean} - True if valid MP3 file
 */
export const isValidMP3File = (file) => {
  if (!file) return false;
  
  // Check file type
  const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/mpeg3'];
  if (!validTypes.includes(file.type)) return false;
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.mp3')) return false;
  
  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) return false;
  
  return true;
};

/**
 * Converts file to base64 string for localStorage
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Creates an audio blob URL from base64 data
 * @param {string} base64Data - Base64 audio data
 * @returns {string} - Blob URL
 */
export const base64ToBlobUrl = (base64Data) => {
  try {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mp3' });
    
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting base64 to blob URL:', error);
    return null;
  }
};

/**
 * Extracts metadata from audio file
 * @param {File} file - The audio file
 * @returns {Promise<Object>} - Audio metadata
 */
export const extractAudioMetadata = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        name: file.name.replace('.mp3', ''),
        duration: audio.duration,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      
      URL.revokeObjectURL(url);
      resolve(metadata);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        name: file.name.replace('.mp3', ''),
        duration: 0,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    });
    
    audio.src = url;
  });
};

/**
 * Formats duration from seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formats file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Saves audio data to localStorage
 * @param {string} key - Storage key
 * @param {Object} audioData - Audio data to save
 */
export const saveToLocalStorage = (key, audioData) => {
  try {
    const dataToSave = {
      ...audioData,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      clearOldAudioData();
      // Try saving again after cleanup
      try {
        localStorage.setItem(key, JSON.stringify(audioData));
      } catch (retryError) {
        console.error('Failed to save after cleanup:', retryError);
      }
    }
  }
};

/**
 * Loads audio data from localStorage
 * @param {string} key - Storage key
 * @returns {Object|null} - Audio data or null if not found
 */
export const loadFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Removes audio data from localStorage
 * @param {string} key - Storage key
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Gets all saved audio tracks from localStorage
 * @returns {Array} - Array of saved audio tracks
 */
export const getAllSavedTracks = () => {
  try {
    const tracks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('audio_')) {
        const data = loadFromLocalStorage(key);
        if (data) {
          tracks.push({ key, ...data });
        }
      }
    }
    return tracks.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (error) {
    console.error('Error getting saved tracks:', error);
    return [];
  }
};

/**
 * Clears old audio data to free up localStorage space
 */
export const clearOldAudioData = () => {
  try {
    const tracks = getAllSavedTracks();
    // Keep only the 5 most recent tracks
    const tracksToRemove = tracks.slice(5);
    
    tracksToRemove.forEach(track => {
      removeFromLocalStorage(track.key);
    });
  } catch (error) {
    console.error('Error clearing old audio data:', error);
  }
};

/**
 * Generates a unique key for audio storage
 * @param {string} fileName - Original file name
 * @returns {string} - Unique storage key
 */
export const generateAudioKey = (fileName) => {
  const timestamp = Date.now();
  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
  return `audio_${cleanName}_${timestamp}`;
};

/**
 * Creates audio context for Web Audio API
 * @returns {AudioContext|null} - Audio context or null if not supported
 */
export const createAudioContext = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    return new AudioContextClass();
  } catch (error) {
    console.error('Web Audio API not supported:', error);
    return null;
  }
};

/**
 * Cleans up blob URLs to prevent memory leaks
 * @param {string} blobUrl - Blob URL to clean up
 */
export const cleanupBlobUrl = (blobUrl) => {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
};