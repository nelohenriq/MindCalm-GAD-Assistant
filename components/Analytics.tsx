
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, ComposedChart, ScatterChart, Scatter, Cell } from 'recharts';
import { GAD7Result, MoodEntry, LifestyleEntry, ThoughtRecord, LoadingState, TimeRange, Workout, MedicationLog, Insight } from '../types';
import { generateProgressReport, generateDataInsights } from '../services/geminiService';
import { ClipboardList, TrendingUp, Activity, FileText, Brain, X, Sparkles, Filter, Share2, Lightbulb } from 'lucide-react';

interface AnalyticsProps {
  gad7History: GAD7Result[];
  saveGad7: (result: GAD7Result) => void;
  moods: MoodEntry[];
  lifestyle: LifestyleEntry[];
  thoughts: ThoughtRecord[];
  workouts: Workout[];
  medLogs: MedicationLog[];
  medComplianceRate: number;
}

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const METRIC_CONFIG: Record<string, { color: string; type: 'line' | 'bar'; label: string }> = {
  Anxiety: { color: '#f43f5e', type: 'line', label: 'Anxiety' },
  Mood: { color: '#10b981', type: 'line', label: 'Wellness' },
  Sleep: { color: '#818cf8', type: 'bar', label: 'Sleep' },
  Exercise: { color: '#2dd4bf', type: 'bar', label: 'Exercise' },
  Social: { color: '#c084fc', type: 'bar', label: 'Social' },
};

