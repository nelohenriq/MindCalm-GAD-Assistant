
import React, { useState } from 'react';
import { BreathingSession } from '../types';
import { Wind, Info, History } from 'lucide-react';
import BreathingCoach, { TechniqueId } from './BreathingCoach';

interface BreathingToolsProps {
  onSessionComplete: (session: BreathingSession) => void;
}

const TECHNIQUES: { id: TechniqueId; name: string; description: string }[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Used by Navy SEALs for focus and stress regulation.'
  },
  {
    id: '4-7-8',
    name: '4-7-8 Relax',
    description: 'Inhale 4s, Hold 7s, Exhale 8s. A natural tranquilizer for the nervous system, great for sleep.'
  },
  {
    id: 'cyclic',
    name: 'Cyclic Sighing',
    description: 'Double inhale, long exhale. Proven to be the fastest way to reduce physiological arousal.'
  },
  {
    id: 'resonance',
    name: 'Coherent Breathing',
    description: 'Inhale 6s, Exhale 6s. Maximizes Heart Rate Variability (HRV) to balance the nervous system.'
  },
  {
    id: 'panic',
    name: 'Panic SOS',
    description: 'Inhale 4s, Exhale 8s. Double-length exhales trigger the parasympathetic brake to stop panic attacks.'
  },
  {
    id: 'deep',
    name: 'Deep Calm',
    description: 'Inhale 4s, Hold 2s, Exhale 6s. A gentle rhythm to settle a racing mind and reduce tension.'
  }
];

const BreathingTools: React.FC<BreathingToolsProps> = ({ onSessionComplete }) => {
  const [activeTechniqueId, setActiveTechniqueId] = useState<TechniqueId | null>(null);

  const handleSessionComplete = (session: BreathingSession) => {
    onSessionComplete(session);
    setActiveTechniqueId(null);
  };

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
            Directly calm the nervous system using evidence-based breathing protocols.
          </p>
      </header>

      {/* Technique Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TECHNIQUES.map((tech) => (
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

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 flex gap-4 items-start">
         <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-indigo-600 dark:text-indigo-400">
            <History size={20} />
         </div>
         <div>
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Why Breathwork?</h4>
            <p className="text-indigo-800 dark:text-indigo-300 text-sm leading-relaxed">
               Changing your breathing pattern is the most direct way to signal safety to your brain's vagus nerve. 
               Unlike cognitive strategies ("don't worry"), physiological sighs and slow exhales physically 
               reduce heart rate and adrenaline within minutes.
            </p>
         </div>
      </div>
    </div>
  );
};

export default BreathingTools;
