
import React, { useState } from 'react';
import { Workout, Exercise, LoadingState } from '../types';
import { generateWorkoutPlan } from '../services/geminiService';
import { Dumbbell, Calendar, Play, CheckCircle, Zap, TrendingDown, ArrowRight, RefreshCw, X, Plus, Trash2 } from 'lucide-react';
import AnxietyMeter from './AnxietyMeter';

interface ExercisePlannerProps {
  workouts: Workout[];
  setWorkouts: (workouts: Workout[]) => void;
  onClose: () => void;
}

const ExercisePlanner: React.FC<ExercisePlannerProps> = ({ workouts, setWorkouts, onClose }) => {
  const [activeView, setActiveView] = useState<'schedule' | 'player' | 'setup'>('schedule');
  
  // Setup State
  const [level, setLevel] = useState('Beginner');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(LoadingState.IDLE);

  // Player State
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [anxietyBefore, setAnxietyBefore] = useState(5);
  const [anxietyAfter, setAnxietyAfter] = useState(5);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  // Add Exercise Form State
  const [newExercise, setNewExercise] = useState({ name: '', sets: 3, reps: '10', weight: '', notes: '' });

  // --- ACTIONS ---

  const handleGenerate = async () => {
    setLoading(LoadingState.LOADING);
    const newPlan = await generateWorkoutPlan(level, equipment, daysPerWeek);
    
    // Convert to proper Workout types with IDs
    const formattedPlan: Workout[] = newPlan.map((w: any) => ({
      id: Date.now() + Math.random().toString(),
      title: w.title,
      dayOfWeek: w.dayOfWeek,
      exercises: w.exercises.map((e: any) => ({
        id: Math.random().toString(),
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        completed: false
      })),
      completed: false
    }));

    setWorkouts(formattedPlan);
    setLoading(LoadingState.SUCCESS);
    setActiveView('schedule');
  };

  const startWorkout = (workout: Workout) => {
    setActiveWorkout({ ...workout });
    setAnxietyBefore(5);
    setAnxietyAfter(5);
    setWorkoutFinished(false);
    setActiveView('player');
  };

  const toggleExercise = (exId: string) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map(e => 
      e.id === exId ? { ...e, completed: !e.completed } : e
    );
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const updateExerciseDetails = (exId: string, updates: Partial<Exercise>) => {
    if (!activeWorkout) return;
    const updatedExercises = activeWorkout.exercises.map(e => 
      e.id === exId ? { ...e, ...updates } : e
    );
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const handleAddExercise = () => {
    if (!activeWorkout || !newExercise.name) return;
    const newEx: Exercise = {
        id: Date.now().toString(),
        name: newExercise.name,
        sets: newExercise.sets,
        reps: newExercise.reps,
        weight: newExercise.weight,
        notes: newExercise.notes,
        completed: false
    };
    setActiveWorkout({
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, newEx]
    });
    setNewExercise({ name: '', sets: 3, reps: '10', weight: '', notes: '' });
  };

  const handleDeleteExercise = (exId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter(e => e.id !== exId)
    });
  };

  const finishWorkout = () => {
    setWorkoutFinished(true);
  };

  const saveCompletedWorkout = () => {
    if (!activeWorkout) return;
    
    const completedWorkout: Workout = {
      ...activeWorkout,
      completed: true,
      dateCompleted: new Date().toISOString(),
      moodBefore: anxietyBefore,
      moodAfter: anxietyAfter
    };

    // Update in main list
    const updatedList = workouts.map(w => w.id === activeWorkout.id ? completedWorkout : w);
    setWorkouts(updatedList);
    setActiveWorkout(null);
    setActiveView('schedule');
  };

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) setEquipment(equipment.filter(e => e !== item));
    else setEquipment([...equipment, item]);
  };

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- VIEWS ---

  if (activeView === 'setup' || (activeView === 'schedule' && workouts.length === 0)) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl animate-fade-in relative h-full flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X /></button>
        <div className="text-center mb-8">
           <div className="bg-teal-100 dark:bg-teal-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
             <Dumbbell size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Build Your Routine</h2>
           <p className="text-slate-500 dark:text-slate-400">Exercise is a powerful anti-anxiety tool. Let AI create a plan for you.</p>
        </div>

        <div className="space-y-6 max-w-md mx-auto w-full flex-1">
           <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fitness Level</label>
              <div className="flex gap-2">
                 {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                   <button 
                     key={l}
                     onClick={() => setLevel(l)}
                     className={`flex-1 py-2 rounded-lg text-sm border transition-all ${level === l ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}
                   >
                     {l}
                   </button>
                 ))}
              </div>
           </div>

           <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Available Equipment</label>
              <div className="flex flex-wrap gap-2">
                 {['Dumbbells', 'Resistance Bands', 'Kettlebell', 'Pull-up Bar', 'Bench'].map(item => (
                   <button 
                     key={item}
                     onClick={() => toggleEquipment(item)}
                     className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${equipment.includes(item) ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-200 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-700 border-slate-200 text-slate-500 hover:border-slate-400'}`}
                   >
                     {item}
                   </button>
                 ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">* Bodyweight is always included.</p>
           </div>

           <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Days per Week: {daysPerWeek}</label>
              <input 
                type="range" min="2" max="6" step="1" 
                value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
           </div>

           <button 
             onClick={handleGenerate}
             disabled={loading === LoadingState.LOADING}
             className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
           >
             {loading === LoadingState.LOADING ? 'Generating Plan...' : <><Zap size={20} /> Generate Plan</>}
           </button>
        </div>
      </div>
    );
  }

  if (activeView === 'player' && activeWorkout) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl animate-fade-in h-full flex flex-col">
         {/* PLAYER HEADER */}
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{activeWorkout.title}</h2>
            <button onClick={() => setActiveView('schedule')} className="text-slate-400 hover:text-slate-600"><X /></button>
         </div>

         {!workoutFinished ? (
           <div className="flex-1 overflow-y-auto space-y-6">
              {/* Pre-Check */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pre-Workout Anxiety Check</label>
                 <AnxietyMeter level={anxietyBefore} onChange={setAnxietyBefore} size="small" />
              </div>

              {/* Exercises */}
              <div className="space-y-4">
                 {activeWorkout.exercises.map((ex) => (
                   <div 
                      key={ex.id}
                      onClick={() => toggleExercise(ex.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        ex.completed 
                          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                      }`}
                   >
                      <div className="flex items-start gap-4 mb-3">
                        <div className={`mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            ex.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 dark:border-slate-500'
                        }`}>
                            {ex.completed && <CheckCircle size={14} />}
                        </div>
                        <div className="flex-1">
                            {/* Editable Header */}
                            <div className="flex justify-between items-start">
                                <input 
                                    value={ex.name}
                                    onChange={(e) => updateExerciseDetails(ex.id, { name: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`font-bold bg-transparent border-none focus:ring-0 p-0 w-full ${ex.completed ? 'text-teal-900 dark:text-teal-200 line-through' : 'text-slate-800 dark:text-white'}`}
                                    placeholder="Exercise Name"
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteExercise(ex.id); }} className="text-slate-300 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                            </div>
                            <div className="flex gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <span>Sets:</span>
                                <input 
                                    type="number"
                                    value={ex.sets}
                                    onChange={(e) => updateExerciseDetails(ex.id, { sets: Number(e.target.value) })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-teal-500 text-center"
                                />
                                <span>Reps:</span>
                                <input 
                                    value={ex.reps}
                                    onChange={(e) => updateExerciseDetails(ex.id, { reps: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-teal-500 text-center"
                                />
                            </div>
                        </div>
                      </div>

                      {/* Weight and Notes Inputs */}
                      <div className="pl-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input 
                             type="text"
                             value={ex.weight || ''}
                             onChange={(e) => updateExerciseDetails(ex.id, { weight: e.target.value })}
                             onClick={(e) => e.stopPropagation()}
                             placeholder="Weight (e.g., 20lbs)"
                             className="w-full text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500 dark:text-slate-200"
                          />
                          <input 
                             type="text"
                             value={ex.notes || ''}
                             onChange={(e) => updateExerciseDetails(ex.id, { notes: e.target.value })}
                             onClick={(e) => e.stopPropagation()}
                             placeholder="Notes (e.g., Easy, Form check)"
                             className="w-full text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500 dark:text-slate-200"
                          />
                      </div>
                   </div>
                 ))}

                 {/* Add Custom Exercise Form */}
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Plus size={16} /> Add Custom Exercise</h4>
                    <div className="grid gap-3">
                        <input 
                            placeholder="Exercise Name" 
                            className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                            value={newExercise.name}
                            onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-3">
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Sets</span>
                                <input 
                                    type="number"
                                    className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                                    value={newExercise.sets}
                                    onChange={e => setNewExercise({...newExercise, sets: Number(e.target.value)})}
                                />
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Reps</span>
                                <input 
                                    className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                                    value={newExercise.reps}
                                    onChange={e => setNewExercise({...newExercise, reps: e.target.value})}
                                />
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <input 
                                placeholder="Weight (Optional)"
                                className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                                value={newExercise.weight}
                                onChange={e => setNewExercise({...newExercise, weight: e.target.value})}
                            />
                            <input 
                                placeholder="Notes (Optional)"
                                className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                                value={newExercise.notes}
                                onChange={e => setNewExercise({...newExercise, notes: e.target.value})}
                            />
                        </div>
                        <button 
                            onClick={handleAddExercise}
                            disabled={!newExercise.name}
                            className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Add to Workout
                        </button>
                    </div>
                 </div>
              </div>

              <button 
                onClick={finishWorkout}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg mt-4"
              >
                Finish Workout
              </button>
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Great Job!</h3>
              
              <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 text-center">Post-Workout Anxiety Check</label>
                 <AnxietyMeter level={anxietyAfter} onChange={setAnxietyAfter} size="medium" />
                 
                 {anxietyBefore > anxietyAfter && (
                   <div className="mt-4 flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                      <TrendingDown size={18} />
                      <span>Anxiety reduced by {anxietyBefore - anxietyAfter} points</span>
                   </div>
                 )}
              </div>

              <button 
                onClick={saveCompletedWorkout}
                className="w-full max-w-sm py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg"
              >
                Save Log
              </button>
           </div>
         )}
      </div>
    );
  }

  // SCHEDULE VIEW
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl animate-fade-in relative h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Calendar className="text-teal-600" /> Weekly Schedule
          </h2>
          <div className="flex gap-2">
             <button onClick={() => setActiveView('setup')} className="p-2 text-slate-400 hover:text-teal-600" title="Regenerate Plan"><RefreshCw size={18} /></button>
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
          {WEEKDAYS.map((dayName, idx) => {
            const workout = workouts.find(w => w.dayOfWeek === idx);
            const isToday = new Date().getDay() === idx;

            return (
              <div key={idx} className={`p-4 rounded-xl border transition-all ${
                isToday 
                  ? 'border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/10' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <span className={`w-10 text-center text-sm font-bold ${isToday ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>{dayName}</span>
                       {workout ? (
                         <div>
                            <h4 className={`font-bold ${workout.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{workout.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{workout.exercises.length} Exercises</p>
                         </div>
                       ) : (
                         <span className="text-sm text-slate-400 italic">Rest Day</span>
                       )}
                    </div>

                    {workout && (
                      <div className="flex items-center gap-2">
                         {workout.completed ? (
                           <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle size={12}/> Done</span>
                              {workout.moodBefore !== undefined && workout.moodAfter !== undefined && (
                                <span className="text-[10px] text-slate-400">Mood: {workout.moodBefore}→{workout.moodAfter}</span>
                              )}
                           </div>
                         ) : (
                           <button 
                             onClick={() => startWorkout(workout)}
                             className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-md transition-transform hover:scale-110"
                           >
                             <Play size={16} fill="currentColor" />
                           </button>
                         )}
                      </div>
                    )}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
};

export default ExercisePlanner;
