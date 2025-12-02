
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Check, Wind, Heart } from 'lucide-react';
import AnxietyMeter from './AnxietyMeter';
import { BreathingSession } from '../types';

export type TechniqueId = 'box' | '4-7-8' | 'cyclic' | 'resonance' | 'panic' | 'deep';

interface BreathingCoachProps {
  techniqueId: TechniqueId;
  onComplete: (session: BreathingSession) => void;
  onCancel: () => void;
}

const TECHNIQUES = {
  'box': {
    name: 'Box Breathing',
    description: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s',
    phases: [
      { label: 'Inhale', duration: 4000, scale: 1.5, type: 'inhale' },
      { label: 'Hold', duration: 4000, scale: 1.5, type: 'hold' },
      { label: 'Exhale', duration: 4000, scale: 1.0, type: 'exhale' },
      { label: 'Hold', duration: 4000, scale: 1.0, type: 'hold' },
    ]
  },
  '4-7-8': {
    name: '4-7-8 Relax',
    description: 'Inhale 4s, Hold 7s, Exhale 8s',
    phases: [
      { label: 'Inhale', duration: 4000, scale: 1.5, type: 'inhale' },
      { label: 'Hold', duration: 7000, scale: 1.5, type: 'hold' },
      { label: 'Exhale', duration: 8000, scale: 1.0, type: 'exhale' },
    ]
  },
  'cyclic': {
    name: 'Cyclic Sighing',
    description: 'Double inhale, long exhale',
    phases: [
      { label: 'Inhale', duration: 1500, scale: 1.3, type: 'inhale' },
      { label: 'Inhale', duration: 1500, scale: 1.6, type: 'inhale' },
      { label: 'Exhale', duration: 6000, scale: 1.0, type: 'exhale' },
    ]
  },
  'resonance': {
    name: 'Coherent Breathing',
    description: 'Inhale 6s, Exhale 6s',
    phases: [
      { label: 'Inhale', duration: 6000, scale: 1.5, type: 'inhale' },
      { label: 'Exhale', duration: 6000, scale: 1.0, type: 'exhale' },
    ]
  },
  'panic': {
    name: 'Panic SOS',
    description: 'Inhale 4s, Exhale 8s',
    phases: [
      { label: 'Inhale', duration: 4000, scale: 1.4, type: 'inhale' },
      { label: 'Exhale', duration: 8000, scale: 1.0, type: 'exhale' },
    ]
  },
  'deep': {
    name: 'Deep Calm',
    description: 'Inhale 4s, Hold 2s, Exhale 6s',
    phases: [
      { label: 'Inhale', duration: 4000, scale: 1.4, type: 'inhale' },
      { label: 'Hold', duration: 2000, scale: 1.4, type: 'hold' },
      { label: 'Exhale', duration: 6000, scale: 1.0, type: 'exhale' },
    ]
  }
};