const MiniTrendChart: React.FC<{ data: any[]; metric: string }> = ({ data, metric }) => {
  const config = METRIC_CONFIG[metric];
  if (!config) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="h-16 w-24">
        <ResponsiveContainer width="100%" height="100%">
          {config.type === 'line' ? (
            <LineChart data={data}>
              <Line type="monotone" dataKey={metric} stroke={config.color} strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <Bar dataKey={metric} fill={config.color} radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">{config.label}</span>
    </div>
  );
};

const CorrelationScatter: React.FC<{ data: any[]; metricX: string; metricY: string }> = ({ data, metricX, metricY }) => {
  const configX = METRIC_CONFIG[metricX];
  const configY = METRIC_CONFIG[metricY];
  if (!configX || !configY) return null;

  return (
    <div className="flex flex-col items-center ml-2 border-l border-slate-200 dark:border-slate-700 pl-4">
      <div className="h-16 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <XAxis type="number" dataKey={metricX} hide domain={['auto', 'auto']} />
            <YAxis type="number" dataKey={metricY} hide domain={['auto', 'auto']} />
            <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                            <div className="bg-slate-800 text-white text-[10px] p-1 rounded shadow-sm border border-slate-600">
                                <span className="block">{configX.label}: {payload[0].value}</span>
                                <span className="block">{configY.label}: {payload[1].value}</span>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            <Scatter name="Correlation" data={data} fill={configY.color} opacity={0.7}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={configY.color} />
                ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase mt-1">Correlation</span>
    </div>
  );
};

const Analytics: React.FC<AnalyticsProps> = ({ gad7History, saveGad7, moods, lifestyle, thoughts, workouts, medLogs, medComplianceRate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'gad7'>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  // Insights State
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState<Insight | null>(null);

  // Report State
  const [reportText, setReportText] = useState('');
  const [reportStatus, setReportStatus] = useState<LoadingState>(LoadingState.IDLE);

  // GAD-7 State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(7).fill(0));

  // --- FILTER DATA BY TIME RANGE ---
  const getStartDate = () => {
    const now = new Date();
    if (timeRange === '7d') now.setDate(now.getDate() - 7);
    if (timeRange === '30d') now.setDate(now.getDate() - 30);
    if (timeRange === '90d') now.setDate(now.getDate() - 90);
    if (timeRange === 'all') return new Date(0);
    return now;
  };

  const filterByDate = (data: any[]) => {
    const start = getStartDate();
    return data.filter(d => new Date(d.date) >= start).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredMoods = useMemo(() => filterByDate(moods), [moods, timeRange]);
  const filteredLifestyle = useMemo(() => filterByDate(lifestyle), [lifestyle, timeRange]);
  const filteredThoughts = useMemo(() => filterByDate(thoughts), [thoughts, timeRange]);
  const filteredGad7 = useMemo(() => filterByDate(gad7History), [gad7History, timeRange]);

  // --- PREPARE CHART DATA ---
  
  const trendData = useMemo(() => {
    const dataMap = new Map<string, any>();
    
    // Base entries from dates in range
    filteredMoods.forEach(m => {
        const d = new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if(!dataMap.has(d)) dataMap.set(d, { name: d, date: m.date });
        const entry = dataMap.get(d);
        entry.Anxiety = m.anxietyScore;
        entry.Mood = m.score;
    });

    filteredLifestyle.forEach(l => {
        const d = new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if(!dataMap.has(d)) dataMap.set(d, { name: d, date: l.date });
        const entry = dataMap.get(d);
        entry.Sleep = l.sleepHours;
        entry.Exercise = l.exerciseMinutes;
        entry.Social = l.socialMinutes;
    });

    // CBT Data merging
    filteredThoughts.forEach(t => {
        const d = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if(!dataMap.has(d)) dataMap.set(d, { name: d, date: t.date });
        const entry = dataMap.get(d);
        entry.CBTCount = (entry.CBTCount || 0) + 1;
        
        const reduction = Math.max(0, t.intensityBefore - (t.intensityAfter || t.intensityBefore));
        entry.CBTReduction = (entry.CBTReduction || 0) + reduction;
    });
    
    // Normalize CBT Reduction if multiple per day
    for (let entry of dataMap.values()) {
        if (entry.CBTCount > 0) {
            entry.AvgReduction = parseFloat((entry.CBTReduction / entry.CBTCount).toFixed(1));
        }
    }

    return Array.from(dataMap.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredMoods, filteredLifestyle, filteredThoughts]);

  // --- CBT SPECIFIC STATS ---
  const distortionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredThoughts.forEach(t => {
        if(t.distortion) counts[t.distortion] = (counts[t.distortion] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
  }, [filteredThoughts]);

  const avgReductionTotal = useMemo(() => {
     if (filteredThoughts.length === 0) return 0;
     const totalRed = filteredThoughts.reduce((acc, t) => acc + Math.max(0, t.intensityBefore - (t.intensityAfter || t.intensityBefore)), 0);
     return (totalRed / filteredThoughts.length).toFixed(1);
  }, [filteredThoughts]);

  const radarData = useMemo(() => {
    if (filteredMoods.length === 0 || filteredLifestyle.length === 0) return [];
    
    const avg = (arr: any[], key: string) => arr.reduce((acc, curr) => acc + (curr[key] || 0), 0) / arr.length;
    
    // Normalize values to 0-10 scale for Radar
    const avgSleep = Math.min(10, avg(filteredLifestyle, 'sleepHours')); 
    const avgExercise = Math.min(10, avg(filteredLifestyle, 'exerciseMinutes') / 6); // 60min = 10
    const avgSocial = Math.min(10, avg(filteredLifestyle, 'socialMinutes') / 6); // 60min = 10
    const avgMood = avg(filteredMoods, 'score');
    const invAnxiety = 10 - avg(filteredMoods, 'anxietyScore'); // Higher is better (less anxiety)
    const cbtActivity = Math.min(10, filteredThoughts.length * 2); // 5 thoughts = 10

    return [
      { subject: 'Sleep', A: avgSleep, fullMark: 10 },
      { subject: 'Exercise', A: avgExercise, fullMark: 10 },
      { subject: 'Social', A: avgSocial, fullMark: 10 },
      { subject: 'Calmness', A: invAnxiety, fullMark: 10 },
      { subject: 'Mood', A: avgMood, fullMark: 10 },
      { subject: 'CBT', A: cbtActivity, fullMark: 10 },
    ];
  }, [filteredMoods, filteredLifestyle, filteredThoughts]);

  // --- SMART INSIGHTS GENERATION ---
  useEffect(() => {
    if (filteredMoods.length > 5 && filteredLifestyle.length > 5) {
       generateInsights();
    }
  }, [timeRange]); // Regenerate when time range changes

  const generateInsights = async () => {
      setLoadingInsights(true);
      // Create a summary string for AI
      let summary = "Last " + timeRange + " data:\n";
      summary += `Avg Anxiety: ${(filteredMoods.reduce((a,b)=>a+(b.anxietyScore||0),0)/filteredMoods.length).toFixed(1)}/10\n`;
      summary += `Avg Sleep: ${(filteredLifestyle.reduce((a,b)=>a+b.sleepHours,0)/filteredLifestyle.length).toFixed(1)} hours\n`;
      summary += `Total Exercise Days: ${filteredLifestyle.filter(l => l.exerciseMinutes > 15).length}\n`;
      
      // Calculate correlation manually to feed AI specific hints
      const goodSleepDays = filteredLifestyle.filter(l => l.sleepHours >= 7).map(l => l.date.split('T')[0]);
      const badSleepDays = filteredLifestyle.filter(l => l.sleepHours < 6).map(l => l.date.split('T')[0]);
      
      const anxietyOnGoodSleep = filteredMoods.filter(m => goodSleepDays.includes(m.date.split('T')[0])).reduce((a,b) => a+(b.anxietyScore||0),0);
      const anxietyOnBadSleep = filteredMoods.filter(m => badSleepDays.includes(m.date.split('T')[0])).reduce((a,b) => a+(b.anxietyScore||0),0);
      
      summary += `Avg Anxiety after >7h sleep: ${(anxietyOnGoodSleep / (goodSleepDays.length || 1)).toFixed(1)}\n`;
      summary += `Avg Anxiety after <6h sleep: ${(anxietyOnBadSleep / (badSleepDays.length || 1)).toFixed(1)}\n`;
      
      const insights = await generateDataInsights(summary);
      setAiInsights(insights);
      setLoadingInsights(false);
  };

  // --- GAD-7 LOGIC ---
  const calculateGAD7 = () => {
    const score = quizAnswers.reduce((a, b) => a + b, 0);
    let interpretation: GAD7Result['interpretation'] = 'Minimal';
    if (score >= 15) interpretation = 'Severe';
    else if (score >= 10) interpretation = 'Moderate';
    else if (score >= 5) interpretation = 'Mild';

    const result: GAD7Result = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      score,
      interpretation
    };
    saveGad7(result);
    setShowQuiz(false);
    setQuizAnswers(new Array(7).fill(0));
  };

  const updateAnswer = (index: number, value: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[index] = value;
    setQuizAnswers(newAnswers);
  };

  // --- REPORT GENERATION ---
  const handleGenerateReport = async () => {
    setReportStatus(LoadingState.LOADING);
    const recentMoods = moods.slice(-7);
    const avgAnxiety = recentMoods.length > 0 
      ? (recentMoods.reduce((acc, curr) => acc + (curr.anxietyScore || 0), 0) / recentMoods.length).toFixed(1)
      : 'N/A';
    
    const recentSleep = lifestyle.slice(-7);
    const avgSleep = recentSleep.length > 0
        ? (recentSleep.reduce((acc, curr) => acc + curr.sleepHours, 0) / recentSleep.length).toFixed(1)
        : 'N/A';

    const latestGad7 = gad7History.length > 0 ? gad7History[gad7History.length - 1].score : null;

    const stats = {
      avgAnxiety,
      avgSleep,
      cbtCount: thoughts.length,
      medCompliance: medComplianceRate.toFixed(0),
      latestGad7
    };

    const report = await generateProgressReport(stats);
    setReportText(report);
    setReportStatus(LoadingState.SUCCESS);
  };

  // Helper for Chart Opacity
  const getOpacity = (metric: string) => {
    if (!hoveredInsight) return 1;
    return hoveredInsight.relatedMetrics.includes(metric) ? 1 : 0.1;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Progress Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Deep dive into your recovery metrics.</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors overflow-x-auto">
           <button 
             onClick={() => setActiveTab('dashboard')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <TrendingUp size={18} /> Trends & Insights
           </button>
           <button 
             onClick={() => setActiveTab('gad7')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'gad7' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <ClipboardList size={18} /> Clinical Scores
           </button>
           <button 
             onClick={() => setActiveTab('report')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'report' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
           >
             <FileText size={18} /> Clinician Report
           </button>
        </div>
      </header>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
            {/* Time Filter Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 px-2 text-slate-500 text-sm font-medium">
                    <Filter size={16} /> <span className="hidden sm:inline">Time Range:</span>
                </div>
                <div className="flex gap-1">
                    {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${timeRange === range ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Row: Radar & Key Stats */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Radar Chart: Wellness Balance */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="text-teal-500" size={20} /> Wellness Balance
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="My Balance" dataKey="A" stroke="#2dd4bf" strokeWidth={2} fill="#2dd4bf" fillOpacity={0.3} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Smart Insights Panel */}
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden flex flex-col">
                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                                <Sparkles className="text-amber-500" size={20} /> AI Insights ({timeRange})
                            </h3>
                            {loadingInsights && <span className="text-xs text-indigo-400 animate-pulse">Analyzing...</span>}
                        </div>
                        
                        <div className="space-y-3">
                            {aiInsights.length > 0 ? (
                                aiInsights.map((insight, idx) => (
                                    <div 
                                      key={idx} 
                                      onMouseEnter={() => setHoveredInsight(insight)}
                                      onMouseLeave={() => setHoveredInsight(null)}
                                      className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/50 text-sm text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer hover:scale-[1.01] transition-transform hover:shadow-md hover:border-indigo-300 flex gap-4"
                                    >
                                        <div className={`w-1 h-auto rounded-full transition-colors ${hoveredInsight === insight ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                        <div className="flex-1">
                                            <p className="font-medium text-base mb-2">{insight.text}</p>
                                            
                                            {/* Mini Charts Visualization */}
                                            <div className="flex gap-4 mt-3 overflow-x-auto pb-1 items-end">
                                                {insight.relatedMetrics.map(metric => (
                                                    <MiniTrendChart key={metric} metric={metric} data={trendData} />
                                                ))}
                                                {/* If correlation between 2 metrics, show scatter */}
                                                {insight.relatedMetrics.length === 2 && (
                                                    <CorrelationScatter 
                                                        data={trendData} 
                                                        metricX={insight.relatedMetrics[0]} 
                                                        metricY={insight.relatedMetrics[1]} 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-indigo-400/70 text-sm">
                                    <p>Gathering enough data to find patterns...</p>
                                    <p className="text-xs mt-1">Keep logging mood and lifestyle to see smart insights.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                </div>
            </div>

            {/* Main Trend Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                 <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={20} /> Comprehensive Timeline
                 </h3>
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" domain={[0, 10]} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} label={{ value: 'Score / Hours', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tick={{fontSize: 12, fill: '#2dd4bf'}} axisLine={false} tickLine={false} label={{ value: 'Minutes', angle: 90, position: 'insideRight', fill: '#2dd4bf', fontSize: 10 }} />
                            
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} labelStyle={{color: '#94a3b8'}} />
                            <Legend />

                            <Bar yAxisId="left" dataKey="Sleep" name="Sleep (h)" fill="#818cf8" barSize={10} radius={[4, 4, 0, 0]} fillOpacity={getOpacity('Sleep')} />
                            <Bar yAxisId="right" dataKey="Exercise" name="Exercise (min)" fill="#2dd4bf" barSize={10} radius={[4, 4, 0, 0]} fillOpacity={getOpacity('Exercise')} />
                            <Bar yAxisId="right" dataKey="Social" name="Social (min)" fill="#c084fc" barSize={10} radius={[4, 4, 0, 0]} fillOpacity={getOpacity('Social')} />
                            
                            <Line yAxisId="left" type="monotone" dataKey="Anxiety" name="Anxiety" stroke="#f43f5e" strokeWidth={3} dot={{r: 3}} strokeOpacity={getOpacity('Anxiety')} />
                            <Line yAxisId="left" type="monotone" dataKey="Mood" name="Wellness" stroke="#10b981" strokeWidth={2} dot={{r: 0}} strokeDasharray="5 5" strokeOpacity={getOpacity('Mood')} />
                        </ComposedChart>
                    </ResponsiveContainer>
                 </div>
            </div>

            {/* Cognitive Progress Section (New) */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Brain className="text-indigo-500" size={20} /> Distortion Analysis
                     </h3>
                     {distortionStats.length > 0 ? (
                        <div className="h-[250px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={distortionStats} layout="vertical" margin={{ left: 20 }}>
                                 <XAxis type="number" hide />
                                 <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} />
                                 <Bar dataKey="value" fill="#c084fc" radius={[0, 4, 4, 0]} barSize={20} name="Frequency" />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     ) : (
                        <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                           No CBT logs recorded in this period.
                        </div>
                     )}
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Lightbulb className="text-amber-500" size={20} /> Practice Consistency & Impact
                        </h3>
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                           <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Avg Reduction:</span>
                           <span className="text-sm font-bold text-emerald-600 dark:text-emerald-300">-{avgReductionTotal} pts</span>
                        </div>
                    </div>
                    
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" allowDecimals={false} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} label={{ value: 'Records Logged', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{fontSize: 12, fill: '#10b981'}} axisLine={false} tickLine={false} label={{ value: 'Avg Reduction (pts)', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="CBTCount" name="Records Logged" fill="#6366f1" barSize={30} radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="AvgReduction" name="Anxiety Reduction" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
      )}

      {/* GAD-7 TAB */}
      {activeTab === 'gad7' && (
          <div className="space-y-6">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">GAD-7 Assessment</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Standardized clinical measure for generalized anxiety.</p>
                  </div>
                  <button onClick={() => setShowQuiz(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors">
                      Take Assessment
                  </button>
               </div>

               {/* Chart */}
               {gad7History.length > 0 && (
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-6">Score History</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={filteredGad7}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                                <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 21]} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc'}} itemStyle={{color:'#f8fafc'}} labelStyle={{color: '#94a3b8'}} />
                                
                                <ReferenceLine y={5} stroke="#fbbf24" strokeDasharray="3 3" />
                                <ReferenceLine y={10} stroke="#f97316" strokeDasharray="3 3" />
                                <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" />

                                <Area type="monotone" dataKey="score" stroke="#14b8a6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} dot={{r: 4, fill: '#14b8a6'}} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                   </div>
               )}
          </div>
      )}

      {/* REPORT TAB */}
      {activeTab === 'report' && (
        <div className="max-w-3xl mx-auto space-y-6">
           <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Clinician Summary Report</h3>
              <p className="text-teal-50 opacity-90">Generate a comprehensive summary of your progress, symptoms, and adherence to share with your healthcare provider.</p>
              
              <button 
                 onClick={handleGenerateReport}
                 disabled={reportStatus === LoadingState.LOADING}
                 className="mt-6 bg-white text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-70"
              >
                 {reportStatus === LoadingState.LOADING ? (
                    <><div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div> Generating...</>
                 ) : (
                    <><FileText size={20} /> Generate New Report</>
                 )}
              </button>
           </div>

           {reportStatus === LoadingState.SUCCESS && reportText && (
             <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 animate-fade-in transition-colors">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: reportText.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                   <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Share2 size={16} /> Print / Save PDF
                   </button>
                </div>
             </div>
           )}
        </div>
      )}

      {/* GAD-7 MODAL */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">GAD-7 Assessment</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Over the last 2 weeks, how often have you been bothered by:</p>
              </div>
              <button onClick={() => setShowQuiz(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {GAD7_QUESTIONS.map((q, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{idx + 1}. {q}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Not at all', 'Several days', 'More than half', 'Nearly every day'].map((opt, val) => (
                      <button
                        key={val}
                        onClick={() => updateAnswer(idx, val)}
                        className={`py-2 px-3 rounded-lg text-sm transition-all border ${
                          quizAnswers[idx] === val
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-teal-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl sticky bottom-0 z-10">
               <button 
                 onClick={calculateGAD7}
                 className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
               >
                 Calculate Score
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
