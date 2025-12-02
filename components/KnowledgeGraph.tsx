
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MoodEntry, LifestyleEntry, ThoughtRecord, Medication, MedicationLog } from '../types';
import { Share2, ZoomIn, ZoomOut, RefreshCw, Network, Info } from 'lucide-react';

interface KnowledgeGraphProps {
  moods: MoodEntry[];
  lifestyle: LifestyleEntry[];
  thoughts: ThoughtRecord[];
  medications: Medication[];
  medLogs: MedicationLog[];
}

// --- GRAPH TYPES ---
interface Node {
  id: string;
  label: string;
  group: 'root' | 'symptom' | 'med' | 'lifestyle' | 'cbt' | 'factor' | 'side-effect' | 'wellness';
  val: number; // size
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Link {
  source: string;
  target: string;
  value: number; // strength
  type: 'structural' | 'correlation' | 'positive';
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ moods, lifestyle, thoughts, medications, medLogs }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [scale, setScale] = useState(1);
  const animationRef = useRef<number>();
  
  // Dragging state
  const [draggingNode, setDraggingNode] = useState<string | null>(null);

  // --- DATA PROCESSING ---
  useEffect(() => {
    // 1. Generate Nodes & Links based on user data
    const newNodes: Node[] = [];
    const newLinks: Link[] = [];
    const width = 800;
    const height = 600;

    // Helper to add node
    const addNode = (id: string, label: string, group: Node['group'], color: string, size: number = 20) => {
      if (!newNodes.find(n => n.id === id)) {
        newNodes.push({
          id, label, group, val: size, color,
          x: width / 2 + (Math.random() - 0.5) * 200,
          y: height / 2 + (Math.random() - 0.5) * 200,
          vx: 0, vy: 0
        });
      }
    };

    // Helper to add link
    const addLink = (source: string, target: string, type: Link['type'] = 'structural', strength: number = 1) => {
      // Check if both nodes exist before linking
      // Note: In this sequential build, we assume nodes are added before links, 
      // but for correlations we might link to nodes added earlier.
      newLinks.push({ source, target, type, value: strength });
    };

    // ROOT NODE
    addNode('root', 'You', 'root', '#14b8a6', 40);

    // --- MOOD & ANXIETY ---
    const avgAnxiety = moods.length ? moods.reduce((a,b) => a + (b.anxietyScore||0), 0) / moods.length : 0;
    addNode('anxiety', `Avg Anxiety: ${avgAnxiety.toFixed(1)}`, 'symptom', '#f43f5e', 30);
    addLink('root', 'anxiety');

    const avgMood = moods.length ? moods.reduce((a,b) => a + b.score, 0) / moods.length : 0;
    addNode('wellness', `Wellness: ${avgMood.toFixed(1)}`, 'wellness', '#10b981', 30);
    addLink('root', 'wellness');

    // Symptoms
    const symptomCounts: Record<string, number> = {};
    moods.forEach(m => m.symptoms.forEach(s => symptomCounts[s] = (symptomCounts[s] || 0) + 1));
    Object.entries(symptomCounts).slice(0, 6).forEach(([symptom, count]) => {
      addNode(`sym-${symptom}`, symptom, 'symptom', '#f43f5e', 15 + count);
      addLink('anxiety', `sym-${symptom}`);
    });

    // --- LIFESTYLE ---
    const avgSleep = lifestyle.length ? lifestyle.reduce((a,b) => a + b.sleepHours, 0) / lifestyle.length : 0;
    addNode('sleep', `Avg Sleep: ${avgSleep.toFixed(1)}h`, 'lifestyle', '#818cf8', 30);
    addLink('root', 'sleep');

    const avgExercise = lifestyle.length ? lifestyle.reduce((a,b) => a + b.exerciseMinutes, 0) / lifestyle.length : 0;
    if (avgExercise > 0) {
        addNode('exercise', `Exercise: ${avgExercise.toFixed(0)}m`, 'lifestyle', '#2dd4bf', 25);
        addLink('root', 'exercise');
    }

    // Sleep Factors
    const factorCounts: Record<string, number> = {};
    lifestyle.forEach(l => l.sleepFactors?.forEach(f => factorCounts[f] = (factorCounts[f] || 0) + 1));
    Object.entries(factorCounts).forEach(([factor, count]) => {
      addNode(`fac-${factor}`, factor, 'factor', '#fbbf24', 15 + count);
      addLink('sleep', `fac-${factor}`);
    });

    // --- MEDICATIONS & SIDE EFFECTS ---
    medications.forEach(med => {
      const medNodeId = `med-${med.id}`;
      addNode(medNodeId, med.name, 'med', '#2dd4bf', 25);
      addLink('root', medNodeId);

      // Extract side effects from logs for this med
      const sideEffects = new Set<string>();
      medLogs.filter(l => l.medicationId === med.id && l.sideEffects).forEach(l => {
         // Simple splitting by comma if user entered multiple
         l.sideEffects?.split(',').forEach(s => sideEffects.add(s.trim()));
      });
      
      sideEffects.forEach(se => {
         if(se) {
            const seId = `se-${med.id}-${se.toLowerCase().replace(/\s+/g, '-')}`;
            addNode(seId, se, 'side-effect', '#fb923c', 15);
            addLink(medNodeId, seId);
         }
      });
    });

    // --- CBT ---
    const distCounts: Record<string, number> = {};
    thoughts.forEach(t => { if(t.distortion) distCounts[t.distortion] = (distCounts[t.distortion] || 0) + 1 });
    if (Object.keys(distCounts).length > 0) {
        addNode('cbt', 'Thinking Traps', 'cbt', '#c084fc', 25);
        addLink('root', 'cbt');
        Object.entries(distCounts).slice(0, 5).forEach(([dist, count]) => {
            addNode(`dist-${dist}`, dist, 'cbt', '#c084fc', 15 + count);
            addLink('cbt', `dist-${dist}`);
        });
    }

    // --- CORRELATIONS ---
    const highAnxietyDays = new Set(moods.filter(m => m.anxietyScore >= 7).map(m => m.date.split('T')[0]));
    const highWellnessDays = new Set(moods.filter(m => m.score >= 8).map(m => m.date.split('T')[0]));

    // 1. Sleep Factors <-> High Anxiety
    lifestyle.forEach(l => {
        const date = l.date.split('T')[0];
        if (highAnxietyDays.has(date) && l.sleepFactors) {
            l.sleepFactors.forEach(factor => {
                 const sourceId = `fac-${factor}`;
                 if (newNodes.find(n => n.id === sourceId)) {
                    // Avoid duplicating links
                    if (!newLinks.find(link => link.source === sourceId && link.target === 'anxiety')) {
                         addLink(sourceId, 'anxiety', 'correlation', 2);
                    }
                 }
            });
        }
    });

    // 2. Low Sleep <-> Anxiety
    const lowSleepDays = lifestyle.filter(l => l.sleepHours < 6).map(l => l.date.split('T')[0]);
    const commonBadDays = lowSleepDays.filter(day => highAnxietyDays.has(day)).length;
    if (commonBadDays >= 2) {
        addLink('sleep', 'anxiety', 'correlation', 3);
    }

    // 3. Exercise <-> Wellness (Positive Correlation)
    const goodExerciseDays = lifestyle.filter(l => l.exerciseMinutes >= 30).map(l => l.date.split('T')[0]);
    const commonGoodDays = goodExerciseDays.filter(day => highWellnessDays.has(day)).length;
    if (commonGoodDays >= 2 && newNodes.find(n => n.id === 'exercise')) {
        addLink('exercise', 'wellness', 'positive', 3);
    }

    setNodes(newNodes);
    setLinks(newLinks);

  }, [moods, lifestyle, thoughts, medications, medLogs]);

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    if (nodes.length === 0) return;

