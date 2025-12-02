
import React, { useState, useEffect, useMemo } from 'react';
import { LifestyleEntry } from '../types';
import { Moon, Sun, Clock, Smartphone, Coffee, Wine, AlertCircle, Zap, Star, Battery, X, ToggleLeft, ToggleRight, Check } from 'lucide-react';

interface SleepTrackerProps {
  entry: Partial<LifestyleEntry>;
  onChange: (updates: Partial<LifestyleEntry>) => void;
  history: LifestyleEntry[];
}

const SLEEP_GOAL = 8;

const FACTORS = [
  { id: 'screens', label: 'Screens <1h', icon: Smartphone, color: 'text-blue-500' },
  { id: 'alcohol', label: 'Alcohol', icon: Wine, color: 'text-rose-500' },
  { id: 'caffeine', label: 'Late Caffeine', icon: Coffee, color: 'text-amber-600' },
  { id: 'late_meal', label: 'Late Meal', icon: Clock, color: 'text-orange-500' },
  { id: 'stress', label: 'High Stress', icon: AlertCircle, color: 'text-red-500' },
];

const SleepTracker: React.FC<SleepTrackerProps> = ({ entry, onChange, history }) => {
  const [showWakeLight, setShowWakeLight] = useState(false);
  const [wakeLightOpacity, setWakeLightOpacity] = useState(0);

  // --- DERIVED STATE ---
  const sleepDebt = useMemo(() => {
    // Calculate debt over last 7 entries
    const recent = history.slice(-7);
    if (recent.length === 0) return 0;
    
    let totalDeficit = 0;
    recent.forEach(h => {
      if (h.sleepHours < SLEEP_GOAL) {
        totalDeficit += (SLEEP_GOAL - h.sleepHours);
      }
    });
    return parseFloat(totalDeficit.toFixed(1));
  }, [history]);

  const sleepScore = useMemo(() => {
    if (!entry.sleepHours || !entry.sleepQuality) return 0;
    
    let score = 0;
    
    // Duration (Max 50)
    // Optimal 7-9 hours
    if (entry.sleepHours >= 7 && entry.sleepHours <= 9) score += 50;
    else if (entry.sleepHours >= 6) score += 40;
    else if (entry.sleepHours >= 5) score += 20;
    else score += 10;
    
    // Quality (Max 30)
    score += (entry.sleepQuality * 6);
    
    // Factors (Max 20, subtractive)
    const factorPenalty = (entry.sleepFactors?.length || 0) * 5;
    const stressPenalty = (entry.stressLevel || 0) * 2;
    
    score = Math.min(100, Math.max(0, score + 20 - factorPenalty - stressPenalty));
    
    return score;
  }, [entry.sleepHours, entry.sleepQuality, entry.sleepFactors, entry.stressLevel]);

  // --- HANDLERS ---
  const toggleFactor = (factorId: string) => {
    const current = entry.sleepFactors || [];
    let updates: Partial<LifestyleEntry> = {};

    if (current.includes(factorId)) {
      // Remove
      updates.sleepFactors = current.filter(f => f !== factorId);
      // Reset stress level if stress factor is removed
      if (factorId === 'stress') {
          updates.stressLevel = 0;
      }
    } else {
      // Add
      updates.sleepFactors = [...current, factorId];
      // Default stress level if stress factor is added
      if (factorId === 'stress') {
          updates.stressLevel = 2; // Default to Moderate
      }
    }
    onChange(updates);
  };

  const handleWakeLight = () => {
    setShowWakeLight(true);
    // Animate opacity
    let op = 0;
    const interval = setInterval(() => {
      op += 0.01;
      setWakeLightOpacity(op);
      if (op >= 1) clearInterval(interval);
    }, 100); // 10 seconds to full brightness for demo
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-colors">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Moon className="text-indigo-600 dark:text-indigo-400" size={20} /> 
            Sleep Tracker
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor quality & hygiene</p>
        </div>
        
        <div className="flex flex-col items-end">
            <div className={`text-2xl font-bold ${sleepScore >= 80 ? 'text-green-600 dark:text-green-400' : sleepScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {sleepScore}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Sleep Score</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: TIMING */}
        <div className="space-y-6">
            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Bedtime</label>
                    <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="time" 
                        value={entry.bedTime || '22:00'} 
                        onChange={(e) => onChange({ bedTime: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Wake Up</label>
                    <div className="relative">
                        <Sun className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                        type="time" 
                        value={entry.wakeTime || '07:00'} 
                        onChange={(e) => onChange({ wakeTime: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    </div>
                </div>
            </div>

            {/* Duration & Debt */}
            <div className="flex gap-4">
                <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1">Duration</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-white">{entry.sleepHours}h</span>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                     <span className="text-xs text-slate-400 block mb-1">Sleep Debt (7d)</span>
                     <div className="flex items-center gap-1">
                        <Battery size={16} className={sleepDebt > 5 ? 'text-rose-500' : 'text-green-500'} />
                        <span className={`text-xl font-bold ${sleepDebt > 0 ? 'text-rose-500' : 'text-green-500'}`}>
                            {sleepDebt > 0 ? `-${sleepDebt}h` : 'None'}
                        </span>
                     </div>
                </div>
            </div>

            {/* Wake Up Light Button */}
            <button 
                onClick={handleWakeLight}
                className="w-full py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            >
                <Sun size={16} /> Simulate Sunrise
            </button>
        </div>

        {/* RIGHT COLUMN: QUALITY & FACTORS */}
        <div className="space-y-6">
            
            {/* Quality Rating */}
            <div className="text-center">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quality Rating</label>
                <div className="flex justify-center gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                        key={star}
                        onClick={() => onChange({ sleepQuality: star })}
                        className={`p-1.5 rounded-full transition-all ${
                            (entry.sleepQuality || 0) >= star 
                            ? 'text-amber-400 scale-110' 
                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-200'
                        }`}
                    >
                        <Star size={24} fill={(entry.sleepQuality || 0) >= star ? "currentColor" : "none"} />
                    </button>
                    ))}
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {(entry.sleepQuality || 0) === 1 ? 'Poor' : (entry.sleepQuality || 0) === 5 ? 'Excellent' : 'Average'}
                </span>
            </div>

            {/* Factors Grid */}
            <div className="space-y-3">
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Sleep Disruptors</label>
                 <div className="grid grid-cols-2 gap-3">
                     {FACTORS.map(factor => {
                         const isActive = (entry.sleepFactors || []).includes(factor.id);
                         const isStress = factor.id === 'stress';
                         const colSpan = isStress && isActive ? 'col-span-2' : 'col-span-1';

                         return (
                            <div key={factor.id} className={`${colSpan} p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
                                isActive 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`} onClick={(e) => {
                                toggleFactor(factor.id);
                            }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-full ${isActive ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            <factor.icon size={16} />
                                        </div>
                                        <span className={`text-sm font-medium ${isActive ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {factor.label}
                                        </span>
                                    </div>
                                    <div className={`transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {isActive ? <Check size={20} className="stroke-[3]" /> : <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600" />}
                                    </div>
                                </div>

                                {/* Specific Stress Intensity Selector */}
                                {isStress && isActive && (
                                    <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-800/50 flex gap-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                        {[1, 2, 3].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => onChange({ stressLevel: level })}
                                                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors border ${
                                                    entry.stressLevel === level
                                                    ? level === 1 
                                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-900' 
                                                        : level === 2
                                                            ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-900'
                                                            : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-900'
                                                    : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                }`}
                                            >
                                                {level === 1 ? 'Mild' : level === 2 ? 'Mod' : 'High'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                         );
                     })}
                 </div>
            </div>

        </div>
      </div>

      {/* Wake Light Overlay */}
      {showWakeLight && (
        <div 
            className="fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center"
            style={{ backgroundColor: `rgba(255, 250, 200, ${wakeLightOpacity})` }}
        >
             <div className="absolute top-8 right-8 z-[101]">
                 <button onClick={() => setShowWakeLight(false)} className="p-4 bg-black/10 rounded-full hover:bg-black/20 text-slate-800">
                     <X size={32} />
                 </button>
             </div>
             {wakeLightOpacity < 1 && (
                 <div className="text-slate-800/50 font-bold text-2xl animate-pulse">Rise and Shine...</div>
             )}
        </div>
      )}

    </div>
  );
};

export default SleepTracker;
