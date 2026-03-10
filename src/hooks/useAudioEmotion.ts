import { useState, useCallback, useRef, useEffect } from 'react';

export type AudioEmotion = 'neutral' | 'stress' | 'aggression' | 'fear' | 'calm';

export function useAudioEmotion() {
  const [audioEmotion, setAudioEmotion] = useState<AudioEmotion>('neutral');
  const [volume, setVolume] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const classifyFromAudio = useCallback((avgVolume: number, spectralCentroid: number) => {
    // Simulated classification based on audio features
    if (avgVolume > 180 && spectralCentroid > 0.6) return 'aggression';
    if (avgVolume > 150 && spectralCentroid > 0.5) return 'stress';
    if (avgVolume > 120 && spectralCentroid < 0.3) return 'fear';
    if (avgVolume < 50) return 'calm';
    return 'neutral';
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const analyze = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolume(Math.min(100, (avg / 255) * 100));

        // Simple spectral centroid approximation
        let weightedSum = 0;
        let totalMag = 0;
        dataArray.forEach((val, i) => { weightedSum += val * i; totalMag += val; });
        const centroid = totalMag > 0 ? weightedSum / (totalMag * dataArray.length) : 0;

        setAudioEmotion(classifyFromAudio(avg, centroid));
        rafRef.current = requestAnimationFrame(analyze);
      };
      analyze();
    } catch {
      setIsListening(false);
    }
  }, [classifyFromAudio]);

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    analyserRef.current = null;
    setIsListening(false);
    setVolume(0);
    setAudioEmotion('neutral');
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  return { audioEmotion, volume, isListening, startListening, stopListening };
}
