import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  // Listen for changes to localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.log(error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key]);

  return [storedValue, setValue];
};

// Additional utility functions for music player specific localStorage operations
export const useMusicLibrary = () => {
  const [library, setLibrary] = useLocalStorage('musicLibrary', []);

  const addTrack = (track) => {
    setLibrary(prev => [...prev, { ...track, id: Date.now() }]);
  };

  const removeTrack = (id) => {
    setLibrary(prev => prev.filter(track => track.id !== id));
  };

  const clearLibrary = () => {
    setLibrary([]);
  };

  return { library, addTrack, removeTrack, clearLibrary };
};

export const usePlayerSettings = () => {
  const [settings, setSettings] = useLocalStorage('playerSettings', {
    volume: 0.7,
    repeat: false,
    shuffle: false,
    visualizerEnabled: true,
    theme: 'default'
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
};