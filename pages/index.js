import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Play, Pause, Volume2, Music } from 'lucide-react';

export default function Home() {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [songs, setSongs] = useState([]);
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationIdRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedSongs = localStorage.getItem('musicPlayerSongs');
    if (savedSongs) {
      setSongs(JSON.parse(savedSongs));
    }
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem('musicPlayerSongs', JSON.stringify(songs));
    }
  }, [songs]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const mp3Files = files.filter(file => file.type === 'audio/mpeg');
    
    mp3Files.forEach(file => {
      const url = URL.createObjectURL(file);
      const newSong = {
        id: Date.now() + Math.random(),
        name: file.name.replace('.mp3', ''),
        url: url,
        file: file
      };
      setSongs(prev => [...prev, newSong]);
    });
  };

  const initializeAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }
  };

  const updateAudioData = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      setAudioData(new Uint8Array(dataArrayRef.current));
      animationIdRef.useRef = requestAnimationFrame(updateAudioData);
    }
  };

  const playSong = (song) => {
    if (currentSong?.id === song.id && isPlaying) {
      pauseSong();
      return;
    }
    
    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.src = song.url;
      audioRef.current.play();
      setIsPlaying(true);
      
      initializeAudioContext();
      updateAudioData();
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const Visualizer = () => {
    const bars = Array.from({ length: 32 }, (_, i) => {
      const height = audioData[i] ? (audioData[i] / 255) * 100 : 0;
      return (
        <motion.div
          key={i}
          className="bg-gradient-to-t from-purple-400 to-pink-400 rounded-full"
          style={{
            height: `${Math.max(height, 4)}%`,
            width: '6px',
          }}
          animate={{
            height: `${Math.max(height, 4)}%`,
          }}
          transition={{
            duration: 0.1,
            ease: 'easeOut',
          }}
        />
      );
    });

    return (
      <div className="flex items-end justify-center space-x-1 h-32">
        {bars}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Music Player</h1>
            <p className="text-white/70">Upload and play your MP3 files</p>
          </div>

          <div className="space-y-6">
            {/* Upload Section */}
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl border border-white/30 text-white transition-all duration-300"
              >
                <Upload size={20} />
                <span>Upload MP3 Files</span>
              </motion.button>
            </div>

            {/* Visualizer */}
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/20 rounded-2xl p-4 border border-white/10"
              >
                <Visualizer />
              </motion.div>
            )}

            {/* Current Song Display */}
            {currentSong && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/20 rounded-2xl p-4 border border-white/10"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                    <Music className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold truncate">{currentSong.name}</h3>
                    <p className="text-white/60 text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => isPlaying ? pauseSong() : playSong(currentSong)}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-300"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </motion.button>

                  <div className="flex items-center space-x-2 flex-1 ml-4">
                    <Volume2 className="text-white" size={16} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="flex-1 accent-purple-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Song List */}
            {songs.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {songs.map((song) => (
                  <motion.div
                    key={song.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => playSong(song)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                      currentSong?.id === song.id
                        ? 'bg-white/20 border-purple-400/50'
                        : 'bg-white/10 border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                        {currentSong?.id === song.id && isPlaying ? (
                          <Pause className="text-white" size={14} />
                        ) : (
                          <Play className="text-white" size={14} />
                        )}
                      </div>
                      <span className="text-white truncate">{song.name}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {songs.length === 0 && (
              <div className="text-center py-8">
                <Music className="mx-auto text-white/40 mb-3" size={48} />
                <p className="text-white/60">No songs uploaded yet</p>
                <p className="text-white/40 text-sm mt-1">Upload some MP3 files to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      </motion.div>
    </div>
  );
}