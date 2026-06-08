import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Plus, Trash2, Zap, RotateCcw, Download, Sparkles 
} from 'lucide-react';

// Default layout configurations
const DEFAULT_NODES = [
  { id: 'node-1', name: 'Inlet Stage', type: 'Inlet', cycleTime: 2.0, maxBuffer: 10, currentBuffer: [], totalProcessed: 0, status: 'Normal', defectRate: 0.0, mtbf: 60, mttr: 10, timeToFailure: 60, repairTimeRemaining: 0, activeItem: null, processProgress: 0 },
  { id: 'node-2', name: 'Micro-Processor', type: 'Processor', cycleTime: 3.5, maxBuffer: 5, currentBuffer: [], totalProcessed: 0, status: 'Starved', defectRate: 0.05, mtbf: 45, mttr: 12, timeToFailure: 45, repairTimeRemaining: 0, activeItem: null, processProgress: 0 },
  { id: 'node-3', name: 'Sorting Bin', type: 'Sorting Bin', cycleTime: 2.5, maxBuffer: 5, currentBuffer: [], totalProcessed: 0, status: 'Starved', defectRate: 0.02, mtbf: 50, mttr: 8, timeToFailure: 50, repairTimeRemaining: 0, activeItem: null, processProgress: 0 },
  { id: 'node-4', name: 'Final Packager', type: 'Packager', cycleTime: 4.0, maxBuffer: 5, currentBuffer: [], totalProcessed: 0, status: 'Starved', defectRate: 0.01, mtbf: 70, mttr: 15, timeToFailure: 70, repairTimeRemaining: 0, activeItem: null, processProgress: 0 }
];

