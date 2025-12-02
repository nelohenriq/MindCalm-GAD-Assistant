
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface AnxietyMeterProps {
  level: number; // 0-10
  onChange?: (level: number) => void;
  previousLevel?: number;
  history?: { date: string; value: number }[];
  readOnly?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const AnxietyMeter: React.FC<AnxietyMeterProps> = ({ 
  level, 
  onChange, 
  previousLevel, 
  history = [], 
  readOnly = false,
  size = 'medium',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animateChange, setAnimateChange] = useState(false);

  // Trigger animation/haptics on level change
  useEffect(() => {
    setAnimateChange(true);
    const timer = setTimeout(() => setAnimateChange(false), 300);
    
    // Haptic feedback if available and not read-only
    // Using a slightly longer duration (10ms) for a distinct "step" feel
    if (!readOnly && typeof navigator !== 'undefined' && navigator.vibrate && onChange) {
      navigator.vibrate(10);
    }
    
    return () => clearTimeout(timer);
  }, [level, readOnly, onChange]);

  const getColor = (val: number) => {
    if (val <= 3) return 'bg-emerald-500 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900';
    if (val <= 7) return 'bg-amber-500 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-900';
    return 'bg-rose-500 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-900';
  };
  
  const getLabel = (val: number) => {
    if (val === 0) return 'None';
    if (val <= 3) return 'Mild';
    if (val <= 7) return 'Moderate';
    return 'Severe';
  };

  const trend = previousLevel !== undefined ? level - previousLevel : 0;

  const handleExpand = () => {
    if (history.length > 0) setIsExpanded(!isExpanded);
  };

  // Adjust height based on size prop
  const trackHeight = {
    small: 'h-2',
    medium: 'h-6',
    large: 'h-10'
  };

  const chartData = history.map((h, i) => ({ index: i, value: h.value }));

  // --- READ ONLY SMALL VIEW (Dashboard) ---
  if (readOnly && size === 'small') {
     return (
        <div className={`w-full flex gap-0.5 ${className}`}>
           {[...Array(10)].map((_, i) => (
             <div 
                key={i} 
                className={`flex-1 h-2 rounded-sm transition-colors ${i < level ? getColor(level).split(' ')[0] : 'bg-slate-200 dark:bg-slate-700'}`} 
             />
           ))}
        </div>
     );
  }

  // --- INTERACTIVE / FULL VIEW ---
  return (
    <div className={`w-full transition-all ${className} ${isExpanded ? 'p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700' : ''}`}>
      
      {/* Header / Value Display */}
      <div className="flex justify-between items-end mb-3">
        <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-xl transition-colors duration-300 ${getColor(level).replace('text-', 'bg-opacity-20 ')}`}>
               {level}
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Anxiety Level</span>
                <span className={`text-sm font-bold transition-colors duration-300 ${getColor(level).split(' ')[1]}`}>
                    {getLabel(level)}
                </span>
            </div>
        </div>

        {previousLevel !== undefined && (
            <div className="flex flex-col items-end">
                 <span className="text-[10px] text-slate-400 uppercase font-semibold">Trend</span>
                 <div className="flex items-center gap-1 text-sm font-bold">
                    {trend > 0 && <TrendingUp size={16} className="text-rose-500" />}
                    {trend < 0 && <TrendingDown size={16} className="text-emerald-500" />}
                    {trend === 0 && <Minus size={16} className="text-slate-400" />}
                    <span className={trend > 0 ? 'text-rose-500' : trend < 0 ? 'text-emerald-500' : 'text-slate-500'}>
                       {trend === 0 ? 'Stable' : `${Math.abs(trend)} pts`}
                    </span>
                 </div>
            </div>
        )}
      </div>

      {/* Segmented Meter */}
      <div className={`relative w-full ${trackHeight[size]} mb-2`}>
         
         {/* Segments Container */}
         <div className="absolute inset-0 flex gap-1 z-0">
             {[...Array(10)].map((_, i) => {
                 const isActive = i < level;
                 const isPrevious = !readOnly && previousLevel !== undefined && i === previousLevel - 1;
                 const activeColor = getColor(level).split(' ')[0]; // Extract bg class e.g., 'bg-emerald-500'

                 return (
                     <div 
                        key={i} 
                        className={`
                           flex-1 h-full rounded-md transition-all duration-200 relative
                           ${isActive ? activeColor : 'bg-slate-100 dark:bg-slate-700'}
                           ${isActive ? 'shadow-sm' : ''}
                        `}
                     >
                         {/* Previous Level Ghost Marker */}
                         {isPrevious && (
                             <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-[140%] bg-slate-400/50 dark:bg-slate-400/50 z-20 flex flex-col justify-between pointer-events-none">
                                <div className="w-1.5 h-1.5 -ml-0.5 rounded-full bg-slate-400"></div>
                                <div className="w-1.5 h-1.5 -ml-0.5 rounded-full bg-slate-400"></div>
                             </div>
                         )}
                     </div>
                 );
             })}
         </div>

         {/* Interactive Slider Overlay */}
         {!readOnly && (
            <input 
                type="range" 
                min="0" 
                max="10" 
                step="1"
                value={level}
                onChange={(e) => onChange && onChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Set anxiety level"
            />
         )}
      </div>

      {/* Helper Labels */}
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-300 dark:text-slate-600 px-1">
          <span>Calm</span>
          <span>Panic</span>
      </div>

      {/* Expand History Button */}
      {history.length > 0 && (
          <button 
            onClick={handleExpand}
            className="w-full flex items-center justify-center mt-3 pt-3 text-xs text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors gap-1 border-t border-slate-50 dark:border-slate-700/50"
          >
             {isExpanded ? 'Hide History' : 'View History'} 
             {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
      )}

      {/* Expanded History Chart */}
      {isExpanded && history.length > 0 && (
          <div className="h-32 mt-4 animate-fade-in bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <YAxis hide domain={[0, 10]} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f43f5e" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#f43f5e' }}
                      />
                  </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2">
                 <span>{new Date(history[0].date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                 <span>Today</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default AnxietyMeter;
