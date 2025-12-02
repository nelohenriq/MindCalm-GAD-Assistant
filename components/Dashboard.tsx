
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MoodEntry, LifestyleEntry, ThoughtRecord, Medication, MedicationLog } from '../types';
import { Activity, Pill, Moon, AlertCircle, Star } from 'lucide-react';
import AnxietyMeter from './AnxietyMeter';

interface DashboardProps {
  moods: MoodEntry[];
  lifestyle: LifestyleEntry[];
  thoughts: ThoughtRecord[];
  medications: Medication[];
  medLogs: MedicationLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ moods, lifestyle, thoughts, medications, medLogs }) => {
  
  // Prepare chart data 
  const chartData = moods.slice(-7).map(m => ({
    date: new Date(m.date).toLocaleDateString(undefined, { weekday: 'short' }),
    Mood: m.score,
    Anxiety: m.anxietyScore || 0, // Fallback for old data
  }));

  // Calculate Symptom Frequency
  const symptomCounts: Record<string, number> = {};
  moods.forEach(m => {
    if (m.symptoms) {
      m.symptoms.forEach(s => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    }
  });
  
  // Sort symptoms by frequency
  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const uniqueMedsTaken = new Set(medLogs.filter(log => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(log.date) >= today;
  }).map(l => l.medicationId)).size;

  const totalMeds = medications.length;

  const avgSleep = lifestyle.length > 0 
    ? (lifestyle.slice(-7).reduce((acc, curr) => acc + curr.sleepHours, 0) / Math.min(lifestyle.length, 7)).toFixed(1)
    : '-';
    
  const avgSleepQuality = lifestyle.length > 0 && lifestyle.some(l => l.sleepQuality)
    ? (lifestyle.slice(-7).reduce((acc, curr) => acc + (curr.sleepQuality || 0), 0) / Math.min(lifestyle.length, 7)).toFixed(1)
    : null;

  const avgAnxiety = moods.length > 0
    ? Number((moods.slice(-7).reduce((acc, curr) => acc + (curr.anxietyScore || 0), 0) / Math.min(moods.length, 7)).toFixed(1))
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</h2>
        <p className="text-slate-500 dark:text-slate-400">Here is your daily overview for managing GAD.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg Mood (7d)</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">
              {moods.length > 0 
                ? (moods.slice(-7).reduce((acc, curr) => acc + curr.score, 0) / Math.min(moods.length, 7)).toFixed(1)
                : '-'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-2 transition-colors">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg Anxiety</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{avgAnxiety}</p>
                </div>
            </div>
            {/* Visual Meter for Anxiety */}
            <div className="w-full mt-1">
                 <AnxietyMeter level={avgAnxiety} readOnly size="small" />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Pill size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Meds Today</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{uniqueMedsTaken} / {totalMeds}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Moon size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avg Sleep</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                 {avgSleep}h
              </p>
              {avgSleepQuality && (
                 <span className="text-xs text-amber-500 font-medium flex items-center">
                    <Star size={10} className="fill-current mr-0.5" />{avgSleepQuality}
                 </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Wellness vs. Anxiety</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc'}} 
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Mood" stroke="#0d9488" strokeWidth={3} dot={{r: 4}} name="Wellness" />
                <Line type="monotone" dataKey="Anxiety" stroke="#e11d48" strokeWidth={3} dot={{r: 4}} name="Anxiety" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Top Symptoms Reported</h3>
          {topSymptoms.length > 0 ? (
            <div className="space-y-4">
              {topSymptoms.map(([symptom, count]) => (
                <div key={symptom}>
                   <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{symptom}</span>
                      <span className="text-slate-500 dark:text-slate-400">{count} times</span>
                   </div>
                   <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                      <div 
                        className="bg-rose-400 h-2.5 rounded-full" 
                        style={{ width: `${(count / Math.max(moods.length, 1)) * 100}%` }}
                      ></div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No symptoms recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