function App() {
  // Simulator State
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem('factory_nodes');
    return saved ? JSON.parse(saved) : DEFAULT_NODES;
  });
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [totalProduced, setTotalProduced] = useState(0);
  const [defectedCount, setDefectedCount] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [lastTickTime, setLastTickTime] = useState(Date.now());
  const [latency, setLatency] = useState(0);

  // Animation item tracking
  const [animations, setAnimations] = useState([]);

  // Refs for the animation loop
  const requestRef = useRef();
  const previousTimeRef = useRef();

  // Save configurations to localStorage
  useEffect(() => {
    localStorage.setItem('factory_nodes', JSON.stringify(nodes));
  }, [nodes]);

  // Log telemetry event helper
  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setTelemetryLogs(prev => [{ time, message, type }, ...prev].slice(0, 100));
  };

  // 1. Initialize Production Run
  const handleInitializeRun = () => {
    setIsPlaying(true);
    addLog("Production run initialized.", "success");
  };

  // 2. Reset Line Layout Config
  const handleResetConfig = () => {
    setNodes(DEFAULT_NODES.map(node => ({
      ...node,
      currentBuffer: [],
      totalProcessed: 0,
      status: node.type === 'Inlet' ? 'Normal' : 'Starved',
      timeToFailure: node.mtbf,
      repairTimeRemaining: 0,
      activeItem: null,
      processProgress: 0
    })));
    setTotalProduced(0);
    setDefectedCount(0);
    setAnimations([]);
    setTelemetryLogs([]);
    addLog("Factory layout and performance logs reset to default.", "warning");
  };

  // 3. Inject Random System Failure
  const handleInjectFailure = () => {
    const normalNodes = nodes.filter(n => n.status !== 'Broken');
    if (normalNodes.length === 0) return;
    const randomNode = normalNodes[Math.floor(Math.random() * normalNodes.length)];
    setNodes(prev => prev.map(n => {
      if (n.id === randomNode.id) {
        return { 
          ...n, 
          status: 'Broken', 
          repairTimeRemaining: n.mttr 
        };
      }
      return n;
    }));
    addLog(`CRITICAL: Manual failure injected at node [${randomNode.name}]!`, "error");
  };

  // 4. Add Workstation Node
  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const name = `Workstation ${nodes.length + 1}`;
    const newNode = {
      id,
      name,
      type: 'Processor',
      cycleTime: 3.0,
      maxBuffer: 5,
      currentBuffer: [],
      totalProcessed: 0,
      status: 'Starved',
      defectRate: 0.02,
      mtbf: 50,
      mttr: 10,
      timeToFailure: 50,
      repairTimeRemaining: 0,
      activeItem: null,
      processProgress: 0
    };
    setNodes(prev => [...prev, newNode]);
    addLog(`New workstation [${name}] appended successfully.`, "info");
  };

  // Delete Node
  const handleDeleteNode = (id, name) => {
    if (nodes.length <= 2) {
      addLog("Cannot delete node. A minimum of 2 nodes is required.", "error");
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    addLog(`Workstation [${name}] removed.`, "warning");
  };

  // Handle configuration changes
  const handleConfigChange = (id, field, value) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, [field]: value };
      }
      return n;
    }));
  };

  // Line Balancing Efficiency Calculation (LE %)
  const calculateLineEfficiency = () => {
    if (nodes.length === 0) return 0;
    const totalCycleTime = nodes.reduce((sum, n) => sum + Number(n.cycleTime), 0);
    const maxCycleTime = Math.max(...nodes.map(n => Number(n.cycleTime)));
    if (maxCycleTime === 0) return 0;
    return ((totalCycleTime / (nodes.length * maxCycleTime)) * 100).toFixed(2);
  };

  // OEE % Calculation (Simple implementation based on Availability * Performance * Quality)
  const calculateOEE = () => {
    const totalPossibleSeconds = nodes.length * 60; // normalization
    const upNodes = nodes.filter(n => n.status !== 'Broken').length;
    const availability = upNodes / nodes.length; // uptime ratio
    
    // Performance based on line efficiency
    const performance = calculateLineEfficiency() / 100;
    
    // Quality based on defectives
    const processed = totalProduced + defectedCount;
    const quality = processed > 0 ? totalProduced / processed : 1.0;

    return (availability * performance * quality * 100).toFixed(1);
  };

  // Identifies the current bottleneck target
  const getBottleneckNode = () => {
    let worstNode = null;
    let maxCycleTime = 0;
    nodes.forEach(n => {
      if (Number(n.cycleTime) > maxCycleTime) {
        maxCycleTime = Number(n.cycleTime);
        worstNode = n;
      }
    });
    return worstNode ? worstNode.name : "None";
  };

  // In-memory line balancing heuristics
  const handleOptimizeLineBalance = () => {
    const totalCycleTime = nodes.reduce((sum, n) => sum + Number(n.cycleTime), 0);
    const targetCycleTime = (totalCycleTime / nodes.length).toFixed(1);
    
    // Redistribute cycle times evenly to match the average
    setNodes(prev => prev.map(n => ({
      ...n,
      cycleTime: Number(targetCycleTime)
    })));
    addLog(`Compiler Heuristics: Redistributed task times matching target cycle time of ${targetCycleTime}s.`, "success");
  };

  // Export operational logs to CSV
  const handleExportCSV = () => {
    if (telemetryLogs.length === 0) {
      addLog("No telemetry log data available to export.", "error");
      return;
    }
    const headers = "Timestamp,Message,Type\n";
    const rows = telemetryLogs.map(log => `"${log.time}","${log.message.replace(/"/g, '""')}","${log.type}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `factory_telemetry_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Operational telemetry logs exported to CSV.", "success");
  };

  // Main Simulation engine runner loop using requestAnimationFrame
  const simulateStep = (timeDelta) => {
    const speedAdjustedDelta = timeDelta * simulationSpeed;
    
    setNodes(prevNodes => {
      // Defer state updates for item movement
      const nextNodes = prevNodes.map(n => ({ ...n, currentBuffer: [...n.currentBuffer] }));

      // Loop through all nodes starting from the end of the line (downstream to upstream)
      for (let i = nextNodes.length - 1; i >= 0; i--) {
        const node = nextNodes[i];

        // 1. Stochastic Machine Failure updates
        if (node.status === 'Broken') {
          node.repairTimeRemaining -= speedAdjustedDelta;
          if (node.repairTimeRemaining <= 0) {
            node.status = 'Normal';
            node.repairTimeRemaining = 0;
            node.timeToFailure = node.mtbf;
            addLog(`Machine [${node.name}] successfully repaired and online.`, "info");
          }
          continue;
        } else {
          node.timeToFailure -= speedAdjustedDelta;
          if (node.timeToFailure <= 0) {
            node.status = 'Broken';
            node.repairTimeRemaining = node.mttr;
            addLog(`FAILURE ALERT: Machine [${node.name}] broke down! MTTR: ${node.mttr}s`, "error");
            continue;
          }
        }

        // 2. Inlet behavior: spawns items automatically
        if (node.type === 'Inlet') {
          if (!node.activeItem) {
            node.activeItem = { id: `item-${Date.now()}-${Math.random()}`, val: Math.floor(Math.random() * 900 + 100) };
            node.processProgress = 0;
            node.status = 'Normal';
          }
        } else {
          // If no active item, try to fetch from its own incoming staging buffer
          if (!node.activeItem && node.currentBuffer.length > 0) {
            node.activeItem = node.currentBuffer.shift();
            node.processProgress = 0;
            node.status = 'Normal';
          }
        }

        // 3. Process the current active item
        if (node.activeItem) {
          node.processProgress += speedAdjustedDelta;
          node.status = 'Normal';

          if (node.processProgress >= node.cycleTime) {
            // Process completed! Try passing downstream
            const nextNode = nextNodes[i + 1];

            if (nextNode) {
              if (nextNode.currentBuffer.length < nextNode.maxBuffer) {
                // Trigger an visual overlay animation token transition
                const sourceId = node.id;
                const destId = nextNode.id;
                const itemId = node.activeItem.id;
                const itemVal = node.activeItem.val;
                
                // Safe state addition of moving token
                setAnimations(prev => [...prev, { id: itemId, val: itemVal, from: sourceId, to: destId, progress: 0 }]);

                nextNode.currentBuffer.push(node.activeItem);
                node.activeItem = null;
                node.processProgress = 0;
                node.totalProcessed += 1;
              } else {
                // Downstream staging buffer is full => Blocked
                node.status = 'Blocked';
              }
            } else {
              // Final node packager: completes production run item
              const isDefect = Math.random() < node.defectRate;
              if (isDefect) {
                setDefectedCount(prev => prev + 1);
                addLog(`QUALITY CONTROL: Defect detected at node [${node.name}]! Scrap discarded.`, "error");
              } else {
                setTotalProduced(prev => prev + 1);
              }
              node.activeItem = null;
              node.processProgress = 0;
              node.totalProcessed += 1;
            }
          }
        } else {
          // Empty upstream stage/buffer => Starved state
          if (node.type !== 'Inlet') {
            node.status = 'Starved';
          }
        }
      }

      return nextNodes;
    });

    // Update animations positioning
    setAnimations(prev => prev.map(anim => ({
      ...anim,
      progress: anim.progress + (speedAdjustedDelta * 2)
    })).filter(anim => anim.progress < 1));
  };

  // Animation Loop management
  useEffect(() => {
    if (!isPlaying) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const loop = (timestamp) => {
      if (previousTimeRef.current !== undefined) {
        const elapsed = (timestamp - previousTimeRef.current) / 1000;
        
        // Safety guard for extreme frame skips
        if (elapsed < 0.1) {
          const startTime = performance.now();
          simulateStep(elapsed);
          setLatency(Math.round(performance.now() - startTime));
        }
      }
      previousTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, simulationSpeed, nodes]);

  return (
    <div className="app-container">
      {/* Header Banner */}
      <header className="header-banner">
        <h1 style={{ fontSize: '14pt' }}>Production Factory Assembly Line Optimization Laboratory</h1>
        <div className="header-metadata">
          <span>B.Tech CSE 2025-29</span>
          <span>Semester II</span>
          <span style={{ fontWeight: 'bold', color: 'var(--steel-blue)' }}>Made by Saiyash Poojari</span>
        </div>
      </header>

      {/* Main split dashboard view */}
      <main className="main-workspace">
        {/* Left Side: Parameters Form Console */}
        <section className="control-panel">
          <div className="panel-header">
            <span>Factory Configuration</span>
            {isPlaying ? (
              <span style={{ color: 'var(--steel-blue)' }}>Running...</span>
            ) : (
              <span style={{ color: '#7f8c8d' }}>Paused</span>
            )}
          </div>
          
          <div className="panel-content">
            {/* Toolbar Action Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button onClick={handleInitializeRun} disabled={isPlaying} className="primary-run-btn">
                <Play size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Start Run
              </button>
              <button onClick={() => setIsPlaying(false)} disabled={!isPlaying}>
                <Pause size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Pause Run
              </button>
              <button onClick={handleAddNode}>
                <Plus size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Add Node
              </button>
              <button onClick={handleInjectFailure} className="danger-fail-btn">
                <Zap size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Fail Node
              </button>
              <button onClick={handleOptimizeLineBalance} style={{ gridColumn: 'span 2' }}>
                <Sparkles size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Optimize Line Balance
              </button>
              <button onClick={handleResetConfig} style={{ gridColumn: 'span 2' }}>
                <RotateCcw size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Reset Layout Configuration
              </button>
            </div>

            {/* Simulation controls */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Simulation Speed Factor:</label>
              <select 
                value={simulationSpeed} 
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value="0.5">0.5x Speed</option>
                <option value="1">1.0x (Real-Time)</option>
                <option value="2">2.0x Fast Run</option>
                <option value="5">5.0x Turbo Simulation</option>
              </select>
            </div>

            {/* Workstations parametrics listing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="form-section-title">
                Workstation Parametric Matrix
              </span>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Node Description</th>
                      <th>Cycle (s)</th>
                      <th>Buffer Limit</th>
                      <th>Defect</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map(n => (
                      <tr key={n.id}>
                        <td>
                          <input 
                            type="text" 
                            value={n.name}
                            onChange={(e) => handleConfigChange(n.id, 'name', e.target.value)}
                            style={{ width: '85px', border: 'none', background: 'transparent' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0.5" 
                            max="30" 
                            step="0.1" 
                            value={n.cycleTime}
                            onChange={(e) => handleConfigChange(n.id, 'cycleTime', Number(e.target.value))}
                            style={{ width: '45px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="1" 
                            max="20" 
                            value={n.maxBuffer}
                            onChange={(e) => handleConfigChange(n.id, 'maxBuffer', Number(e.target.value))}
                            style={{ width: '40px' }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="0" 
                            max="0.5" 
                            step="0.01" 
                            value={n.defectRate}
                            onChange={(e) => handleConfigChange(n.id, 'defectRate', Number(e.target.value))}
                            style={{ width: '40px' }}
                          />
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteNode(n.id, n.name)}
                            style={{ padding: '2px 4px', background: 'transparent', border: 'none' }}
                          >
                            <Trash2 size={12} style={{ color: 'var(--crimson)' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Visual Flow Stage Area */}
        <section className="stage-panel">
          <div className="panel-header">
            <span>Interactive Assembly Line Visualization Stage</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--steel-blue)', fontWeight: 'bold' }}>● Steel Blue: Processing</span>
              <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>● Amber: Starved</span>
              <span style={{ color: 'var(--crimson)', fontWeight: 'bold' }}>● Crimson: Blocked</span>
            </div>
          </div>

          <div className="panel-content">
            <div className="canvas-container">
              {/* Dynamic Live Factory flow viewport */}
              <div className="flow-row">
                {nodes.map((n, idx) => {
                  let statusClass = 'node-state-normal';
                  let badgeClass = 'badge-normal';
                  if (n.status === 'Starved') { statusClass = 'node-state-starved'; badgeClass = 'badge-starved'; }
                  if (n.status === 'Blocked') { statusClass = 'node-state-blocked'; badgeClass = 'badge-blocked'; }
                  if (n.status === 'Broken') { statusClass = 'node-state-broken'; badgeClass = 'badge-broken'; }

                  return (
                    <React.Fragment key={n.id}>
                      {/* Workstation block */}
                      <div className={`flow-node ${statusClass}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '3px' }}>
                          <span style={{ fontWeight: 'bold' }}>{n.name}</span>
                        </div>
                        
                        {/* Center progress indicator */}
                        <div style={{ margin: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
                            <span>Progress:</span>
                            <span>{Math.round((n.processProgress / n.cycleTime) * 100)}%</span>
                          </div>
                          <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${Math.min(100, (n.processProgress / n.cycleTime) * 100)}%`, 
                                background: n.status === 'Broken' ? '#95a5a6' : 'var(--steel-blue)' 
                              }} 
                            />
                          </div>
                        </div>

                        {/* Node status message */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`node-status-badge ${badgeClass}`}>{n.status}</span>
                          <span style={{ fontWeight: 'bold' }}>{n.cycleTime}s</span>
                        </div>
                      </div>

                      {/* Staging queue buffer representation */}
                      {idx < nodes.length - 1 && (
                        <React.Fragment>
                          <div className="connector-line" />
                          <div className="flow-buffer">
                            <span style={{ fontSize: '8pt', color: '#7f8c8d', fontWeight: 'bold' }}>Queue ({n.currentBuffer?.length || 0}/{n.maxBuffer})</span>
                            <div className="buffer-slots">
                              {Array.from({ length: n.maxBuffer }).map((_, slotIdx) => {
                                const isFilled = slotIdx < (n.currentBuffer?.length || 0);
                                return (
                                  <div 
                                    key={slotIdx} 
                                    className={`buffer-slot ${isFilled ? 'filled' : ''}`}
                                  >
                                    {isFilled && <span style={{ fontSize: '7pt', color: 'white', fontWeight: 'bold' }}>#</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="connector-line" />
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Animated flowing vector overlay items */}
                {animations.map(anim => (
                  <div 
                    key={anim.id} 
                    className="moving-token"
                    style={{
                      transform: `translateX(${anim.progress * 100}px)`,
                      transition: 'transform 0.1s linear'
                    }}
                  >
                    {anim.val}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Diagnostics HUD */}
      <footer className="telemetry-hud">
        {/* HUD grid counters */}
        <section className="hud-grid">
          <div className="hud-metric-box">
            <span className="metric-label">Total Produced</span>
            <span className="metric-value">{totalProduced} Units</span>
          </div>
          <div className="hud-metric-box">
            <span className="metric-label">OEE % Rating</span>
            <span className="metric-value">{calculateOEE()}%</span>
          </div>
          <div className="hud-metric-box">
            <span className="metric-label">Line Balance (LE %)</span>
            <span className="metric-value">{calculateLineEfficiency()}%</span>
          </div>
          <div className="hud-metric-box">
            <span className="metric-label">Bottleneck Target</span>
            <span className="metric-value" style={{ color: 'var(--crimson)' }}>{getBottleneckNode()}</span>
          </div>
          <div className="hud-metric-box" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="metric-label">Latency</span>
              <span className="metric-value">{latency} ms</span>
            </div>
            <button onClick={handleExportCSV} title="Export telemetry log list to flat CSV file">
              <Download size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Export CSV
            </button>
          </div>
        </section>

        {/* Realtime Terminal Logs */}
        <div className="terminal-logs">
          {telemetryLogs.length === 0 ? (
            <div style={{ color: '#bdc3c7' }}>[SYSTEM STATE READY] Initialize production run to start receiving logs...</div>
          ) : (
            telemetryLogs.map((log, index) => (
              <div key={index} style={{ color: log.type === 'error' ? '#f1948a' : log.type === 'success' ? '#58d68d' : log.type === 'warning' ? '#f5b041' : '#ecf0f1' }}>
                [{log.time}] {log.message}
              </div>
            ))
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
