"use client";

import { useState, useEffect, useRef } from "react";

interface TextToSpeechProps {
  text: string;
  title?: string;
}

export default function TextToSpeech({ text, title }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !voice) {
        // Prefer English voices
        const englishVoice = availableVoices.find(
          (v) => v.lang.startsWith("en") && v.name.includes("Natural")
        ) || availableVoices.find((v) => v.lang.startsWith("en")) || availableVoices[0];
        setVoice(englishVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voice]);

  const speak = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      title ? `${title}. ${text}` : text
    );
    
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!window.speechSynthesis) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Text-to-speech is not supported in your browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!isPlaying && !isPaused && (
          <button
            onClick={speak}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center gap-2"
            title="Play text-to-speech"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Play
          </button>
        )}
        {isPlaying && (
          <button
            onClick={pause}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors flex items-center gap-2"
            title="Pause"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.75 3a.75.75 0 00-.75.75v12.5a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
            </svg>
            Pause
          </button>
        )}
        {isPaused && (
          <button
            onClick={speak}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center gap-2"
            title="Resume"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Resume
          </button>
        )}
        {(isPlaying || isPaused) && (
          <button
            onClick={stop}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center gap-2"
            title="Stop"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
            </svg>
            Stop
          </button>
        )}
      </div>

      {(isPlaying || isPaused) && (
        <div className="flex flex-col gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          <div className="flex items-center gap-4">
            <label className="text-gray-700 dark:text-gray-300">
              Speed: {rate}x
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => {
                  setRate(parseFloat(e.target.value));
                  if (isPlaying && utteranceRef.current) {
                    stop();
                    utteranceRef.current.rate = parseFloat(e.target.value);
                    speak();
                  }
                }}
                className="ml-2"
              />
            </label>
          </div>
          {voices.length > 0 && (
            <div>
              <label className="text-gray-700 dark:text-gray-300 text-xs">
                Voice:
                <select
                  value={voice?.name || ""}
                  onChange={(e) => {
                    const selectedVoice = voices.find((v) => v.name === e.target.value);
                    if (selectedVoice) {
                      setVoice(selectedVoice);
                      if (isPlaying) {
                        stop();
                        setTimeout(() => speak(), 100);
                      }
                    }
                  }}
                  className="ml-2 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

