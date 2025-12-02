
import React from 'react';
import { NavigationTab } from '../types';
import { Layers, ArrowRight, CheckCircle, AlertCircle, BookOpen, UserPlus, Stethoscope, ChevronRight } from 'lucide-react';

interface SteppedCareProps {
  gad7Score: number | null;
  navigateTo: (tab: NavigationTab) => void;
}

const SteppedCare: React.FC<SteppedCareProps> = ({ gad7Score, navigateTo }) => {
  // Determine current recommended step based on GAD-7 (Simplified Clinical Logic)
  // Step 1: All/Prevention. Step 2: GAD-7 5-9. Step 3: GAD-7 10+. Step 4: Complex.
  let activeStep = 1;
  if (gad7Score !== null) {
    if (gad7Score >= 15) activeStep = 3; // Severe -> Step 3 (High intensity/Meds)
    else if (gad7Score >= 10) activeStep = 3; // Moderate -> Step 3
    else if (gad7Score >= 5) activeStep = 2; // Mild -> Step 2 (Self-help)
    else activeStep = 1; // Minimal -> Step 1 (Monitoring)
  }

  const steps = [
    {
      step: 1,
      title: "Assessment & Monitoring",
      description: "Identification of anxiety symptoms, active monitoring, and psychoeducation.",
      target: "All suspected presentations",
      color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      icon: <BookOpen className="text-blue-600 dark:text-blue-400" />,
      actions: [
        { label: "Track Symptoms Daily", tab: "lifestyle" as NavigationTab },
        { label: "Take GAD-7 Assessment", tab: "analytics" as NavigationTab },
      ]
    },
    {
      step: 2,
      title: "Low-Intensity Interventions",
      description: "Guided self-help, psychoeducational groups, and lifestyle changes.",
      target: "Mild to Moderate GAD",
      color: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
      icon: <Layers className="text-teal-600 dark:text-teal-400" />,
      actions: [
        { label: "Practice CBT Tools", tab: "cbt" as NavigationTab },
        { label: "Breathing Exercises", tab: "breathing" as NavigationTab },
        { label: "Sleep Hygiene", tab: "lifestyle" as NavigationTab },
      ]
    },
    {
      step: 3,
      title: "High-Intensity Interventions",
      description: "Individual CBT with a therapist or pharmacological treatment (SSRIs/SNRIs).",
      target: "Moderate to Severe GAD",
      color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
      icon: <Stethoscope className="text-amber-600 dark:text-amber-400" />,
      actions: [
        { label: "Medication Tracker", tab: "medication" as NavigationTab },
        { label: "Generate Clinician Report", tab: "analytics" as NavigationTab },
      ]
    },
    {
      step: 4,
      title: "Specialist Treatment",
      description: "Multi-disciplinary care for complex, treatment-refractory, or high-risk cases.",
      target: "Complex GAD",
      color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
      icon: <UserPlus className="text-rose-600 dark:text-rose-400" />,
      actions: []
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Stepped Care Model</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          A clinical framework for treating GAD. Treatment intensity increases only if the previous step fails to improve symptoms.
        </p>
      </header>

      {/* Current Status Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
            <ActivityIcon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Your Current Status</h3>
            {gad7Score !== null ? (
              <div className="mt-2">
                <p className="text-slate-600 dark:text-slate-300">
                  Based on your latest GAD-7 score of <strong className="text-slate-900 dark:text-white">{gad7Score}</strong>, 
                  clinical guidelines typically suggest focusing on <strong className="text-indigo-600 dark:text-indigo-400">Step {activeStep}</strong>.
                </p>
                {activeStep === 3 && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>Scores in this range often benefit from discussing medication or 1-on-1 therapy with a healthcare provider.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Take the GAD-7 assessment in the Progress tab to see personalized recommendations.
              </p>
            )}
          </div>
          {gad7Score === null && (
            <button 
              onClick={() => navigateTo('analytics')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Take Assessment
            </button>
          )}
        </div>
      </div>

      {/* The Steps */}
      <div className="space-y-4 relative">
        {/* Connecting Line */}
        <div className="absolute left-[28px] top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

        {steps.map((s) => {
          const isActive = s.step === activeStep;
          const isPast = s.step < activeStep;
          
          return (
            <div 
              key={s.step} 
              className={`relative md:pl-20 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-90'}`}
            >
              {/* Step Marker */}
              <div className={`
                hidden md:flex absolute left-0 top-0 w-14 h-14 rounded-full items-center justify-center font-bold text-xl z-10 border-4 transition-colors
                ${isActive 
                  ? 'bg-indigo-600 text-white border-indigo-100 dark:border-indigo-900' 
                  : isPast 
                    ? 'bg-green-500 text-white border-green-100 dark:border-green-900'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }
              `}>
                {isPast ? <CheckCircle size={24} /> : s.step}
              </div>

              {/* Content Card */}
              <div className={`
                rounded-xl border p-6 transition-all
                ${isActive 
                  ? `${s.color} shadow-md ring-1 ring-inset ring-black/5 dark:ring-white/10` 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                }
              `}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-sm">
                      {s.step}
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{s.title}</h3>
                  </div>
                  {isActive && (
                    <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded uppercase tracking-wide">
                      Recommended
                    </span>
                  )}
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm leading-relaxed">
                  {s.description}
                </p>

                <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Target Group:</span>
                  <span className="text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {s.target}
                  </span>
                </div>

                {/* Actions Grid */}
                {s.actions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {s.actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigateTo(action.tab)}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 group text-left"
                      >
                        {action.label}
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
                
                {s.step === 4 && (
                  <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                    Note: This app is primarily designed to support Steps 1 and 2, and monitor Step 3. Step 4 requires specialist intervention.
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

// Internal icon component to avoid huge imports
const ActivityIcon = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default SteppedCare;
