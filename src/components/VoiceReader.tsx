import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

interface VoiceReaderProps {
  textToRead: string;
}

export const VoiceReader: React.FC<VoiceReaderProps> = ({ textToRead }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [rate, setRate] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any pending

      // Clean markdown tags for natural speech
      const cleaned = textToRead
        .replace(/[#*`_~\[\]()>-]/g, ' ')
        .replace(/```[\s\S]*?```/g, '程式碼片段已省略')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = rate;
      utterance.lang = 'zh-TW';

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
      <button
        onClick={handleTogglePlay}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          isPlaying
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
        }`}
        title={isPlaying ? '暫停語音導讀' : '語音朗讀摘要'}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>暫停朗讀</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>語音導讀</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          onClick={handleStop}
          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
          title="停止"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-center gap-1 ml-1 text-[11px] text-slate-400">
        <span>語速:</span>
        <button
          onClick={() => {
            const nextRate = rate === 1.0 ? 1.25 : rate === 1.25 ? 1.5 : 1.0;
            setRate(nextRate);
            if (isPlaying) {
              handleStop();
            }
          }}
          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 font-mono text-indigo-300"
        >
          {rate}x
        </button>
      </div>

      {isPlaying && (
        <div className="flex items-center gap-0.5 ml-1">
          <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse" />
          <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-75" />
          <span className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse delay-150" />
        </div>
      )}
    </div>
  );
};
