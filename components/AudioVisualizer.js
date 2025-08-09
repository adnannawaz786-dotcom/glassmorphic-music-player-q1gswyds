'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const AudioVisualizer = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    const initializeAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);

          if (!sourceRef.current) {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
          }
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    };

    initializeAudioContext();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (!isInitialized || !isPlaying || !canvasRef.current || !analyserRef.current) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
      gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.6)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * canvas.height * 0.8;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitialized, isPlaying]);

  return (
    <motion.div
      className="relative w-full h-32 rounded-xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-white/20 rounded-xl" />
      
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10"
        style={{ filter: 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.3))' }}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-white/60 text-sm font-medium">
            Play music to see visualization
          </div>
        </div>
      )}

      {/* Animated background bars when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-end justify-center space-x-1 p-4 z-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="bg-gradient-to-t from-purple-500/30 to-blue-500/30 w-2 rounded-full"
              style={{ height: `${Math.random() * 40 + 10}%` }}
              animate={{
                height: [`${Math.random() * 40 + 10}%`, `${Math.random() * 60 + 20}%`],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AudioVisualizer;