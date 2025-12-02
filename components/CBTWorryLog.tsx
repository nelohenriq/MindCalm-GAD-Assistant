
import React, { useState, useEffect } from 'react';
import { ThoughtRecord, LoadingState } from '../types';
import { analyzeThoughtRecord, analyzeEvidence } from '../services/geminiService';
import { ChevronRight, ChevronLeft, Save, Sparkles, AlertCircle, Info, Brain, X, Check, Search } from 'lucide-react';
import AnxietyMeter from './AnxietyMeter';

interface CBTWorryLogProps {
  initialData?: Partial<ThoughtRecord>;
  onSave: (record: ThoughtRecord) => void;
  onCancel: () => void;
}

const DISTORTIONS = [
  { id: 'catastrophizing', label: 'Catastrophizing', desc: 'Expecting the worst possible outcome.' },
  { id: 'all-or-nothing', label: 'All-or-Nothing', desc: 'Thinking in absolutes (always, never).' },
  { id: 'mind-reading', label: 'Mind Reading', desc: 'Assuming you know what others are thinking.' },
  { id: 'emotional-reasoning', label: 'Emotional Reasoning', desc: 'Believing that because you feel it, it must be true.' },
  { id: 'fortune-telling', label: 'Fortune Telling', desc: 'Predicting a negative future without evidence.' },
  { id: 'personalization', label: 'Personalization', desc: 'Taking responsibility for things outside your control.' },
  { id: 'overgeneralization', label: 'Overgeneralization', desc: 'Applying one negative event to all situations.' },
  { id: 'should-statements', label: 'Should Statements', desc: 'Using rigid rules for yourself or others.' },
  { id: 'labeling', label: 'Labeling', desc: 'Assigning global negative labels to yourself.' },
];

