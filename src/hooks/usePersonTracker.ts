import { useState, useCallback, useRef, useEffect } from 'react';
import type { DetectedFace, EmotionLabel } from './useEmotionDetection';

export type PersonCategory = 'suspect' | 'victim' | 'neutral';

export interface TrackedPerson {
  id: string;
  firstSeen: number;
  lastSeen: number;
  emotionHistory: EmotionLabel[];
  dominantEmotion: EmotionLabel;
  category: PersonCategory;
  threatScore: number; // 0-100
  warningsSent: number;
}

const SUSPECT_EMOTIONS: EmotionLabel[] = ['angry', 'disgusted'];
const VICTIM_EMOTIONS: EmotionLabel[] = ['fearful', 'sad'];
const HISTORY_THRESHOLD = 5; // minimum readings before classification
const THREAT_RATIO = 0.6; // 60% of history must be negative

export function usePersonTracker() {
  const [trackedPersons, setTrackedPersons] = useState<TrackedPerson[]>([]);
  const [warnings, setWarnings] = useState<{ id: string; message: string; timestamp: number; category: PersonCategory }[]>([]);
  const personsRef = useRef<Map<string, TrackedPerson>>(new Map());

  const classifyPerson = useCallback((history: EmotionLabel[]): { category: PersonCategory; threatScore: number } => {
    if (history.length < HISTORY_THRESHOLD) return { category: 'neutral', threatScore: 0 };

    const recent = history.slice(-10);
    const suspectCount = recent.filter(e => SUSPECT_EMOTIONS.includes(e)).length;
    const victimCount = recent.filter(e => VICTIM_EMOTIONS.includes(e)).length;
    const suspectRatio = suspectCount / recent.length;
    const victimRatio = victimCount / recent.length;

    if (suspectRatio >= THREAT_RATIO) {
      return { category: 'suspect', threatScore: Math.round(suspectRatio * 100) };
    }
    if (victimRatio >= THREAT_RATIO) {
      return { category: 'victim', threatScore: Math.round(victimRatio * 100) };
    }
    return { category: 'neutral', threatScore: Math.round(Math.max(suspectRatio, victimRatio) * 100) };
  }, []);

  const updateTracking = useCallback((faces: DetectedFace[]) => {
    const now = Date.now();
    const map = personsRef.current;

    faces.forEach((face) => {
      const existing = map.get(face.id);
      if (existing) {
        const history = [...existing.emotionHistory, face.emotion].slice(-20);
        const { category, threatScore } = classifyPerson(history);
        
        const prevCategory = existing.category;
        let warningsSent = existing.warningsSent;

        // Send warning on category change to suspect/victim
        if (category !== 'neutral' && category !== prevCategory) {
          warningsSent++;
          const msg = category === 'suspect'
            ? `⚠ SUSPECT DETECTED: ${face.id} showing persistent ${face.emotion} behavior (Score: ${threatScore}%)`
            : `🆘 VICTIM IDENTIFIED: ${face.id} showing signs of ${face.emotion} distress (Score: ${threatScore}%)`;
          
          setWarnings(prev => [{ id: `w-${now}`, message: msg, timestamp: now, category }, ...prev].slice(0, 30));
        }

        map.set(face.id, {
          ...existing,
          lastSeen: now,
          emotionHistory: history,
          dominantEmotion: face.emotion,
          category,
          threatScore,
          warningsSent,
        });
      } else {
        map.set(face.id, {
          id: face.id,
          firstSeen: now,
          lastSeen: now,
          emotionHistory: [face.emotion],
          dominantEmotion: face.emotion,
          category: 'neutral',
          threatScore: 0,
          warningsSent: 0,
        });
      }
    });

    // Remove stale persons (not seen for 10 seconds)
    for (const [id, person] of map.entries()) {
      if (now - person.lastSeen > 10000) map.delete(id);
    }

    setTrackedPersons(Array.from(map.values()));
  }, [classifyPerson]);

  const clearWarnings = useCallback(() => setWarnings([]), []);

  return { trackedPersons, warnings, updateTracking, clearWarnings };
}
