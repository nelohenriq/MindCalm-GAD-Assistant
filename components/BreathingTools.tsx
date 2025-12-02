import React, { useState, useMemo } from 'react';
import { BreathingSession } from '../types';
import { Wind, Info, History, Zap, Timer, Calendar } from 'lucide-react';
import BreathingCoach, { TechniqueId } from './BreathingCoach';

interface BreathingToolsProps {
  onSessionComplete: (session: BreathingSession) => void;
  sessions: BreathingSession[];
}

const TECHNIQUES: { id: TechniqueId; name: string; description: string; type: 'breath' | 'vns' }[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Used by Navy SEALs for focus and stress regulation.',
    type: 'breath'
  },
  {
    id: '4-7-8',
    name: '4-7-8 Relax',
    description: 'Inhale 4s, Hold 7s, Exhale 8s. A natural tranquilizer for the nervous system, great for sleep.',
    type: 'breath'
  },
  {
    id: 'cyclic',
    name: 'Cyclic Sighing',
    description: 'Double inhale, long exhale. Proven to be the fastest way to reduce physiological arousal.',
    type: 'breath'
  },
  {
    id: 'resonance',
    name: 'Coherent Breathing',
    description: 'Inhale 6s, Exhale 6s. Maximizes Heart Rate Variability (HRV) to balance the nervous system.',
    type: 'breath'
  },
  {
    id: 'panic',
    name: 'Panic SOS',
    description: 'Inhale 4s, Exhale 8s. Double-length exhales trigger the parasympathetic brake to stop panic attacks.',
    type: 'breath'
  },
  {
    id: 'deep',
    name: 'Deep Calm',
    description: 'Inhale 4s, Hold 2s, Exhale 6s. A gentle rhythm to settle a racing mind and reduce tension.',
    type: 'breath'
  },
  {
    id: 'vns-hum',
    name: 'Vagus Humming',
    description: 'Inhale 4s, Hum on Exhale 8s. Vibration stimulates the vagus nerve in the vocal cords to induce relaxation.',
    type: 'vns'
  },
  {
    id: 'vns-gargle',
    name: 'Vagus Gargling',
    description: 'Gargle water to stimulate the pharyngeal muscles and vagus nerve. Improves vagal tone over time.',
    type: 'vns'
  }
];

const BreathingTools: React.FC<BreathingToolsProps> = ({ onSessionComplete, sessions }) => {
  const [activeTechniqueId, setActiveTechniqueId] = useState<TechniqueId | null>(null);

  const handleSessionComplete = (session: BreathingSession) => {
    onSessionComplete(session);
    setActiveTechniqueId(null);
  };

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = Math.round(sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60);
    const vnsCount = sessions.filter(s => s.technique.includes('vns')).length;
    const vnsMinutes = Math.round(sessions.filter(s => s.technique.includes('vns')).reduce((acc, curr) => acc + curr.durationSeconds, 0) / 60);
    
    return { totalSessions, totalMinutes, vnsCount, vnsMinutes };
  }, [sessions]);

  // VNS Goal Progress (e.g., 15 mins a week target)
  const weeklyVnsGoal = 15;
  const vnsProgress = Math.min(100, (stats.vnsMinutes / weeklyVnsGoal) * 100);

  if (activeTechniqueId) {
    return (
      <BreathingCoach 
        techniqueId={activeTechniqueId} 
        onComplete={handleSessionComplete}
        onCancel={() => setActiveTechniqueId(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <header>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Physiological Tools</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Directly calm the nervous system using evidence-based breathing and VNS protocols.
          </p>
      </header>

      {/* Technique Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Breathing Exercises</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TECHNIQUES.filter(t => t.type === 'breath').map((tech) => (
            <div
              key={tech.id}
              onClick={() => setActiveTechniqueId(tech.id)}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Wind size={24} />
                </div>
                <Info size={18} className="text-slate-300 dark:text-slate-600" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {tech.name}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-grow">
                {tech.description}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">Start Session →</span>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Vagus Nerve Stimulation (VNS)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECHNIQUES.filter(t => t.type === 'vns').map((tech) => (
            <div
              key={tech.id}
              onClick={() => setActiveTechniqueId(tech.id)}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <Info size={18} className="text-slate-300 dark:text-slate-600" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {tech.name}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-grow">
                {tech.description}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Start Practice →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Stats & History */}
      <div className="grid md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <History size={20} className="text-slate-400" /> Recent Practice
            </h3>
            {sessions.length > 0 ? (
               <div className="space-y-3">
                  {sessions.slice(0, 3).map(session => (
                     <div key={session.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${session.technique.includes('vns') ? 'bg-indigo-500' : 'bg-teal-500'}`}></div>
                           <div>
                              <p className="font-medium text-slate-700 dark:text-slate-200">
                                 {TECHNIQUES.find(t => t.id === session.technique)?.name || session.technique}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                 {new Date(session.date).toLocaleDateString()} • {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                              </p>
                           </div>
                        </div>
                        {session.anxietyBefore !== undefined && session.anxietyAfter !== undefined && (
                           <div className="flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded">
                              <span className="text-slate-400 dark:text-slate-500 line-through mr-1">{session.anxietyBefore}</span>
                              {session.anxietyAfter}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-slate-400 text-sm italic">No sessions recorded yet.</p>
            )}
         </div>

         <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-6">
             <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2">
                <Timer size={20} /> Usage Stats
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-indigo-800 dark:text-indigo-300">Total Sessions</span>
                   <span className="font-bold text-indigo-900 dark:text-white text-lg">{stats.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-indigo-800 dark:text-indigo-300">Total Minutes</span>
                   <span className="font-bold text-indigo-900 dark:text-white text-lg">{stats.totalMinutes}m</span>
                </div>
                
                {/* VNS Tracking Section */}
                <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1"><Zap size={14}/> VNS Weekly Goal</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.vnsMinutes}/{weeklyVnsGoal}m</span>
                   </div>
                   <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2.5 overflow-hidden">
                      <div 
                         className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                         style={{width: `${vnsProgress}%`}}
                      ></div>
                   </div>
                   {vnsProgress >= 100 && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium text-center">Goal Met! Vagal tone improving.</p>
                   )}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default BreathingTools;