
import React, { useState, useEffect } from 'react';
import { NavigationTab, MoodEntry, LifestyleEntry, ThoughtRecord, Medication, MedicationLog, ActivityPlan, BreathingSession, GAD7Result, Workout } from './types';
import Dashboard from './components/Dashboard';
import CBTTools from './components/CBTTools';
import MedicationTracker from './components/MedicationTracker';
import LifestyleTracker from './components/LifestyleTracker';
import BreathingTools from './components/BreathingTools';
import Analytics from './components/Analytics';
import SteppedCare from './components/SteppedCare';
import KnowledgeGraph from './components/KnowledgeGraph';
import { LayoutDashboard, Brain, Pill, Activity, Menu, X, Moon, Sun, Wind, BarChart, Layers, Network } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Persistent State
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [lifestyle, setLifestyle] = useState<LifestyleEntry[]>([]);
  const [thoughts, setThoughts] = useState<ThoughtRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);
  const [activities, setActivities] = useState<ActivityPlan[]>([]);
  const [breathingSessions, setBreathingSessions] = useState<BreathingSession[]>([]);
  const [gad7History, setGad7History] = useState<GAD7Result[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load Data
  useEffect(() => {
    const loadedMoods = localStorage.getItem('moods');
    const loadedLifestyle = localStorage.getItem('lifestyle');
    const loadedThoughts = localStorage.getItem('thoughts');
    const loadedMeds = localStorage.getItem('medications');
    const loadedLogs = localStorage.getItem('medLogs');
    const loadedActivities = localStorage.getItem('activities');
    const loadedBreathing = localStorage.getItem('breathingSessions');
    const loadedGad7 = localStorage.getItem('gad7History');
    const loadedWorkouts = localStorage.getItem('workouts');

    if (loadedMoods) setMoods(JSON.parse(loadedMoods));
    if (loadedLifestyle) setLifestyle(JSON.parse(loadedLifestyle));
    if (loadedThoughts) setThoughts(JSON.parse(loadedThoughts));
    if (loadedMeds) setMedications(JSON.parse(loadedMeds));
    if (loadedLogs) setMedLogs(JSON.parse(loadedLogs));
    if (loadedActivities) setActivities(JSON.parse(loadedActivities));
    if (loadedBreathing) setBreathingSessions(JSON.parse(loadedBreathing));
    if (loadedGad7) setGad7History(JSON.parse(loadedGad7));
    if (loadedWorkouts) setWorkouts(JSON.parse(loadedWorkouts));
  }, []);

  // Save Data Helpers
  const saveMoodAndLifestyle = (newLifestyle: LifestyleEntry, newMood: MoodEntry) => {
    const updatedLifestyle = [...lifestyle, newLifestyle];
    const updatedMoods = [...moods, newMood];
    setLifestyle(updatedLifestyle);
    setMoods(updatedMoods);
    localStorage.setItem('lifestyle', JSON.stringify(updatedLifestyle));
    localStorage.setItem('moods', JSON.stringify(updatedMoods));
  };

  const addThought = (thought: ThoughtRecord) => {
    const updatedThoughts = [thought, ...thoughts];
    setThoughts(updatedThoughts);
    localStorage.setItem('thoughts', JSON.stringify(updatedThoughts));
  };

  const updateMedications = (meds: Medication[]) => {
    setMedications(meds);
    localStorage.setItem('medications', JSON.stringify(meds));
  };

  const addMedLog = (log: MedicationLog) => {
    const updatedLogs = [log, ...medLogs];
    setMedLogs(updatedLogs);
    localStorage.setItem('medLogs', JSON.stringify(updatedLogs));
  };

  const updateActivities = (newActivities: ActivityPlan[]) => {
    setActivities(newActivities);
    localStorage.setItem('activities', JSON.stringify(newActivities));
  };

  const addBreathingSession = (session: BreathingSession) => {
    const updatedSessions = [session, ...breathingSessions];
    setBreathingSessions(updatedSessions);
    localStorage.setItem('breathingSessions', JSON.stringify(updatedSessions));
  };

  const saveGad7 = (result: GAD7Result) => {
    const updatedGad7 = [...gad7History, result];
    setGad7History(updatedGad7);
    localStorage.setItem('gad7History', JSON.stringify(updatedGad7));
  }

  const updateWorkouts = (newWorkouts: Workout[]) => {
    setWorkouts(newWorkouts);
    localStorage.setItem('workouts', JSON.stringify(newWorkouts));
  }

  // Calculate Med Compliance for Analytics
  const calculateMedCompliance = () => {
     if (medications.length === 0) return 0;
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     
     const recentLogs = medLogs.filter(l => new Date(l.date) > sevenDaysAgo);
     const expectedDoses = medications.length * 7; 
     if (expectedDoses === 0) return 0;
     
     return Math.min(100, (recentLogs.length / expectedDoses) * 100);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard moods={moods} lifestyle={lifestyle} thoughts={thoughts} medications={medications} medLogs={medLogs} />;
      case 'cbt':
        return <CBTTools thoughts={thoughts} addThought={addThought} activities={activities} updateActivities={updateActivities} />;
      case 'medication':
        return <MedicationTracker medications={medications} setMedications={updateMedications} medLogs={medLogs} addMedLog={addMedLog} />;
      case 'lifestyle':
        return <LifestyleTracker onSaveEntry={saveMoodAndLifestyle} lifestyleHistory={lifestyle} moodHistory={moods} workouts={workouts} setWorkouts={updateWorkouts} />;
      case 'breathing':
        return <BreathingTools onSessionComplete={addBreathingSession} />;
      case 'analytics':
        return <Analytics 
          gad7History={gad7History} 
          saveGad7={saveGad7} 
          moods={moods} 
          lifestyle={lifestyle} 
          thoughts={thoughts} 
          workouts={workouts}
          medLogs={medLogs}
          medComplianceRate={calculateMedCompliance()} 
        />;
      case 'steppedCare':
        return <SteppedCare gad7Score={gad7History.length > 0 ? gad7History[gad7History.length - 1].score : null} navigateTo={setActiveTab} />;
      case 'graph':
        return <KnowledgeGraph moods={moods} lifestyle={lifestyle} thoughts={thoughts} medications={medications} medLogs={medLogs} />;
      default:
        return <Dashboard moods={moods} lifestyle={lifestyle} thoughts={thoughts} medications={medications} medLogs={medLogs} />;
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: NavigationTab; icon: any; label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === tab
          ? 'bg-teal-600 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-50 transition-colors duration-200">
        <h1 className="text-xl font-bold text-teal-700 dark:text-teal-400">MindCalm</h1>
        <div className="flex gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 dark:text-slate-400">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-800 dark:text-slate-200">
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-10 hidden lg:flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-bold text-teal-700 dark:text-teal-400 tracking-tight">MindCalm</h1>
                <p className="text-xs text-slate-400 mt-1">Evidence-Based GAD Support</p>
             </div>
             <button onClick={() => setDarkMode(!darkMode)} className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-2 transition-colors">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <nav className="flex-1 space-y-2 pt-16 lg:pt-0">
            <NavItem tab="dashboard" icon={LayoutDashboard} label="Overview" />
            <NavItem tab="lifestyle" icon={Activity} label="Lifestyle" />
            <NavItem tab="cbt" icon={Brain} label="CBT Tools" />
            <NavItem tab="medication" icon={Pill} label="Medications" />
            <NavItem tab="breathing" icon={Wind} label="Breathing Tools" />
            <NavItem tab="analytics" icon={BarChart} label="Progress" />
            <NavItem tab="graph" icon={Network} label="Insights Graph" />
            <NavItem tab="steppedCare" icon={Layers} label="Stepped Care Guide" />
          </nav>

          <div className="mt-auto p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              <strong>Disclaimer:</strong> This app is for educational purposes. It does not replace professional medical advice.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 pt-20 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-colors duration-200">
        {renderContent()}
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
