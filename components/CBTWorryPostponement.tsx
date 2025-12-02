
import React, { useState, useEffect } from 'react';
import { PostponedWorry } from '../types';
import { Clock, Archive, ArrowRight, CheckCircle, Trash2, Shield, CalendarClock } from 'lucide-react';

interface CBTWorryPostponementProps {
  worries: PostponedWorry[];
  addWorry: (worry: PostponedWorry) => void;
  updateWorries: (worries: PostponedWorry[]) => void;
}

const CBTWorryPostponement: React.FC<CBTWorryPostponementProps> = ({ worries, addWorry, updateWorries }) => {
  const [newWorryText, setNewWorryText] = useState('');
  const [scheduledTime, setScheduledTime] = useState('17:00');
  const [scheduledDuration, setScheduledDuration] = useState(20);
  const [isWorryTime, setIsWorryTime] = useState(false);

  // Load schedule preferences
  useEffect(() => {
    const savedTime = localStorage.getItem('worry_schedule_time');
    const savedDuration = localStorage.getItem('worry_schedule_duration');
    if (savedTime) setScheduledTime(savedTime);
    if (savedDuration) setScheduledDuration(Number(savedDuration));
    checkWorryTime(savedTime || '17:00', Number(savedDuration) || 20);
  }, []);

  // Save schedule preferences
  const saveSchedule = (time: string, duration: number) => {
    setScheduledTime(time);
    setScheduledDuration(duration);
    localStorage.setItem('worry_schedule_time', time);
    localStorage.setItem('worry_schedule_duration', duration.toString());
    checkWorryTime(time, duration);
  };

  const checkWorryTime = (time: string, duration: number) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0);
    const end = new Date(start.getTime() + duration * 60000);
    
    // Simple check if current time is within the window (ignores date rollover for simplicity)
    if (now >= start && now <= end) {
      setIsWorryTime(true);
    } else {
      setIsWorryTime(false);
    }
  };

  const handleAddWorry = () => {
    if (!newWorryText.trim()) return;
    const worry: PostponedWorry = {
      id: Date.now().toString(),
      text: newWorryText,
      dateLogged: new Date().toISOString(),
      processed: false
    };
    addWorry(worry);
    setNewWorryText('');
  };

  const toggleProcessed = (id: string) => {
    const updated = worries.map(w => w.id === id ? { ...w, processed: !w.processed } : w);
    updateWorries(updated);
  };

  const deleteWorry = (id: string) => {
    updateWorries(worries.filter(w => w.id !== id));
  };

  const activeWorries = worries.filter(w => !w.processed);
  const processedWorries = worries.filter(w => w.processed);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Education Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex gap-4">
        <div className="p-3 bg-white dark:bg-indigo-900 rounded-full h-fit text-indigo-600 dark:text-indigo-400">
          <Shield size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">The "Worry Postponement" Technique</h3>
          <p className="text-sm text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
            Anxiety often demands immediate attention. This technique helps you regain control by saying: 
            "I will worry about this, but not right now." 
            <br/><br/>
            1. <strong>Capture</strong> the worry immediately.<br/>
            2. <strong>Postpone</strong> it until your scheduled "Worry Time".<br/>
            3. <strong>Process</strong> it only during that specific window.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Scheduler Column */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
             <CalendarClock size={20} className="text-teal-600" /> Schedule Worry Time
           </h4>
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Daily Start Time</label>
               <input 
                 type="time" 
                 value={scheduledTime}
                 onChange={(e) => saveSchedule(e.target.value, scheduledDuration)}
                 className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Minutes)</label>
               <input 
                 type="number" 
                 value={scheduledDuration}
                 onChange={(e) => saveSchedule(scheduledTime, Number(e.target.value))}
                 className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white"
               />
             </div>
             <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${isWorryTime ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full ${isWorryTime ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {isWorryTime ? "It's Worry Time now." : "It is NOT Worry Time currently."}
             </div>
           </div>
        </div>

        {/* Capture Column */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
           <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
             <Archive size={20} className="text-amber-500" /> Capture a Worry
           </h4>
           <div className="flex-1 flex flex-col gap-3">
             <textarea 
               value={newWorryText}
               onChange={(e) => setNewWorryText(e.target.value)}
               placeholder="What is worrying you right now?"
               className="flex-1 w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white resize-none focus:ring-2 focus:ring-amber-500 outline-none"
             />
             <button 
               onClick={handleAddWorry}
               disabled={!newWorryText}
               className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               <ArrowRight size={18} /> Postpone It
             </button>
           </div>
        </div>
      </div>

      {/* Lists */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
           <Clock size={20} className="text-slate-500" /> Waiting List ({activeWorries.length})
        </h4>
        
        {activeWorries.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
            No postponed worries. Your mind is clear!
          </div>
        ) : (
          <div className="grid gap-3">
            {activeWorries.map(w => (
              <div key={w.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3 items-start group">
                 <button 
                   onClick={() => toggleProcessed(w.id)}
                   className="mt-0.5 text-slate-400 hover:text-green-500 transition-colors"
                   title="Mark as Processed"
                 >
                   <CheckCircle size={20} />
                 </button>
                 <div className="flex-1">
                   <p className="text-slate-800 dark:text-white font-medium">{w.text}</p>
                   <p className="text-xs text-slate-400 mt-1">Logged: {new Date(w.dateLogged).toLocaleString()}</p>
                 </div>
                 <button 
                    onClick={() => deleteWorry(w.id)}
                    className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CBTWorryPostponement;
