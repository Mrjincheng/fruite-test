
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GridElement, GameStats } from './types';
import { AdSDK } from './services/adService';
import { getLeaderboard, saveScore } from './services/storageService';

const GRID_SIZE = 6; 
const INITIAL_STEPS = 25; // 大量步数，降低难度

const TECH_THEMES: Record<string, { bg: string, label: string, color: string }> = {
  react: { bg: 'bg-sky-900/40', label: 'REACT', color: 'text-sky-400' },
  python: { bg: 'bg-yellow-900/40', label: 'PY', color: 'text-yellow-400' },
  docker: { bg: 'bg-blue-900/40', label: 'SHIP', color: 'text-blue-400' },
  bug: { bg: 'bg-red-900/40', label: 'FIX', color: 'text-red-400' },
  empty: { bg: 'bg-transparent', label: '', color: '' }
};

const TECH_ICONS: Record<string, string> = {
  react: '⚛️',
  python: '🐍',
  docker: '🐋',
  bug: '🐛',
  empty: ''
};

const TITLES = ["实习生", "初级工程师", "中级工程师", "高级架构师", "CTO", "独立开发者"];

const App: React.FC = () => {
  const [grid, setGrid] = useState<GridElement[][]>([]);
  const [stats, setStats] = useState<GameStats & { layer: number }>({
    gold: 0,
    diamonds: 0,
    stamina: 100,
    score: 0,
    steps: INITIAL_STEPS,
    layer: 1
  });
  
  const [selected, setSelected] = useState<{r: number, c: number} | null>(null);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [deployPower, setDeployPower] = useState(0); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [leaderboard, setLeaderboard] = useState(getLeaderboard());
  const [combo, setCombo] = useState(0);
  const [isCommitActive, setIsCommitActive] = useState(false);
  
  const dragStartPos = useRef<{r: number, c: number} | null>(null);

  const initGrid = useCallback(() => {
    const types = ['react', 'python', 'docker', 'bug'];
    const newGrid: GridElement[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: GridElement[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let type = types[Math.floor(Math.random() * types.length)];
        while (
          (r >= 2 && newGrid[r-1][c].type === type && newGrid[r-2][c].type === type) ||
          (c >= 2 && row[c-1].type === type && row[c-2].type === type)
        ) {
          type = types[Math.floor(Math.random() * types.length)];
        }
        row.push({ id: Math.random().toString(36), type: type as any, level: 1 });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setStats(prev => ({ ...prev, steps: INITIAL_STEPS, score: 0, layer: 1 }));
    setLeaderboard(getLeaderboard());
  }, []);

  useEffect(() => {
    initGrid();
    const timer = setInterval(() => setLeaderboard(getLeaderboard()), 30000);
    return () => clearInterval(timer);
  }, [initGrid]);

  const checkMatches = (currentGrid: GridElement[][]) => {
    const matchedCoords = new Set<string>();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const t = currentGrid[r][c].type;
        if (t !== 'empty' && t === currentGrid[r][c+1].type && t === currentGrid[r][c+2].type) {
          matchedCoords.add(`${r},${c}`); matchedCoords.add(`${r},${c+1}`); matchedCoords.add(`${r},${c+2}`);
        }
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const t = currentGrid[r][c].type;
        if (t !== 'empty' && t === currentGrid[r+1][c].type && t === currentGrid[r+2][c].type) {
          matchedCoords.add(`${r},${c}`); matchedCoords.add(`${r+1},${c}`); matchedCoords.add(`${r+2},${c}`);
        }
      }
    }
    return Array.from(matchedCoords).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { r, c };
    });
  };

  const fillAndCheck = async (currentGrid: GridElement[][], currentCombo: number) => {
    setIsProcessing(true);
    const matches = checkMatches(currentGrid);
    
    if (matches.length > 0) {
      const nextCombo = currentCombo + 1;
      setCombo(nextCombo);
      
      setHighlighted(new Set(matches.map(m => `${m.r},${m.c}`)));
      await new Promise(resolve => setTimeout(resolve, 200)); 
      setHighlighted(new Set());

      matches.forEach(({r, c}) => { currentGrid[r][c].type = 'empty' as any; });
      
      setStats(prev => {
        const addedScore = Math.floor(matches.length * 150 * nextCombo);
        const newScore = prev.score + addedScore;
        if (newScore >= prev.layer * 2000) {
          return { ...prev, score: newScore, steps: prev.steps + 8, layer: prev.layer + 1 };
        }
        return { ...prev, score: newScore };
      });
      
      setDeployPower(prev => Math.min(100, prev + matches.length * 8));

      for (let c = 0; c < GRID_SIZE; c++) {
        let emptySpot = GRID_SIZE - 1;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (currentGrid[r][c].type !== ('empty' as any)) {
            const temp = currentGrid[emptySpot][c];
            currentGrid[emptySpot][c] = currentGrid[r][c];
            currentGrid[r][c] = temp;
            emptySpot--;
          }
        }
      }

      const types = ['react', 'python', 'docker', 'bug'];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (currentGrid[r][c].type === ('empty' as any)) {
            currentGrid[r][c] = { id: Math.random().toString(36), type: types[Math.floor(Math.random() * types.length)] as any, level: 1 };
          }
        }
      }
      setGrid([...currentGrid.map(row => [...row])]);
      setTimeout(() => fillAndCheck(currentGrid, nextCombo), 200);
    } else {
      setIsProcessing(false);
      setCombo(0);
      if (stats.steps <= 0) {
        saveScore({ name: "Senior_Dev", score: stats.score, date: Date.now() });
        await AdSDK.showInterstitial();
        initGrid();
      }
    }
  };

  const handleCommitPush = () => {
    if (deployPower < 100 || isProcessing) return;
    setDeployPower(0);
    setIsCommitActive(true);
    setTimeout(() => setIsCommitActive(false), 600);
    const newGrid = grid.map(row => row.map(cell => Math.random() > 0.5 ? {...cell, type: 'empty' as any} : cell));
    setGrid(newGrid);
    fillAndCheck(newGrid, 0);
  };

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing) return;
    const newGrid = grid.map(row => row.map(cell => ({...cell})));
    const temp = newGrid[r1][c1];
    newGrid[r1][c1] = newGrid[r2][c2];
    newGrid[r2][c2] = temp;
    if (checkMatches(newGrid).length > 0) {
      setStats(prev => ({ ...prev, steps: prev.steps - 1 }));
      setGrid(newGrid);
      fillAndCheck(newGrid, 0);
    } else {
      setGrid([...newGrid.map(row => [...row])]);
      setTimeout(() => setGrid(grid.map(row => row.map(cell => ({...cell})))), 150);
    }
  };

  const currentTitle = TITLES[Math.min(stats.layer - 1, TITLES.length - 1)];

  return (
    <div className={`flex flex-col h-screen max-h-screen overflow-hidden bg-[#0f172a] text-[#38bdf8] relative transition-all duration-300
      ${isCommitActive ? 'brightness-150 scale-105' : ''}`}>
      
      {/* HUD Header */}
      <header className="z-20 px-6 pt-10 pb-2 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold glow-text tracking-tighter">DEVLIFE_OS v1.0</h1>
            <div className="text-[10px] opacity-50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SYSTEM_READY: {currentTitle}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-50">Career Points</div>
            <div className="text-3xl font-black tracking-tight">{stats.score.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <div className="flex-1 terminal-panel px-4 py-2 border-l-4 border-l-sky-500">
            <div className="text-[10px] opacity-50 uppercase">Experience</div>
            <div className="text-xl font-bold">LVL_{stats.layer.toString().padStart(2, '0')}</div>
          </div>
          <div className="flex-1 terminal-panel px-4 py-2 border-l-4 border-l-orange-500">
            <div className="text-[10px] opacity-50 uppercase">Brain Power</div>
            <div className="text-xl font-bold">{stats.steps.toString().padStart(2, '0')} Ops</div>
          </div>
        </div>
      </header>

      {/* Code Editor Grid */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
        <div className="relative w-full max-w-[min(100%,100vh-420px)] aspect-square">
          <div className="grid-container grid grid-cols-6 gap-2 p-3 w-full h-full relative z-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {grid.map((row, r) => row.map((cell, c) => {
              const theme = TECH_THEMES[cell.type] || TECH_THEMES.empty;
              const isSel = selected?.r === r && selected?.c === c;
              const isMatch = highlighted.has(`${r},${c}`);
              
              return (
                <div
                  key={cell.id}
                  onMouseDown={() => { if(!isProcessing) { dragStartPos.current = {r, c}; setSelected({r, c}); } }}
                  onMouseEnter={() => {
                    if (dragStartPos.current) {
                      const dist = Math.abs(r - dragStartPos.current.r) + Math.abs(c - dragStartPos.current.c);
                      if (dist === 1) { handleSwap(dragStartPos.current.r, dragStartPos.current.c, r, c); dragStartPos.current = null; setSelected(null); }
                    }
                  }}
                  onMouseUp={() => { dragStartPos.current = null; setSelected(null); }}
                  className={`relative aspect-square rounded-xl flex items-center justify-center transition-all duration-200 transform cursor-pointer border
                    ${cell.type === 'empty' ? 'opacity-0 scale-50' : `${theme.bg} border-white/5 shadow-lg`} 
                    ${isMatch ? 'bg-white scale-110 z-10 shadow-[0_0_20px_#fff]' : 'hover:border-white/20 active:scale-95'} 
                    ${isSel ? 'ring-2 ring-white scale-110 z-20 bg-white/10' : ''}`}
                >
                  <span className="text-4xl sm:text-5xl lg:text-6xl select-none leading-none flex items-center justify-center drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
                    {TECH_ICONS[cell.type]}
                  </span>
                  {cell.type !== 'empty' && (
                    <span className={`absolute bottom-1 right-1 text-[8px] font-bold opacity-30 ${theme.color}`}>
                      {theme.label}
                    </span>
                  )}
                </div>
              );
            }))}
          </div>

          {/* Floating Text Feedback */}
          {combo > 1 && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="bg-sky-500 text-white px-6 py-1 rounded border-2 border-white shadow-xl animate-bounce">
                <span className="text-sm font-bold italic">
                   {combo === 2 ? 'DEBUGGED' : combo === 3 ? 'REFACTORED' : 'DEPLOYED!'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Terminal Controls */}
      <footer className="z-20 px-6 pb-12 flex flex-col items-center gap-4">
        <div className="w-full max-w-md terminal-panel p-4 flex items-center gap-4">
          <button 
            onClick={handleCommitPush}
            disabled={deployPower < 100 || isProcessing}
            className={`group relative shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center transition-all duration-300 transform active:scale-90 border-2
              ${deployPower >= 100 
                ? 'bg-sky-600 border-white text-white cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.5)] hover:-translate-y-1' 
                : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            <span className="text-3xl">🚀</span>
            <span className="text-[8px] font-bold mt-1 uppercase">Commit</span>
            {deployPower >= 100 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-[8px] px-1 rounded animate-ping">!</span>
            )}
          </button>

          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-bold opacity-50 tracking-tighter">DEPL_PROG [./deploy.sh]</span>
              <span className="text-xs font-bold text-sky-400">{deployPower}%</span>
            </div>
            <div className="h-4 bg-slate-900 rounded border border-white/10 p-0.5 overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-500 ease-out relative shadow-[0_0_10px_rgba(56,189,248,0.8)]" 
                style={{ width: `${deployPower}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_infinite]"></div>
              </div>
            </div>
            <div className="text-[8px] opacity-30 mt-1 font-mono">
              {"> "} RUNNING STACK_CLEANUP... OK
            </div>
          </div>
        </div>

        {/* Mini Leaderboard Stats */}
        <div className="w-full flex justify-between text-[9px] opacity-40 uppercase tracking-widest px-2">
          <span>Server Reset: {Math.floor((leaderboard.nextReset - Date.now()) / 60000)}m</span>
          <span>Top Score: {leaderboard.entries[0]?.score || 0}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
