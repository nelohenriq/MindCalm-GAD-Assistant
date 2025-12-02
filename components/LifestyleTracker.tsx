
import React, { useState, useMemo, useEffect } from 'react';
import { LifestyleEntry, MoodEntry, Workout } from '../types';
import { Moon, Coffee, Droplets, Dumbbell, Save, Activity, Users, AlertCircle, BarChart2, Plus, Star, Clock, Sun, Layout } from 'lucide-react';
import { getCopingStrategy } from '../services/geminiService';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import AnxietyMeter from './AnxietyMeter';
import SleepTracker from './SleepTracker';
import ExercisePlanner from './ExercisePlanner';

interface LifestyleTrackerProps {
  onSaveEntry: (lifestyle: LifestyleEntry, mood: MoodEntry) => void;
  lifestyleHistory: LifestyleEntry[];
  moodHistory: MoodEntry[];
  workouts: Workout[];
  setWorkouts: (workouts: Workout[]) => void;
}

const SYMPTOMS_LIST = [
  "Racing Heart", "Muscle Tension", "Restlessness", "Fatigue", 
  "Irritability", "Sleep Problems", "Difficulty Concentrating", "Excessive Worry"
];

const LifestyleTracker: React.FC<LifestyleTrackerProps> = ({ onSaveEntry, lifestyleHistory, moodHistory, workouts, setWorkouts }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'trends'>('log');
  const [showExercisePlanner, setShowExercisePlanner] = useState(false);
  
  // Form State
  const [sleep, setSleep] = useState(7.5);
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepQuality, setSleepQuality] = useState(3); // 1-5
  const [sleepFactors, setSleepFactors] = useState<string[]>([]);
  const [stressLevel, setStressLevel] = useState(0);

  const [exercise, setExercise] = useState(30);
  const [caffeine, setCaffeine] = useState(1);
  const [water, setWater] = useState(4);
  const [social, setSocial] = useState(30);
  const [moodScore, setMoodScore] = useState(5);
  const [anxietyScore, setAnxietyScore] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [moodNotes, setMoodNotes] = useState('');
  
  // Interaction State
  const [isSaved, setIsSaved] = useState(false);
  const [aiTip, setAiTip] = useState('');

  // Calculate sleep duration from times
  useEffect(() => {
    if (!bedTime || !wakeTime) return;
    
    const start = new Date(`2000-01-01T${bedTime}`);
    const end = new Date(`2000-01-01T${wakeTime}`);
    
    // Handle overnight (if wake time is earlier than bed time, assume next day)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    setSleep(parseFloat(durationHours.toFixed(1)));
  }, [bedTime, wakeTime]);

  const handleSleepUpdate = (updates: Partial<LifestyleEntry>) => {
    if (updates.bedTime !== undefined) setBedTime(updates.bedTime);
    if (updates.wakeTime !== undefined) setWakeTime(updates.wakeTime);
    if (updates.sleepQuality !== undefined) setSleepQuality(updates.sleepQuality);
    if (updates.sleepFactors !== undefined) setSleepFactors(updates.sleepFactors);
    if (updates.stressLevel !== undefined) setStressLevel(updates.stressLevel);
  };

  // Prepare Chart Data
  const chartData = useMemo(() => {
    const dataMap = new Map<string, any>();
    
    // Process Lifestyle
    lifestyleHistory.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dataMap.has(date)) dataMap.set(date, { date });
      const current = dataMap.get(date);
      current.Sleep = entry.sleepHours;
      current.SleepQuality = entry.sleepQuality || 3;
      current.Exercise = entry.exerciseMinutes;
      current.Social = entry.socialMinutes;
      current.Caffeine = entry.caffeineIntake;
      current.Water = entry.waterIntake;
    });

    // Process Moods
    moodHistory.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dataMap.has(date)) dataMap.set(date, { date });
      const current = dataMap.get(date);
      current.Mood = entry.score;
      current.Anxiety = entry.anxietyScore;
    });

    return Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-14);
  }, [lifestyleHistory, moodHistory]);

  const averages = useMemo(() => {
    if (lifestyleHistory.length === 0) return null;
    const total = lifestyleHistory.length;
    const sum = (key: keyof LifestyleEntry) => lifestyleHistory.reduce((acc, curr) => acc + (curr[key] as number || 0), 0);
    return {
      sleep: (sum('sleepHours') / total).toFixed(1),
      sleepQuality: (sum('sleepQuality') / total).toFixed(1),
      exercise: Math.round(sum('exerciseMinutes') / total),
      social: Math.round(sum('socialMinutes') / total),
      caffeine: (sum('caffeineIntake') / total).toFixed(1)
    };
  }, [lifestyleHistory]);

  // Data for AnxietyMeter history
  const recentAnxietyHistory = useMemo(() => {
     return moodHistory.slice(-10).map(m => ({ date: m.date, value: m.anxietyScore || 0 }));
  }, [moodHistory]);

  const previousAnxiety = recentAnxietyHistory.length > 0 ? recentAnxietyHistory[recentAnxietyHistory.length - 1].value : undefined;

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSave = async () => {
    const today = new Date().toISOString();
    const lifestyle: LifestyleEntry = {
      date: today,
      sleepHours: sleep,
      sleepQuality: sleepQuality,
      bedTime: bedTime,
      wakeTime: wakeTime,
      sleepFactors: sleepFactors,
      stressLevel: stressLevel,
      exerciseMinutes: exercise,
      caffeineIntake: caffeine,
      waterIntake: water,
      socialMinutes: social
    };
    const mood: MoodEntry = {
      id: Date.now().toString(),
      date: today,
      score: moodScore,
      anxietyScore: anxietyScore,
      symptoms: selectedSymptoms,
      notes: moodNotes
    };

    onSaveEntry(lifestyle, mood);
    
    // Use Gemini to suggest coping strategies if anxiety is high
    if (anxietyScore >= 6) {
        const tip = await getCopingStrategy(anxietyScore, selectedSymptoms, moodNotes);
        setAiTip(tip);
    } else {
        setAiTip('');
    }
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setActiveTab('trends'); // Switch to trends after saving to see impact
    }, 4000); 
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* EXERCISE PLANNER MODAL */}
      {showExercisePlanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <ExercisePlanner 
                workouts={workouts} 
                setWorkouts={setWorkouts} 
                onClose={() => setShowExercisePlanner(false)} 
              />
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lifestyle Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Track and visualize the impact of your daily habits.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
           <button 
             onClick={() => setActiveTab('log')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'log' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <Plus size={18} /> Daily Check-in
           </button>
           <button 
             onClick={() => setActiveTab('trends')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'trends' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <BarChart2 size={18} /> Trends & Insights
           </button>
        </div>
      </header>

      {/* TRENDS DASHBOARD */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {lifestyleHistory.length === 0 ? (
             <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
                <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">No lifestyle data yet.</p>
                <button onClick={() => setActiveTab('log')} className="mt-4 text-teal-600 dark:text-teal-400 font-medium hover:underline">Log your first entry</button>
             </div>
          ) : (
            <>
               {/* Averages Cards */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                      <div className="flex items-center gap-2 text-indigo-500 mb-1">
                          <Moon size={16} /> <span className="text-xs font-bold uppercase">Avg Sleep</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{averages?.sleep}h</p>
                        <span className="text-sm text-slate-400 mb-1">/ {averages?.sleepQuality}★</span>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                      <div className="flex items-center gap-2 text-teal-500 mb-1">
                          <Dumbbell size={16} /> <span className="text-xs font-bold uppercase">Avg Exercise</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{averages?.exercise} min</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                      <div className="flex items-center gap-2 text-purple-500 mb-1">
                          <Users size={16} /> <span className="text-xs font-bold uppercase">Avg Social</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{averages?.social} min</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                      <div className="flex items-center gap-2 text-amber-500 mb-1">
                          <Coffee size={16} /> <span className="text-xs font-bold uppercase">Avg Caffeine</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{averages?.caffeine} cups</p>
                  </div>
               </div>

               {/* Charts */}
               <div className="grid lg:grid-cols-2 gap-6">
                 {/* Sleep Analysis */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                   <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                     <Moon size={18} className="text-indigo-500" /> Sleep Analysis
                   </h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" domain={[0, 12]} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{fontSize: 12, fill: '#fbbf24'}} axisLine={false} tickLine={false} label={{ value: 'Quality (Stars)', angle: 90, position: 'insideRight', fill: '#fbbf24', fontSize: 10 }} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} labelStyle={{color: '#94a3b8'}} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Sleep" name="Duration (h)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="SleepQuality" name="Quality (1-5)" stroke="#fbbf24" strokeWidth={3} dot={{r: 4, fill: "#fbbf24"}} />
                         </ComposedChart>
                      </ResponsiveContainer>
                   </div>
                   <p className="text-xs text-slate-400 mt-2 text-center">Correlation between sleep duration and rated quality.</p>
                 </div>

                 {/* Activity vs Mood */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                   <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                     <Activity size={18} className="text-teal-500" /> Habits Impact on Mood
                   </h3>
                   <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{fontSize: 12, fill: '#14b8a6'}} axisLine={false} tickLine={false} label={{ value: 'Mood', angle: 90, position: 'insideRight', fill: '#14b8a6', fontSize: 10 }} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} labelStyle={{color: '#94a3b8'}} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Exercise" stackId="a" name="Exercise (min)" fill="#2dd4bf" radius={[0, 0, 4, 4]} barSize={20} />
                            <Bar yAxisId="left" dataKey="Social" stackId="a" name="Social (min)" fill="#c084fc" radius={[4, 4, 0, 0]} barSize={20} />
                            <Area yAxisId="right" type="monotone" dataKey="Mood" name="Mood Score" stroke="#0f766e" fill="#0f766e" fillOpacity={0.1} strokeWidth={3} dot={{r: 3}} />
                         </ComposedChart>
                      </ResponsiveContainer>
                   </div>
                   <p className="text-xs text-slate-400 mt-2 text-center">Stacked bars show activity duration vs overall mood.</p>
                 </div>
               </div>
            </>
          )}
        </div>
      )}

      {/* DAILY CHECK-IN FORM */}
      {activeTab === 'log' && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-8 transition-colors max-w-3xl mx-auto">
          {/* Mood & Anxiety Section */}
          <section className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-teal-600 dark:text-teal-400" />
                <h3 className="font-semibold text-slate-800 dark:text-white">General Mood</h3>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs text-slate-400 font-medium uppercase">
                    <span>Low</span>
                    <span>Great</span>
                 </div>
                 <input 
                    type="range" min="1" max="10" value={moodScore} 
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
                 />
                 <div className="text-center font-bold text-teal-700 dark:text-teal-400 text-lg">{moodScore} / 10</div>
              </div>
            </div>

            <div>
              {/* Replaced standard input with AnxietyMeter */}
              <AnxietyMeter 
                level={anxietyScore} 
                onChange={setAnxietyScore} 
                previousLevel={previousAnxiety}
                history={recentAnxietyHistory}
              />
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Sleep Tracker Section */}
          <section>
             <SleepTracker 
                entry={{ sleepHours: sleep, bedTime, wakeTime, sleepQuality, sleepFactors, stressLevel }}
                onChange={handleSleepUpdate}
                history={lifestyleHistory}
             />
          </section>

          {/* Other Habits Sliders */}
          <section className="grid md:grid-cols-2 gap-8">
              {/* Exercise */}
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-medium">
                          <Dumbbell size={18} /> Exercise
                      </div>
                      <span className="text-slate-800 dark:text-white font-bold">{exercise} min</span>
                  </div>
                  <input 
                      type="range" min="0" max="120" step="10" 
                      value={exercise} onChange={(e) => setExercise(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <button 
                    onClick={() => setShowExercisePlanner(true)}
                    className="w-full py-2 border border-teal-200 dark:border-teal-800 rounded-lg text-teal-700 dark:text-teal-300 text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center justify-center gap-2"
                  >
                    <Layout size={14} /> Open Workout Planner
                  </button>
              </div>

              {/* Social */}
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                          <Users size={18} /> Socializing
                      </div>
                      <span className="text-slate-800 dark:text-white font-bold">{social} min</span>
                  </div>
                  <input 
                      type="range" min="0" max="240" step="15" 
                      value={social} onChange={(e) => setSocial(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
              </div>

              {/* Caffeine */}
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-medium">
                          <Coffee size={18} /> Caffeine
                      </div>
                      <span className="text-slate-800 dark:text-white font-bold">{caffeine} cups</span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setCaffeine(Math.max(0, caffeine - 1))} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 dark:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-600">-</button>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{caffeine}</div>
                      <button onClick={() => setCaffeine(caffeine + 1)} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 dark:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-600">+</button>
                  </div>
              </div>

               {/* Water */}
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-500 font-medium">
                          <Droplets size={18} /> Water
                      </div>
                      <span className="text-slate-800 dark:text-white font-bold">{water} glasses</span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setWater(Math.max(0, water - 1))} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 dark:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-600">-</button>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{water}</div>
                      <button onClick={() => setWater(water + 1)} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 dark:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-600">+</button>
                  </div>
              </div>
          </section>
          
          <section>
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS_LIST.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </section>

          <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Journal Notes</label>
              <textarea
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Any specific triggers or thoughts today?"
                  rows={3}
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
              />
          </div>

          <button 
              onClick={handleSave}
              disabled={isSaved}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  isSaved ? 'bg-green-600 text-white' : 'bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-700'
              }`}
          >
              {isSaved ? 'Entry Saved!' : <><Save size={20} /> Save Daily Log</>}
          </button>

          {aiTip && (
              <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 p-4 rounded-lg flex gap-3 items-start animate-fade-in">
                  <div className="bg-teal-100 dark:bg-teal-900 p-1 rounded text-teal-700 dark:text-teal-300 mt-1">
                      <Activity size={16} />
                  </div>
                  <div>
                      <h4 className="font-bold text-teal-800 dark:text-teal-200 text-sm mb-1">AI Coping Strategy</h4>
                      <p className="text-teal-900 dark:text-teal-100 text-sm">{aiTip}</p>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LifestyleTracker;
