
import React, { useState, useEffect, useMemo } from 'react';
import { LifestyleEntry } from '../types';
import { Moon, Sun, Clock, Smartphone, Coffee, Wine, AlertCircle, Zap, Star, Battery, X } from 'lucide-react';

interface SleepTrackerProps {
  entry: Partial<LifestyleEntry>;
  onChange: (updates: Partial<LifestyleEntry>) => void;
  history: LifestyleEntry[];
}

const SLEEP_GOAL = 8;

const FACTORS = [
  { id: 'screens', label: 'Screens <1h bed', icon: Smartphone, color: 'text-blue-500' },
  { id: 'alcohol', label: 'Alcohol', icon: Wine, color: 'text-rose-500' },
  { id: 'caffeine', label: 'Late Caffeine', icon: Coffee, color: 'text-amber-600' },
  { id: 'stress', label: 'High Stress', icon: AlertCircle, color: 'text-red-500' },
  { id: 'late_meal', label: 'Late Meal', icon: Clock, color: 'text-orange-500' },
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
    score = Math.min(100, Math.max(0, score + 20 - factorPenalty));
    
    return score;
  }, [entry.sleepHours, entry.sleepQuality, entry.sleepFactors]);

  // --- HANDLERS ---
  const toggleFactor = (factorId: string) => {
    const current = entry.sleepFactors || [];
    if (current.includes(factorId)) {
      onChange({ sleepFactors: current.filter(f => f !== factorId) });
    } else {
      onChange({ sleepFactors: [...current, factorId] });
    }
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

            {/* Negative Factors */}
            <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Disruptors</label>
                 <div className="grid grid-cols-2 gap-2">
                     {FACTORS.map(factor => (
                         <button
                            key={factor.id}
                            onClick={() => toggleFactor(factor.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-all ${
                                (entry.sleepFactors || []).includes(factor.id)
                                ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                            }`}
                         >
                            <factor.icon size={14} className={(entry.sleepFactors || []).includes(factor.id) ? 'text-indigo-600 dark:text-indigo-300' : factor.color} />
                            {factor.label}
                         </button>
                     ))}
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