    const width = 800;
    const height = 600;
    const kRepulse = 3000;
    const kSpring = 0.05;
    const kCenter = 0.02;
    const damping = 0.85;

    const tick = () => {
      setNodes(prevNodes => {
        const nextNodes = prevNodes.map(n => ({ ...n }));

        // 1. Repulsion
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const dx = nextNodes[i].x - nextNodes[j].x;
            const dy = nextNodes[i].y - nextNodes[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = kRepulse / (dist * dist);
            
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nextNodes[i].vx += fx;
            nextNodes[i].vy += fy;
            nextNodes[j].vx -= fx;
            nextNodes[j].vy -= fy;
          }
        }

        // 2. Attraction
        links.forEach(link => {
            const source = nextNodes.find(n => n.id === link.source);
            const target = nextNodes.find(n => n.id === link.target);
            if (source && target) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                
                // Spring force
                const restingDistance = link.type === 'structural' ? 100 : 150;
                const force = (dist - restingDistance) * kSpring;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            }
        });

        // 3. Center Gravity & Boundaries
        nextNodes.forEach(node => {
            if (node.id === draggingNode) {
                node.vx = 0; 
                node.vy = 0;
                return;
            }

            node.vx += (width / 2 - node.x) * kCenter;
            node.vy += (height / 2 - node.y) * kCenter;

            node.x += node.vx;
            node.y += node.vy;

            node.vx *= damping;
            node.vy *= damping;

            node.x = Math.max(20, Math.min(width - 20, node.x));
            node.y = Math.max(20, Math.min(height - 20, node.y));
        });

        return nextNodes;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes.length, links.length, draggingNode]);

  // --- INTERACTION ---
  const handleMouseDown = (id: string) => {
    setDraggingNode(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode && svgRef.current) {
        const CTM = svgRef.current.getScreenCTM();
        if (CTM) {
            const x = (e.clientX - CTM.e) / CTM.a / scale;
            const y = (e.clientY - CTM.f) / CTM.d / scale;
            
            setNodes(prev => prev.map(n => 
                n.id === draggingNode ? { ...n, x, y, vx:0, vy:0 } : n
            ));
        }
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 h-[calc(100vh-140px)] flex flex-col animate-fade-in relative overflow-hidden">
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
           <Network className="text-teal-600" /> Mind Map
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Visualizing data connections.</p>
      </div>

      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <span className="w-3 h-3 rounded-full bg-teal-500"></span> You
         </div>
         <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <span className="w-3 h-3 rounded-full bg-rose-500"></span> Symptoms
         </div>
         <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <span className="w-3 h-3 rounded-full bg-orange-400"></span> Side Effects
         </div>
         <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Wellness
         </div>
         <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <div className="w-8 border-t-2 border-slate-300 dark:border-slate-600 border-dashed h-0"></div> Negative Link
         </div>
         <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
             <div className="w-8 border-t-2 border-emerald-500 h-0"></div> Positive Link
         </div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
         <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 bg-white dark:bg-slate-700 shadow rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 text-slate-600 dark:text-slate-300"><ZoomIn size={20}/></button>
         <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 bg-white dark:bg-slate-700 shadow rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 text-slate-600 dark:text-slate-300"><ZoomOut size={20}/></button>
      </div>

      <div className="flex-1 border border-slate-100 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden cursor-move relative"
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
      >
        <svg 
            ref={svgRef}
            width="100%" 
            height="100%" 
            viewBox="0 0 800 600"
            className="w-full h-full"
        >
            <g transform={`scale(${scale})`}>
                {/* Links */}
                {links.map((link, i) => {
                    const source = nodes.find(n => n.id === link.source);
                    const target = nodes.find(n => n.id === link.target);
                    if (!source || !target) return null;

                    let stroke = '#cbd5e1';
                    if (link.type === 'correlation') stroke = '#f43f5e';
                    if (link.type === 'positive') stroke = '#10b981';

                    return (
                        <line
                            key={i}
                            x1={source.x} y1={source.y}
                            x2={target.x} y2={target.y}
                            stroke={stroke}
                            strokeWidth={link.type === 'structural' ? 1 : 2}
                            strokeDasharray={link.type === 'correlation' ? "5,5" : "0"}
                            opacity={0.6}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map(node => (
                    <g 
                        key={node.id} 
                        transform={`translate(${node.x},${node.y})`}
                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(node.id); }}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className="cursor-pointer transition-opacity duration-200"
                        style={{ opacity: hoveredNode && hoveredNode.id !== node.id && !links.find(l => (l.source === node.id && l.target === hoveredNode.id) || (l.target === node.id && l.source === hoveredNode.id)) ? 0.3 : 1 }}
                    >
                        <circle
                            r={node.val}
                            fill={node.color}
                            stroke="white"
                            strokeWidth={2}
                            className="shadow-sm filter drop-shadow-sm"
                        />
                        <text
                            dy={node.val + 15}
                            textAnchor="middle"
                            className="text-[10px] fill-slate-700 dark:fill-slate-300 font-medium pointer-events-none select-none"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                        >
                            {node.label}
                        </text>
                    </g>
                ))}
            </g>
        </svg>

        {hoveredNode && (
            <div 
                className="absolute bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 text-sm z-20 pointer-events-none animate-fade-in"
                style={{ left: (hoveredNode.x * scale) + 20, top: (hoveredNode.y * scale) - 20 }}
            >
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">{hoveredNode.label}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{hoveredNode.group.replace('-', ' ')} Node</p>
                {hoveredNode.id === 'anxiety' && (
                    <p className="text-xs text-rose-500 mt-1">Links to symptoms & triggers</p>
                )}
                {hoveredNode.group === 'side-effect' && (
                    <p className="text-xs text-orange-500 mt-1">Reported medication side effect</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;
