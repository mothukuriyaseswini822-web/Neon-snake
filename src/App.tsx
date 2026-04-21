import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Trophy } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "AI Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    color: "from-cyan-400 to-blue-500"
  },
  {
    id: 2,
    title: "Midnight Drive",
    artist: "AI Retrowave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "from-fuchsia-400 to-purple-500"
  },
  {
    id: 3,
    title: "Cybernetic Horizon",
    artist: "AI Darkwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "from-green-400 to-emerald-500"
  }
];

// Snake constants
const GRID_SIZE = 20;
const CELL_SIZE = 24; // slightly larger for visibility
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

// Utility functions
const generateFood = (snake: {x: number, y: number}[]) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    const collision = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
    if (!collision) break;
  }
  return newFood;
};

export default function App() {
  // --- Music Player State ---
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIdx]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const skipForward = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const skipBack = () => {
    setCurrentTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => skipForward();

  const currentTrack = TRACKS[currentTrackIdx];

  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const directionRef = useRef(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Initialize food on first mount cleanly
  useEffect(() => {
    setFood(generateFood(INITIAL_SNAKE));
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood([{ x: 10, y: 10 }]));
    setIsGameOver(false);
    setIsGameRunning(true);
    setScore(0);
    if (!isPlaying) setIsPlaying(true);
  };

  const stopGame = () => {
    setIsGameRunning(false);
    setIsGameOver(true);
    if (score > highScore) setHighScore(score);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows and space
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === " " && (!isGameRunning || isGameOver)) {
        resetGame();
        return;
      }

      if (!isGameRunning) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, isGameOver, score, highScore, isPlaying]);

  useEffect(() => {
    if (!isGameRunning) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const dir = directionRef.current;
        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          stopGame();
          return prevSnake;
        }

        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          stopGame();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        setDirection(dir);

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const dynamicSpeed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10);
    const interval = setInterval(moveSnake, dynamicSpeed);
    return () => clearInterval(interval);
  }, [isGameRunning, food, score]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col items-center justify-center p-4 md:p-8 selection:bg-cyan-500/30 overflow-hidden">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleEnded}
        loop={false}
      />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 z-10 relative items-center">
        
        {/* Left Column (Music Player & Score Wrapper) */}
        <div className="flex flex-col gap-8 lg:col-span-5 order-2 lg:order-1">
          
          {/* Branding */}
          <div className="mb-4 text-center lg:text-left">
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 uppercase drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">Neon Snake</h1>
            <p className="text-[11px] text-fuchsia-400 uppercase tracking-[0.4em] font-bold mt-2 opacity-80">Synthwave Edition</p>
          </div>

          {/* Music Player Widget */}
          <div className="bg-[#0f0f13] border border-[#222] rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-[#333] transition-colors">
            <div className={`absolute top-0 w-full left-0 h-1 bg-gradient-to-r ${currentTrack.color} opacity-80`} />
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_cyan]' : 'bg-neutral-600'}`} />
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">{isPlaying ? 'Now Playing' : 'Paused'}</span>
              </div>
              <div className="flex gap-1.5 h-4 items-end">
                <div className={`w-1.5 bg-cyan-500 rounded-full transition-all duration-300 ${isPlaying ? 'h-full animate-bounce' : 'h-1'}`} style={{ animationDelay: '0ms' }}/>
                <div className={`w-1.5 bg-fuchsia-500 rounded-full transition-all duration-300 ${isPlaying ? 'h-3/4 animate-bounce' : 'h-1'}`} style={{ animationDelay: '100ms' }}/>
                <div className={`w-1.5 bg-cyan-500 rounded-full transition-all duration-300 ${isPlaying ? 'h-1/2 animate-bounce' : 'h-1'}`} style={{ animationDelay: '200ms' }}/>
              </div>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2 truncate">{currentTrack.title}</h3>
              <p className="text-sm text-neutral-500 uppercase tracking-wider truncate">{currentTrack.artist}</p>
            </div>

            <div className="flex items-center justify-center lg:justify-between gap-6 lg:gap-0">
              <button 
                onClick={skipBack}
                className="text-neutral-500 hover:text-white hover:scale-110 active:scale-95 transition-all outline-none"
                aria-label="Previous Track"
              >
                <SkipBack size={28} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] outline-none"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="translate-x-[2px]" />}
              </button>

              <button 
                onClick={skipForward}
                className="text-neutral-500 hover:text-white hover:scale-110 active:scale-95 transition-all outline-none"
                aria-label="Next Track"
              >
                <SkipForward size={28} fill="currentColor" />
              </button>
            </div>
            
            {/* Track indicators */}
            <div className="flex justify-center lg:justify-start gap-3 mt-8">
              {TRACKS.map((t, idx) => (
                <div 
                  key={t.id} 
                  onClick={() => { setCurrentTrackIdx(idx); setIsPlaying(true); }}
                  className={`h-1.5 rounded-full cursor-pointer transition-all ${idx === currentTrackIdx ? 'w-8 bg-cyan-400 shadow-[0_0_8px_cyan]' : 'w-2 bg-neutral-800 hover:bg-neutral-600'}`}
                />
              ))}
            </div>
          </div>

          {/* Stats Info Widget */}
          <div className="bg-[#0f0f13] border border-[#222] rounded-2xl p-6 shadow-2xl flex items-center justify-between divide-x divide-[#333]">
             <div className="w-1/2 pr-6 text-center lg:text-left">
                <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Score</span>
                <span className="block text-4xl font-light tracking-tighter text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                  {String(score).padStart(4, '0')}
                </span>
             </div>
             <div className="w-1/2 pl-6 flex flex-col items-center lg:items-end">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">
                  <Trophy size={14} className="text-fuchsia-400" /> Best
                </span>
                <span className="block text-3xl font-light tracking-tighter text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                  {String(highScore).padStart(4, '0')}
                </span>
             </div>
          </div>
          
          {/* Controls helper */}
          <div className="text-center lg:text-left text-[11px] uppercase tracking-[0.2em] text-neutral-600 mt-2 font-semibold">
            Use WASD or Arrows to maneuver.<br className="hidden lg:block"/> Space to start/restart.
          </div>

        </div>

        {/* Right Column / Center (Game Board) */}
        <div className="lg:col-span-7 flex justify-center order-1 lg:order-2">
           <div className="relative group">
              {/* Board Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl opacity-60 transition-opacity duration-1000 -z-10"></div>
              
              {/* Outer bezel */}
              <div className="bg-[#1a1a1a] p-3 md:p-4 rounded-3xl shadow-2xl border border-[#333]">
                {/* The Grid container */}
                <div 
                  className="relative bg-[#050505] rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-[#111]"
                  style={{ 
                    width: `${GRID_SIZE * CELL_SIZE}px`, 
                    height: `${GRID_SIZE * CELL_SIZE}px`
                  }}
                >
                    {/* Internal grid lines */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
                      style={{
                        backgroundImage: `linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)`,
                        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                      }}
                    />

                    {/* Render Food */}
                    <div 
                      className="absolute bg-fuchsia-500 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.9)] animate-pulse"
                      style={{
                        left: `${food.x * CELL_SIZE + 2}px`,
                        top: `${food.y * CELL_SIZE + 2}px`,
                        width: `${CELL_SIZE - 4}px`,
                        height: `${CELL_SIZE - 4}px`,
                      }}
                    />

                    {/* Render Snake */}
                    {snake.map((segment, index) => {
                      const isHead = index === 0;
                      return (
                        <div 
                          key={index}
                          className={`absolute rounded-[4px] transition-all duration-75 ${
                            isHead 
                              ? 'bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.9)] z-10 animate-pulse' 
                              : 'bg-cyan-500/90 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                          }`}
                          style={{
                            left: `${segment.x * CELL_SIZE + 1}px`,
                            top: `${segment.y * CELL_SIZE + 1}px`,
                            width: `${CELL_SIZE - 2}px`,
                            height: `${CELL_SIZE - 2}px`,
                          }}
                        />
                      );
                    })}

                    {/* Overlay for Game Over / Start */}
                    {(!isGameRunning || isGameOver) && (
                      <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                         {isGameOver ? (
                           <>
                             <div className="animate-pulse mb-6">
                               <h2 className="text-5xl font-black text-fuchsia-400 mb-2 drop-shadow-[0_0_15px_rgba(217,70,239,0.6)]">GAME OVER</h2>
                               <p className="text-cyan-300 uppercase tracking-[0.3em] font-bold text-sm">System Failure</p>
                             </div>
                             <p className="text-white mb-8 text-xl font-light">
                               Final Score: <span className="text-cyan-400 font-bold">{score}</span>
                             </p>
                             <button 
                               onClick={resetGame}
                               className="px-10 py-4 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:-translate-y-1 rounded-sm active:translate-y-0"
                             >
                               Reboot System
                             </button>
                           </>
                         ) : (
                           <>
                             <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]">
                               <div className="w-16 h-16 rounded-full border-t-[3px] border-r-[3px] border-cyan-400 animate-spin" />
                             </div>
                             <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">System Ready</h2>
                             <button 
                               onClick={resetGame}
                               className="px-10 py-4 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:-translate-y-1 rounded-sm active:translate-y-0"
                             >
                               Start Sequence
                             </button>
                           </>
                         )}
                      </div>
                    )}
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
