import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, Shield, Activity, BarChart3, Radio, ScrollText, Users, Grid3X3, AlertTriangle } from 'lucide-react';
import { useWebcam } from '@/hooks/useWebcam';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { useAudioEmotion } from '@/hooks/useAudioEmotion';
import { usePersonTracker } from '@/hooks/usePersonTracker';
import { useFaceCropper, type CroppedPerson } from '@/hooks/useFaceCropper';
import { PanelCard } from '@/components/dashboard/PanelCard';
import { WebcamFeed } from '@/components/dashboard/WebcamFeed';
import { ThreatIndicator } from '@/components/dashboard/ThreatIndicator';
import { EmotionChart } from '@/components/dashboard/EmotionChart';
import { AudioPanel } from '@/components/dashboard/AudioPanel';
import { EmotionLog } from '@/components/dashboard/EmotionLog';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PersonTracker } from '@/components/dashboard/PersonTracker';
import { MonitoringGrid } from '@/components/dashboard/MonitoringGrid';

export default function Dashboard() {
  const { videoRef, isActive: cameraActive, error: cameraError, start: startCamera, stop: stopCamera } = useWebcam();
  const { faces, stats, threatLevel, isModelLoaded, isLoading, loadModels, startDetection, stopDetection } = useEmotionDetection();
  const { audioEmotion, volume, isListening, startListening, stopListening } = useAudioEmotion();
  const { trackedPersons, warnings, updateTracking, clearWarnings } = usePersonTracker();
  const { cropAllFaces } = useFaceCropper();
  const [croppedPersons, setCroppedPersons] = useState<CroppedPerson[]>([]);
  const [time, setTime] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
  const alertTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      stopCamera();
      stopDetection();
      setCroppedPersons([]);
    } else {
      await startCamera();
      if (videoRef.current && isModelLoaded) {
        startDetection(videoRef.current);
      }
    }
  }, [cameraActive, stopCamera, stopDetection, startCamera, videoRef, isModelLoaded, startDetection]);

  const toggleAudio = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, stopListening, startListening]);

  // Start detection when model loads and camera is already active
  useEffect(() => {
    if (isModelLoaded && cameraActive && videoRef.current) {
      startDetection(videoRef.current);
    }
  }, [isModelLoaded, cameraActive, videoRef, startDetection]);

  // Update person tracking when faces change
  useEffect(() => {
    if (faces.length > 0) {
      updateTracking(faces);
    }
  }, [faces, updateTracking]);

  // Crop faces for monitoring grid
  useEffect(() => {
    if (faces.length > 0 && videoRef.current && trackedPersons.length > 0) {
      const cropped = cropAllFaces(videoRef.current, faces, trackedPersons);
      setCroppedPersons(prev => {
        const map = new Map(prev.map(c => [c.id, c]));
        cropped.forEach(c => map.set(c.id, c));
        // Remove stale entries
        const activeIds = new Set(trackedPersons.map(p => p.id));
        for (const key of map.keys()) {
          if (!activeIds.has(key)) map.delete(key);
        }
        return Array.from(map.values()).slice(0, 20);
      });
    }
  }, [faces, trackedPersons, videoRef, cropAllFaces]);

  // Multimodal threat alert: trigger when suspects detected + audio stress
  const hasSuspects = trackedPersons.some(p => p.category === 'suspect');
  const audioStress = audioEmotion === 'stress' || audioEmotion === 'aggression';
  const multimodalThreat = (threatLevel === 'high') || (hasSuspects && audioStress);

  useEffect(() => {
    if (multimodalThreat && !showAlert) {
      setShowAlert(true);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = window.setTimeout(() => setShowAlert(false), 8000);
    }
  }, [multimodalThreat, showAlert]);

  // Combined threat score
  const facialThreatScore = faces.length > 0
    ? Math.round((faces.filter(f => ['angry', 'fearful', 'disgusted'].includes(f.emotion)).length / faces.length) * 100)
    : 0;
  const audioThreatScore = audioStress ? 70 : audioEmotion === 'neutral' ? 10 : 30;
  const combinedThreatScore = Math.round(facialThreatScore * 0.6 + audioThreatScore * 0.4);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Full-screen threat alert overlay */}
      <AnimatePresence>
        {showAlert && multimodalThreat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-20"
          >
            <motion.div
              initial={{ y: -40, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -40, scale: 0.9 }}
              className="pointer-events-auto bg-destructive/95 border-2 border-destructive text-destructive-foreground px-8 py-4 rounded-lg shadow-2xl flex items-center gap-4"
            >
              <AlertTriangle className="w-8 h-8 animate-pulse" />
              <div>
                <p className="font-mono text-sm font-bold tracking-wider">⚠ SECURITY ALERT</p>
                <p className="font-mono text-xs opacity-90">
                  Multimodal threat detected — Facial + Audio analysis confirm high-risk behavior. Threat Score: {combinedThreatScore}%
                </p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="font-mono text-xs border border-destructive-foreground/30 px-3 py-1 rounded hover:bg-destructive-foreground/10"
              >
                DISMISS
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-mono text-sm font-bold tracking-widest text-foreground">
                SENTINEL
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
                MULTIMODAL CROWD SECURITY SYSTEM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {multimodalThreat && (
              <span className="font-mono text-[10px] font-bold text-destructive animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> THREAT ACTIVE
              </span>
            )}
            <StatusBadge
              status={isModelLoaded ? 'active' : isLoading ? 'warning' : 'inactive'}
              label={isModelLoaded ? 'AI Ready' : isLoading ? 'Loading...' : 'Offline'}
            />
            <span className="font-mono text-xs text-muted-foreground">
              {time.toLocaleDateString()} {time.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="container mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={toggleCamera}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-medium tracking-wider transition-all border bg-card hover:bg-secondary disabled:opacity-50 text-foreground"
        >
          {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          {cameraActive ? 'STOP CAMERA' : 'START CAMERA'}
        </button>
        <button
          onClick={toggleAudio}
          className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-medium tracking-wider transition-all border bg-card hover:bg-secondary text-foreground"
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {isListening ? 'STOP AUDIO' : 'START AUDIO'}
        </button>
        {cameraError && (
          <span className="font-mono text-xs text-destructive">{cameraError}</span>
        )}
        {/* Multimodal threat score */}
        <div className="ml-auto flex items-center gap-2 font-mono text-[10px]">
          <span className="text-muted-foreground">COMBINED THREAT:</span>
          <span className={
            combinedThreatScore > 60 ? 'text-destructive font-bold' :
            combinedThreatScore > 30 ? 'text-warning font-bold' :
            'text-primary font-bold'
          }>
            {combinedThreatScore}%
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <main className="container mx-auto px-4 pb-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            <PanelCard title="Live Feed" icon={<Radio className="w-3.5 h-3.5" />}>
              <WebcamFeed videoRef={videoRef} faces={faces} isActive={cameraActive} />
            </PanelCard>

            <PanelCard title="Emotion Distribution" icon={<BarChart3 className="w-3.5 h-3.5" />}>
              <EmotionChart stats={stats} />
            </PanelCard>
          </div>

          {/* Right Column: Panels */}
          <div className="space-y-4">
            <PanelCard
              title="Threat Assessment"
              icon={<Shield className="w-3.5 h-3.5" />}
              variant={threatLevel === 'high' ? 'alert' : 'default'}
            >
              <ThreatIndicator level={threatLevel} faceCount={faces.length} />
            </PanelCard>

            <PanelCard
              title="Person Tracking"
              icon={<Users className="w-3.5 h-3.5" />}
              variant={warnings.length > 0 ? 'alert' : 'default'}
            >
              <PersonTracker persons={trackedPersons} warnings={warnings} onClearWarnings={clearWarnings} />
            </PanelCard>

            <PanelCard title="Speech Analysis" icon={<Activity className="w-3.5 h-3.5" />}>
              <AudioPanel emotion={audioEmotion} volume={volume} isListening={isListening} />
            </PanelCard>

            <PanelCard title="Event Log" icon={<ScrollText className="w-3.5 h-3.5" />}>
              <EmotionLog faces={faces} audioEmotion={audioEmotion} threatLevel={threatLevel} />
            </PanelCard>

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {[
                { label: 'FACES', value: faces.length, color: 'text-accent' },
                { label: 'THREAT', value: threatLevel.toUpperCase(), color: threatLevel === 'high' ? 'text-destructive' : threatLevel === 'medium' ? 'text-warning' : 'text-primary' },
                { label: 'AUDIO', value: audioEmotion.toUpperCase(), color: 'text-foreground' },
                { label: 'SCORE', value: `${combinedThreatScore}%`, color: combinedThreatScore > 60 ? 'text-destructive' : combinedThreatScore > 30 ? 'text-warning' : 'text-primary' },
              ].map(s => (
                <div key={s.label} className="bg-card border rounded-md p-3 text-center">
                  <p className="font-mono text-[10px] text-muted-foreground tracking-wider">{s.label}</p>
                  <p className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Monitoring Grid - Full Width */}
        <PanelCard
          title="Surveillance Monitoring Grid"
          icon={<Grid3X3 className="w-3.5 h-3.5" />}
          variant={hasSuspects ? 'alert' : 'default'}
        >
          <MonitoringGrid croppedPersons={croppedPersons} />
        </PanelCard>
      </main>
    </div>
  );
}
