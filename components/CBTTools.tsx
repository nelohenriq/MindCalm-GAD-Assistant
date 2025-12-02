
import React, { useState } from 'react';
import { ThoughtRecord, ActivityPlan, PostponedWorry } from '../types';
import { Brain, Zap, Plus, ArrowRight, CheckSquare, Square, Trash2, MessageCircle, Clock } from 'lucide-react';
import CBTWorryLog from './CBTWorryLog';
import CBTChatbot from './CBTChatbot';
import CBTWorryPostponement from './CBTWorryPostponement';

interface CBTToolsProps {
  thoughts: ThoughtRecord[];
  addThought: (thought: ThoughtRecord) => void;
  activities: ActivityPlan[];
  updateActivities: (activities: ActivityPlan[]) => void;
  worries: PostponedWorry[];
  addWorry: (worry: PostponedWorry) => void;
  updateWorries: (worries: PostponedWorry[]) => void;
}

const CBTTools: React.FC<CBTToolsProps> = ({ thoughts, addThought, activities, updateActivities, worries, addWorry, updateWorries }) => {
  const [activeModule, setActiveModule] = useState<'restructuring' | 'activation' | 'postponement' | 'chatbot'>('restructuring');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Activity Planner State
  const [newActivity, setNewActivity] = useState('');
  const [difficulty, setDifficulty] = useState(1);

  const handleSaveThought = (record: ThoughtRecord) => {
    addThought(record);
    setIsFormOpen(false);
  };

  const handleAddActivity = () => {
    if (!newActivity) return;
    const activity: ActivityPlan = {
      id: Date.now().toString(),
      title: newActivity,
      date: new Date().toISOString(),
      difficulty,
      completed: false
    };
    updateActivities([...activities, activity]);
    setNewActivity('');
    setDifficulty(1);
  };

  const toggleActivity = (id: string) => {
    const updated = activities.map(a => 
      a.id === id ? { ...a, completed: !a.completed } : a
    );
    updateActivities(updated);
  };

  const deleteActivity = (id: string) => {
    updateActivities(activities.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">CBT Toolbox</h2>
          <p className="text-slate-500 dark:text-slate-400">Evidence-based techniques to manage anxiety.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors overflow-x-auto">
           <button 
             onClick={() => setActiveModule('restructuring')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeModule === 'restructuring' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <Brain size={18} /> Restructuring
           </button>
           <button 
             onClick={() => setActiveModule('activation')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeModule === 'activation' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <Zap size={18} /> Activation
           </button>
           <button 
             onClick={() => setActiveModule('postponement')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeModule === 'postponement' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <Clock size={18} /> Postponement
           </button>
           <button 
             onClick={() => setActiveModule('chatbot')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeModule === 'chatbot' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <MessageCircle size={18} /> AI Assistant
           </button>
        </div>
      </header>

      {/* COGNITIVE RESTRUCTURING MODULE */}
      {activeModule === 'restructuring' && (
        <>
            {!isFormOpen && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} /> New 3Cs Worry Log
                    </button>
                </div>
            )}

          {isFormOpen ? (
            <div className="max-w-3xl mx-auto animate-fade-in">
                <CBTWorryLog 
                    onSave={handleSaveThought}
                    onCancel={() => setIsFormOpen(false)}
                />
            </div>
          ) : (
            /* History List */
            <div className="grid grid-cols-1 gap-4">
              {thoughts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 transition-colors">
                  <Brain size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">No thought records yet.</p>
                  <p className="text-slate-400 dark:text-slate-500">Start challenging your anxiety today.</p>
                </div>
              ) : (
                thoughts.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{new Date(item.date).toLocaleDateString()}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                            Intensity: {item.intensityBefore} → {item.intensityAfter || '?'}
                          </span>
                      </div>
                      <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full border border-amber-100 dark:border-amber-900/50 font-medium">
                        {item.distortion}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 relative">
                      {/* Arrow for visualization on desktop */}
                      <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-slate-100 dark:bg-slate-700 p-1 rounded-full text-slate-400">
                          <ArrowRight size={16} />
                      </div>
                      
                      <div className="bg-red-50/30 dark:bg-red-900/5 p-3 rounded-lg border border-red-50 dark:border-red-900/10">
                        <h4 className="text-xs font-bold text-red-500 dark:text-red-400 mb-1">AUTOMATIC THOUGHT</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-sm italic">"{item.thought}"</p>
                      </div>
                      <div className="bg-teal-50/30 dark:bg-teal-900/5 p-3 rounded-lg border border-teal-50 dark:border-teal-900/10">
                        <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">BALANCED THOUGHT</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">{item.alternativeThought}</p>
                      </div>
                    </div>
                    {item.evidenceAgainst && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Evidence Against:</p>
                             <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{item.evidenceAgainst}</p>
                        </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* BEHAVIORAL ACTIVATION MODULE */}
      {activeModule === 'activation' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
           <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
             <div className="flex gap-4 items-start">
               <Zap className="text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
               <div>
                 <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">Plan Pleasant Activities</h3>
                 <p className="text-indigo-800 dark:text-indigo-300 text-sm mt-1">
                   Behavioral Activation helps combat anxiety and depression by scheduling positive activities. 
                   Start with small, manageable tasks.
                 </p>
               </div>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
             <h4 className="font-semibold text-slate-800 dark:text-white mb-4">Add New Activity</h4>
             <div className="flex flex-col md:flex-row gap-3">
               <input 
                 type="text" 
                 value={newActivity}
                 onChange={(e) => setNewActivity(e.target.value)}
                 placeholder="e.g., Go for a 15 min walk, Call a friend, Read a book"
                 className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
               />
               <div className="flex gap-3">
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="p-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white rounded-lg min-w-[100px]"
                  >
                    <option value={1}>Easy</option>
                    <option value={2}>Medium</option>
                    <option value={3}>Hard</option>
                  </select>
                  <button 
                    onClick={handleAddActivity}
                    disabled={!newActivity}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    Add
                  </button>
               </div>
             </div>
           </div>

           <div className="space-y-3">
             {activities.length === 0 && (
                <p className="text-center text-slate-400 py-8">No activities planned yet.</p>
             )}
             {activities.map(activity => (
               <div key={activity.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                 <button onClick={() => toggleActivity(activity.id)} className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    {activity.completed ? <CheckSquare className="text-teal-600 dark:text-teal-400" size={24} /> : <Square size={24} />}
                 </button>
                 <div className={`flex-1 ${activity.completed ? 'opacity-50 line-through' : ''}`}>
                   <p className="font-medium text-slate-800 dark:text-white">{activity.title}</p>
                   <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        activity.difficulty === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        activity.difficulty === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {activity.difficulty === 1 ? 'Easy' : activity.difficulty === 2 ? 'Medium' : 'Hard'}
                      </span>
                   </div>
                 </div>
                 <button onClick={() => deleteActivity(activity.id)} className="text-slate-300 hover:text-red-400 dark:hover:text-red-400 p-2">
                   <Trash2 size={18} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* WORRY POSTPONEMENT MODULE */}
      {activeModule === 'postponement' && (
        <div className="max-w-3xl mx-auto">
          <CBTWorryPostponement 
             worries={worries} 
             addWorry={addWorry} 
             updateWorries={updateWorries} 
          />
        </div>
      )}

      {/* AI CHATBOT MODULE */}
      {activeModule === 'chatbot' && (
        <div className="max-w-3xl mx-auto">
           <CBTChatbot />
        </div>
      )}

    </div>
  );
};

export default CBTTools;
