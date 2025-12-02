
import React, { useState } from 'react';
import { Medication, MedicationLog, LoadingState, TaperStep } from '../types';
import { getMedicationInfo, checkDrugInteractions } from '../services/geminiService';
import { Pill, Plus, Check, Info, Trash2, Clock, AlertTriangle, Star, ShieldAlert, Calendar, Camera, Clipboard, Download, TrendingDown } from 'lucide-react';

interface MedicationTrackerProps {
  medications: Medication[];
  setMedications: (meds: Medication[]) => void;
  medLogs: MedicationLog[];
  addMedLog: (log: MedicationLog) => void;
}

const MedicationTracker: React.FC<MedicationTrackerProps> = ({ medications, setMedications, medLogs, addMedLog }) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'manage' | 'taper' | 'history'>('tracker');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Medication Form State
  const [newMed, setNewMed] = useState<Partial<Medication>>({ name: '', dosage: '', frequency: '', type: 'Other', totalPills: 30 });
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // Taking Med Modal State
  const [loggingMedId, setLoggingMedId] = useState<string | null>(null);
  const [sideEffects, setSideEffects] = useState('');
  const [efficacy, setEfficacy] = useState(5);

  // AI Info State
  const [infoState, setInfoState] = useState<{ id: string | null; content: string; status: LoadingState }>({
    id: null, content: '', status: LoadingState.IDLE
  });

  // --- ACTIONS ---

  const handleCheckInteractions = async () => {
    if (!newMed.name) return;
    setCheckingInteractions(true);
    const existingNames = medications.map(m => m.name);
    const warning = await checkDrugInteractions(newMed.name, existingNames);
    setInteractionWarning(warning);
    setCheckingInteractions(false);
  };

  const handleAddMed = () => {
    if (!newMed.name || !newMed.dosage) return;
    const med: Medication = {
      id: Date.now().toString(),
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency || 'Daily',
      type: newMed.type as any,
      totalPills: newMed.totalPills || 30,
      refillDate: newMed.refillDate,
      instructions: newMed.instructions
    };
    setMedications([...medications, med]);
    setNewMed({ name: '', dosage: '', frequency: '', type: 'Other', totalPills: 30 });
    setInteractionWarning(null);
    setShowAddForm(false);
  };

  const initiateTakeMed = (id: string) => {
    setLoggingMedId(id);
    setSideEffects('');
    setEfficacy(5);
  };

  const confirmTakeMed = () => {
    if (!loggingMedId) return;
    const medIndex = medications.findIndex(m => m.id === loggingMedId);
    if (medIndex === -1) return;

    const med = medications[medIndex];
    
    // Create Log
    const log: MedicationLog = {
      id: Date.now().toString(),
      medicationId: med.id,
      medicationName: med.name,
      date: new Date().toISOString(),
      taken: true,
      sideEffects: sideEffects,
      efficacyRating: efficacy
    };
    addMedLog(log);

    // Update Inventory
    if (med.totalPills && med.totalPills > 0) {
      const updatedMeds = [...medications];
      updatedMeds[medIndex] = { ...med, totalPills: med.totalPills - 1 };
      setMedications(updatedMeds);
    }

    setLoggingMedId(null);
  };

  const deleteMed = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handleGetInfo = async (id: string, name: string) => {
    if (infoState.id === id && infoState.content) {
      setInfoState({ id: null, content: '', status: LoadingState.IDLE });
      return;
    }
    setInfoState({ id, content: '', status: LoadingState.LOADING });
    const info = await getMedicationInfo(name);
    setInfoState({ id, content: info, status: LoadingState.SUCCESS });
  };

  const handleExport = () => {
    const data = medLogs.map(l => 
      `${new Date(l.date).toLocaleDateString()} - ${l.medicationName}: Taken. Eff: ${l.efficacyRating}/10. SE: ${l.sideEffects || 'None'}`
    ).join('\n');
    navigator.clipboard.writeText(data);
    alert('Report copied to clipboard!');
  };

  // Helper to check if taken today
  const isTakenToday = (medId: string) => {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    return medLogs.some(log => log.medicationId === medId && new Date(log.date) >= startOfDay);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Medication Hub</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage prescriptions, track adherence, and plan tapers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
             <button onClick={() => setActiveTab('tracker')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'tracker' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Tracker</button>
             <button onClick={() => setActiveTab('manage')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Manage</button>
             <button onClick={() => setActiveTab('taper')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'taper' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Taper</button>
             <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>History</button>
           </div>
           <button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm" title="Copy Clinician Report">
             <Clipboard size={18} /> Export
           </button>
        </div>
      </header>

      {/* --- ADD NEW MEDICATION --- */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in max-w-2xl mx-auto transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Add New Medication</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
               <input className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded focus:ring-1 focus:ring-teal-500" placeholder="Medication Name" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} />
               <input className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded focus:ring-1 focus:ring-teal-500" placeholder="Dosage (e.g. 50mg)" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} />
               <select className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded" value={newMed.type} onChange={e => setNewMed({ ...newMed, type: e.target.value as any })}>
                  <option value="Other">Type: Other</option>
                  <option value="SSRI">SSRI (e.g. Lexapro)</option>
                  <option value="SNRI">SNRI (e.g. Venlafaxine)</option>
                  <option value="Benzodiazepine">Benzodiazepine (e.g. Xanax)</option>
               </select>
               <button onClick={handleCheckInteractions} disabled={!newMed.name || checkingInteractions} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  {checkingInteractions ? 'Checking...' : <><ShieldAlert size={14} /> Check Interactions with AI</>}
               </button>
               {interactionWarning && (
                  <div className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-2 rounded border border-amber-200 dark:border-amber-800">
                    {interactionWarning}
                  </div>
               )}
            </div>
            <div className="space-y-3">
               <input className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded" placeholder="Frequency" value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} />
               <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded" placeholder="Current Inventory (Count)" value={newMed.totalPills || ''} onChange={e => setNewMed({ ...newMed, totalPills: parseInt(e.target.value) })} />
               <div className="flex items-center gap-2 border border-dashed border-slate-300 dark:border-slate-600 p-2 rounded text-slate-400 justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Camera size={18} /> <span>Upload Photo (Optional)</span>
               </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 border-t border-slate-100 dark:border-slate-700 pt-4">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">Cancel</button>
            <button onClick={handleAddMed} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">Add Medication</button>
          </div>
        </div>
      )}

      {/* --- LOG MODAL --- */}
      {loggingMedId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 animate-fade-in transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Log Dose</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Record intake for {medications.find(m => m.id === loggingMedId)?.name}</p>
              
              <div className="mb-4">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perceived Efficacy ({efficacy}/10)</label>
                 <input type="range" min="1" max="10" value={efficacy} onChange={(e) => setEfficacy(Number(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                 <p className="text-xs text-slate-400 mt-1 flex justify-between"><span>Poor</span><span>Excellent</span></p>
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Side Effects</label>
              <textarea className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg mb-4 text-sm" rows={2} placeholder="Nausea, dizziness, or none..." value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} />

              <div className="flex gap-2">
                 <button onClick={() => setLoggingMedId(null)} className="flex-1 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                 <button onClick={confirmTakeMed} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* --- TRACKER TAB --- */}
      {activeTab === 'tracker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map(med => {
            const taken = isTakenToday(med.id);
            const lowInventory = med.totalPills !== undefined && med.totalPills <= 5;
            
            return (
              <div key={med.id} className={`p-5 rounded-xl border transition-all relative ${taken ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                {lowInventory && (
                  <div className="absolute top-3 right-3 text-amber-500 animate-pulse" title="Low Inventory">
                    <AlertTriangle size={18} />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-full ${taken ? 'bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    <Pill size={24} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${taken ? 'text-teal-900 dark:text-teal-300' : 'text-slate-800 dark:text-white'}`}>{med.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{med.dosage}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                   <span>Qty: <strong className={lowInventory ? 'text-amber-600' : ''}>{med.totalPills}</strong> left</span>
                   <span>Refill: {med.refillDate || 'Not set'}</span>
                </div>

                <button 
                  onClick={() => !taken && initiateTakeMed(med.id)}
                  disabled={taken}
                  className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                    taken
                    ? 'bg-transparent text-teal-700 dark:text-teal-400 cursor-default' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                  }`}
                >
                  {taken ? <><Check size={18} /> Taken Today</> : 'Take Dose'}
                </button>
              </div>
            );
          })}
           {medications.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Pill size={48} className="mb-2 opacity-20" />
              <p>No medications being tracked.</p>
              <button onClick={() => { setActiveTab('manage'); setShowAddForm(true); }} className="mt-4 text-teal-600 font-medium hover:underline">Add your first medication</button>
            </div>
          )}
        </div>
      )}

      {/* --- MANAGE TAB --- */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddForm(true)} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700 transition-colors flex items-center justify-center gap-2 font-medium">
             <Plus size={20} /> Add New Medication
          </button>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
             {medications.map((med, idx) => (
               <div key={med.id} className={`p-4 flex items-center justify-between ${idx !== medications.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                  <div>
                     <h4 className="font-bold text-slate-800 dark:text-white">{med.name}</h4>
                     <p className="text-sm text-slate-500">{med.dosage} • {med.frequency} • {med.type}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleGetInfo(med.id, med.name)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded" title="AI Info"><Info size={18} /></button>
                     <button onClick={() => deleteMed(med.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded" title="Delete"><Trash2 size={18} /></button>
                  </div>
               </div>
             ))}
          </div>

          {/* Info Panel */}
          {infoState.id && (
             <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl animate-fade-in">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-2 flex items-center gap-2"><Info size={16}/> Medication Info (AI)</h4>
                {infoState.status === LoadingState.LOADING ? (
                   <span className="text-sm text-indigo-500">Loading...</span>
                ) : (
                   <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">{infoState.content}</p>
                )}
             </div>
          )}
        </div>
      )}

      {/* --- TAPER TAB --- */}
      {activeTab === 'taper' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                 <TrendingDown size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white">Tapering Schedule</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Visualize your dosage reduction plan.</p>
              </div>
           </div>

           <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 mb-2">No active taper plans.</p>
              <button className="text-teal-600 font-medium hover:underline text-sm">Create a Taper Plan</button>
           </div>
        </div>
      )}

      {/* --- HISTORY TAB --- */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors">
            {medLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">No history available yet.</div>
            ) : (
                <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-medium">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Medication</th>
                        <th className="p-4">Efficacy</th>
                        <th className="p-4">Side Effects</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {medLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 text-slate-600 dark:text-slate-300">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="p-4 font-medium text-slate-800 dark:text-white">{log.medicationName}</td>
                        <td className="p-4">
                            <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                                <Star size={14} className="fill-current" /> {log.efficacyRating || '-'}/10
                            </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                            {log.sideEffects ? (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded w-fit text-xs">
                                <AlertTriangle size={12} /> {log.sideEffects}
                                </span>
                            ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                        </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            )}
        </div>
      )}

    </div>
  );
};

export default MedicationTracker;
