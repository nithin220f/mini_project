import { useCallback, useRef } from 'react';
import type { DetectedFace } from './useEmotionDetection';
import type { TrackedPerson } from './usePersonTracker';

export interface CroppedPerson {
  id: string;
  imageDataUrl: string;
  person: TrackedPerson;
  timestamp: number;
}

export function useFaceCropper() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  const cropFace = useCallback((
    video: HTMLVideoElement,
    face: DetectedFace,
    person: TrackedPerson,
  ): CroppedPerson | null => {
    if (!video.videoWidth || !video.videoHeight) return null;

    const canvas = getCanvas();
    // Expand crop region to include upper body (2x height, 1.5x width)
    const padding = face.width * 0.25;
    const cropX = Math.max(0, face.x - padding);
    const cropY = Math.max(0, face.y - padding);
    const cropW = Math.min(video.videoWidth - cropX, face.width + padding * 2);
    const cropH = Math.min(video.videoHeight - cropY, face.height * 2.2 + padding);

    canvas.width = 120;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 120, 150);
    
    return {
      id: person.id,
      imageDataUrl: canvas.toDataURL('image/jpeg', 0.7),
      person,
      timestamp: Date.now(),
    };
  }, [getCanvas]);

  const cropAllFaces = useCallback((
    video: HTMLVideoElement,
    faces: DetectedFace[],
    persons: TrackedPerson[],
  ): CroppedPerson[] => {
    const personMap = new Map(persons.map(p => [p.id, p]));
    const results: CroppedPerson[] = [];

    faces.forEach(face => {
      const person = personMap.get(face.id);
      if (person) {
        const cropped = cropFace(video, face, person);
        if (cropped) results.push(cropped);
      }
    });

    return results;
  }, [cropFace]);

  return { cropAllFaces };
}