const CBTWorryLog: React.FC<CBTWorryLogProps> = ({ initialData, onSave, onCancel }) => {
  const [step, setStep] = useState(1); // 1: Catch, 2: Check, 3: Change
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  
  const [formData, setFormData] = useState({
    situation: initialData?.situation || '',
    thought: initialData?.thought || '',
    emotion: initialData?.emotion || '',
    intensityBefore: initialData?.intensityBefore || 6,
    distortion: initialData?.distortion || '',
    evidenceFor: initialData?.evidenceFor || '',
    evidenceAgainst: initialData?.evidenceAgainst || '',
    alternativeThought: initialData?.alternativeThought || '',
    intensityAfter: initialData?.intensityAfter || 3,
  });

  // Load draft from local storage
  useEffect(() => {
    if (!initialData) {
      const saved = localStorage.getItem('cbt_draft');
      if (saved) {
        try {
          setFormData(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) {
          console.error("Failed to parse draft");
        }
      }
    }
  }, [initialData]);

  // Save draft on change
  useEffect(() => {
    localStorage.setItem('cbt_draft', JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    // Clear draft
    localStorage.removeItem('cbt_draft');
    
    onSave({
      id: initialData?.id || Date.now().toString(),
      date: initialData?.date || new Date().toISOString(),
      ...formData
    });
  };

  // AI Helpers
  const handleIdentifyDistortion = async () => {
    if (!formData.thought) return;
    setLoading(LoadingState.LOADING);
    try {
      const result = await analyzeThoughtRecord(formData.situation, formData.thought, formData.emotion);
      if (result.distortion) updateField('distortion', result.distortion);
      if (result.alternativeThought && !formData.alternativeThought) updateField('alternativeThought', result.alternativeThought);
      setLoading(LoadingState.SUCCESS);
    } catch (e) {
      setLoading(LoadingState.ERROR);
    }
  };

  const handleCheckEvidence = async () => {
    if (!formData.thought) return;
    setLoading(LoadingState.LOADING);
    try {
      const result = await analyzeEvidence(formData.thought);
      if (result.against) {
        // Append or replace? Let's append if not empty
        const current = formData.evidenceAgainst ? formData.evidenceAgainst + "\n\n" : "";
        updateField('evidenceAgainst', current + "💡 AI Suggestion:\n" + result.against);
      }
      setLoading(LoadingState.SUCCESS);
    } catch (e) {
      setLoading(LoadingState.ERROR);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden transition-colors">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Brain size={20} className="text-teal-600 dark:text-teal-400" />
            3Cs Worry Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Step {step} of 3: {step === 1 ? 'Catch' : step === 2 ? 'Check' : 'Change'}</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5">
        <div 
          className="bg-teal-500 h-1.5 transition-all duration-300 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* STEP 1: CATCH */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 flex gap-3">
              <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Step 1: Catch It</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200/80">Identify the trigger and the automatic negative thought that followed.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Situation (Trigger)</label>
                <textarea
                  value={formData.situation}
                  onChange={(e) => updateField('situation', e.target.value)}
                  placeholder="What happened? Who were you with? When was it?"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Automatic Negative Thought</label>
                <textarea
                  value={formData.thought}
                  onChange={(e) => updateField('thought', e.target.value)}
                  placeholder="What popped into your head? What are you afraid will happen?"
                  className="w-full p-3 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all min-h-[80px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Emotion</label>
                  <input
                    type="text"
                    value={formData.emotion}
                    onChange={(e) => updateField('emotion', e.target.value)}
                    placeholder="e.g., Anxious, Angry, Sad"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Intensity (Before)</label>
                   <AnxietyMeter 
                      level={formData.intensityBefore} 
                      onChange={(val) => updateField('intensityBefore', val)} 
                      size="medium"
                   />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CHECK */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 flex gap-3">
              <Search className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Step 2: Check It</h3>
                <p className="text-sm text-amber-700 dark:text-amber-200/80">Examine the evidence and identify any thinking traps (distortions).</p>
              </div>
            </div>

            {/* Distortions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Cognitive Distortion</label>
                 <button 
                    onClick={handleIdentifyDistortion}
                    disabled={loading === LoadingState.LOADING}
                    className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                 >
                    <Sparkles size={14} /> Auto-Detect
                 </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DISTORTIONS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => updateField('distortion', d.label)}
                    className={`p-2 rounded-lg text-xs text-left border transition-all ${
                      formData.distortion === d.label
                        ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                    title={d.desc}
                  >
                    <span className="font-bold block">{d.label}</span>
                    <span className="opacity-70 text-[10px] leading-tight truncate block">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence */}
            <div className="grid md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Evidence For the Thought</label>
                  <textarea
                    value={formData.evidenceFor}
                    onChange={(e) => updateField('evidenceFor', e.target.value)}
                    placeholder="What facts support this thought? (Stick to facts, not feelings)"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm min-h-[120px]"
                  />
               </div>
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Evidence Against</label>
                     <button 
                        onClick={handleCheckEvidence}
                        disabled={loading === LoadingState.LOADING}
                        className="text-xs flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
                     >
                        <Sparkles size={14} /> AI Help
                     </button>
                  </div>
                  <textarea
                    value={formData.evidenceAgainst}
                    onChange={(e) => updateField('evidenceAgainst', e.target.value)}
                    placeholder="What facts contradict this thought? Is there another explanation?"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm min-h-[120px]"
                  />
               </div>
            </div>
          </div>
        )}

        {/* STEP 3: CHANGE */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50 flex gap-3">
              <Check className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-300 text-sm">Step 3: Change It</h3>
                <p className="text-sm text-green-700 dark:text-green-200/80">Develop a more balanced, realistic perspective.</p>
              </div>
            </div>

            <div>
               <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Balanced Alternative Thought</label>
                  {!formData.alternativeThought && (
                    <button 
                      onClick={handleIdentifyDistortion} // Reuse the main analysis which returns alternative too
                      disabled={loading === LoadingState.LOADING}
                      className="text-xs flex items-center gap-1 text-teal-600 dark:text-teal-400"
                    >
                      <Sparkles size={14} /> Suggest
                    </button>
                  )}
               </div>
               <textarea
                  value={formData.alternativeThought}
                  onChange={(e) => updateField('alternativeThought', e.target.value)}
                  placeholder="Considering the evidence, what is a more accurate way to view this situation?"
                  className="w-full p-4 border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all min-h-[120px] text-lg font-medium"
                />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">How intense is the emotion now?</label>
               <AnxietyMeter 
                  level={formData.intensityAfter || 0} 
                  onChange={(val) => updateField('intensityAfter', val)} 
                  previousLevel={formData.intensityBefore}
                  size="large"
               />
               <div className="mt-4 flex justify-between text-xs text-slate-400">
                  <span>Start: {formData.intensityBefore}/10</span>
                  <span>Reduction: {Math.max(0, formData.intensityBefore - (formData.intensityAfter || 0))} points</span>
               </div>
            </div>

          </div>
        )}

      </div>

      {/* Footer / Navigation */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
        {step > 1 ? (
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} /> Back
          </button>
        ) : (
          <div /> // Spacer
        )}

        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={!formData.thought || (step === 1 && !formData.situation)}
            className="flex items-center gap-1 px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={!formData.alternativeThought}
            className="flex items-center gap-2 px-8 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <Save size={18} /> Save to Log
          </button>
        )}
      </div>
    </div>
  );
};

export default CBTWorryLog;