const BreathingCoach: React.FC<BreathingCoachProps> = ({ techniqueId, onComplete, onCancel }) => {
  const [stage, setStage] = useState<'pre' | 'breathing' | 'post'>('pre');
  const [anxietyBefore, setAnxietyBefore] = useState(5);
  const [anxietyAfter, setAnxietyAfter] = useState(5);
  
  // Breathing State
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [instruction, setInstruction] = useState('Get Ready');
  const [timeLeft, setTimeLeft] = useState(0); // Elapsed seconds
  const [currentDuration, setCurrentDuration] = useState(0); // For progress bar of current phase

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number | null>(null);
  const totalDurationRef = useRef(0);

  const currentTech = TECHNIQUES[techniqueId];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const startSession = () => {
    setStage('breathing');
    setIsActive(true);
    setPhaseIndex(0);
    setTimeLeft(0);
    startTimeRef.current = Date.now();
    phaseStartRef.current = Date.now();
    triggerHaptic();
    runAnimation();
  };

  const stopSession = () => {
    setIsActive(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    totalDurationRef.current = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    
    if (totalDurationRef.current >= 10) {
      setStage('post');
      setAnxietyAfter(anxietyBefore); // Default to starting value
    } else {
      // Too short, just cancel
      onCancel();
    }
  };

  const finishSession = () => {
    const session: BreathingSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      technique: techniqueId,
      durationSeconds: totalDurationRef.current,
      completed: true,
      anxietyBefore,
      anxietyAfter
    };
    onComplete(session);
  };

  const runAnimation = () => {
    const now = Date.now();
    const phase = currentTech.phases[phaseIndex];
    const phaseStart = phaseStartRef.current || now;
    const elapsedInPhase = now - phaseStart;
    
    setCurrentDuration(phase.duration);

    // Global Timer
    const start = startTimeRef.current || now;
    setTimeLeft(Math.floor((now - start) / 1000));

    if (elapsedInPhase >= phase.duration) {
      // Phase Complete
      const nextIndex = (phaseIndex + 1) % currentTech.phases.length;
      setPhaseIndex(nextIndex);
      phaseStartRef.current = now;
      triggerHaptic();
    } else {
      // Interpolate Scale
      const progress = elapsedInPhase / phase.duration;
      const prevScale = phaseIndex === 0 
        ? currentTech.phases[currentTech.phases.length - 1].scale 
        : currentTech.phases[phaseIndex - 1].scale;
      const targetScale = phase.scale;
      
      const currentScale = prevScale + (targetScale - prevScale) * progress;
      setScale(currentScale);
      setInstruction(phase.label);
    }

    requestRef.current = requestAnimationFrame(runAnimation);
  };

  // --- PRE ASSESSMENT ---
  if (stage === 'pre') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Check-in</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-xs">
          How anxious do you feel right now?
        </p>
        
        <div className="w-full max-w-sm mb-8">
           <AnxietyMeter level={anxietyBefore} onChange={setAnxietyBefore} size="large" />
        </div>

        <div className="flex gap-4">
          <button onClick={onCancel} className="px-6 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={startSession} className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2">
            <Play size={20} fill="currentColor" /> Start Breathing
          </button>
        </div>
      </div>
    );
  }

  // --- POST ASSESSMENT ---
  if (stage === 'post') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Well Done</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-xs">
          How do you feel after {Math.floor(totalDurationRef.current / 60)}m {totalDurationRef.current % 60}s?
        </p>
        
        <div className="w-full max-w-sm mb-8">
           <AnxietyMeter level={anxietyAfter} onChange={setAnxietyAfter} size="large" />
           {anxietyBefore > anxietyAfter && (
             <p className="text-center text-emerald-500 font-medium mt-4 animate-bounce">
               You reduced your anxiety by {anxietyBefore - anxietyAfter} points!
             </p>
           )}
        </div>

        <button onClick={finishSession} className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2">
           <Check size={20} /> Finish Session
        </button>
      </div>
    );
  }

  // --- BREATHING VISUALIZER ---
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[500px] p-6 animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
         <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{currentTech.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
         </div>

         {/* The Breathing Circle */}
         <div className="relative flex items-center justify-center w-64 h-64 mb-12">
            {/* Outer Glow */}
            <div 
              className="absolute rounded-full bg-teal-400/20 dark:bg-teal-500/10 blur-2xl transition-all duration-75"
              style={{ width: `${280 * scale}px`, height: `${280 * scale}px` }}
            />
            
            {/* Main Circle */}
            <div 
               className="flex flex-col items-center justify-center rounded-full shadow-2xl transition-all duration-75 backdrop-blur-sm border-4 border-white/50 dark:border-slate-700/50"
               style={{ 
                 width: `${200 * scale}px`, 
                 height: `${200 * scale}px`,
                 backgroundColor: instruction === 'Hold' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(20, 184, 166, 0.1)'
               }}
            >
               <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-widest uppercase">
                 {instruction}
               </span>
               <Wind 
                  size={24} 
                  className={`mt-2 transition-colors ${instruction === 'Hold' ? 'text-indigo-500' : 'text-teal-500'}`} 
               />
            </div>
         </div>

         <div className="flex gap-4">
            <button 
              onClick={isActive ? stopSession : startSession}
              className={`px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all flex items-center gap-2 ${
                isActive 
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white' 
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
               {isActive ? <><Pause fill="currentColor"/> Stop</> : <><Play fill="currentColor"/> Resume</>}
            </button>
         </div>
         
         <p className="mt-8 text-slate-400 text-sm max-w-xs text-center">
           Sync your breath with the circle. Inhale as it expands, exhale as it shrinks.
         </p>
      </div>
    </div>
  );
};

export default BreathingCoach;
