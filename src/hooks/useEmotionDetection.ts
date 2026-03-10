import { useState, useCallback, useRef, useEffect } from 'react';

export type EmotionLabel = 'angry' | 'disgusted' | 'fearful' | 'happy' | 'neutral' | 'sad' | 'surprised';

export interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  emotion: EmotionLabel;
  confidence: number;
}

export interface EmotionStats {
  angry: number
  disgusted: number
  fearful: number
  happy: number
  neutral: number
  sad: number
  surprised: number

}

const THREAT_EMOTIONS: EmotionLabel[] = ['angry', 'fearful', 'disgusted'];

export function useEmotionDetection() {
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [stats, setStats] = useState<EmotionStats>({
    angry: 0, disgusted: 0, fearful: 0, happy: 0, neutral: 0, sad: 0, surprised: 0,
  });
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const faceapiRef = useRef<typeof import('face-api.js') | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const faceapi = await import('face-api.js');
      faceapiRef.current = faceapi;
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setIsModelLoaded(true);
    } catch (err) {
      console.error('Failed to load face-api models:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectFaces = useCallback(async (video: HTMLVideoElement) => {
    const faceapi = faceapiRef.current;
    if (!faceapi || !isModelLoaded) return;

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceExpressions();

      const newFaces: DetectedFace[] = detections.map((d, i) => {
        const box = d.detection.box;
        const expressions = d.expressions;
        const sorted = Object.entries(expressions).sort((a, b) => (b[1] as number) - (a[1] as number));
        const [emotion, confidence] = sorted[0] as [EmotionLabel, number];

        return {
          id: `face-${i}`,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          emotion,
          confidence,
        };
      });

      setFaces(newFaces);

      // Update stats
      const newStats: EmotionStats = { angry: 0, disgusted: 0, fearful: 0, happy: 0, neutral: 0, sad: 0, surprised: 0 };
      newFaces.forEach(f => { newStats[f.emotion]++; });
      setStats(newStats);

      // Threat level
      const threatCount = newFaces.filter(f => THREAT_EMOTIONS.includes(f.emotion)).length;
      const total = newFaces.length || 1;
      const ratio = threatCount / total;
      setThreatLevel(ratio > 0.5 ? 'high' : ratio > 0.2 ? 'medium' : 'low');
    } catch (err) {
      // detection error, skip frame
    }
  }, [isModelLoaded]);

  const startDetection = useCallback((video: HTMLVideoElement) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => detectFaces(video), 500);
  }, [detectFaces]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setFaces([]);
    setStats({ angry: 0, disgusted: 0, fearful: 0, happy: 0, neutral: 0, sad: 0, surprised: 0 });
    setThreatLevel('low');
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { faces, stats, threatLevel, isModelLoaded, isLoading, loadModels, startDetection, stopDetection };
}
