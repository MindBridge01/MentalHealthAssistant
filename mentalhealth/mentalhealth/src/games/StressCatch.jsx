import React, { useState, useEffect, useRef, useCallback } from 'react';
import './StressCatch.css';

const StressCatch = () => {
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [bestScore, setBestScore] = useState(parseInt(localStorage.getItem('stressCatchBest')) || 0);
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameOver
  const [clouds, setClouds] = useState([]);
  const [basketX, setBasketX] = useState(50); // percentage
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const gameAreaRef = useRef();
  const animationRef = useRef();
  const lastSpawn = useRef(0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setMisses(0);
    setClouds([]);
    setBasketX(50);
    setLevel(1);
    setMessage('');
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const restartGame = () => {
    startGame();
  };

  const moveBasket = (direction) => {
    setBasketX(prev => Math.max(0, Math.min(100, prev + direction * (reducedMotion ? 3 : 5))));
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    const now = Date.now();
    // spawn clouds
    const spawnInterval = reducedMotion ? 3000 : Math.max(1000, 2000 - level * 30);
    if (now - lastSpawn.current > spawnInterval) {
      setClouds(prev => [...prev, { x: Math.random() * 100, y: 0, speed: reducedMotion ? 0.3 : 0.3 + level * 0.05 }]);
      lastSpawn.current = now;
    }
    // move clouds
    setClouds(prev => prev.map(cloud => ({ ...cloud, y: cloud.y + cloud.speed })).filter(cloud => {
      if (cloud.y > 85) { // bottom, basket at 90%
        if (Math.abs(cloud.x - basketX) < 15) { // caught, basket width ~15%
          setScore(s => {
            const newS = s + 1;
            if (newS % 10 === 0) {
              setLevel(l => l + 1);
              setMessage('Great job! Keep going!');
              setTimeout(() => setMessage(''), 2000);
            }
            return newS;
          });
          return false;
        } else {
          setMisses(m => {
            const newM = m + 1;
            if (newM >= 3) {
              setGameState('gameOver');
              setMessage('Game over. Take a deep breath and try again!');
            }
            return newM;
          });
          return false;
        }
      }
      return true;
    }));
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, basketX, level, reducedMotion]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (gameState === 'gameOver' && score > bestScore) {
      setBestScore(score);
      localStorage.setItem('stressCatchBest', score.toString());
    }
  }, [gameState, score, bestScore]);

  // keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (gameState === 'playing') {
        if (e.key === 'ArrowLeft') moveBasket(-1);
        if (e.key === 'ArrowRight') moveBasket(1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // touch for mobile
  const handleTouchMove = (e) => {
    if (gameState === 'playing' && gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setBasketX(Math.max(0, Math.min(100, percentage)));
    }
  };

  // mouse control
  const handleMouseMove = (e) => {
    if (gameState === 'playing' && gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setBasketX(Math.max(0, Math.min(100, percentage)));
    }
  };

  return (
    <div className="stress-catch">
      <div className="game-ui">
        <div>Score: {score}</div>
        <div>Best: {bestScore}</div>
        <div>Misses: {misses}/3</div>
        {message && <div className="message">{message}</div>}
        <div className="buttons">
          {gameState === 'menu' && <button onClick={startGame}>Start</button>}
          {gameState === 'playing' && <button onClick={pauseGame}>Pause</button>}
          {gameState === 'paused' && <button onClick={() => setGameState('playing')}>Resume</button>}
          {(gameState === 'paused' || gameState === 'gameOver') && <button onClick={restartGame}>Restart</button>}
        </div>
        {isMobile && gameState === 'playing' && (
          <div className="mobile-controls">
            <button onClick={() => moveBasket(-1)}>←</button>
            <button onClick={() => moveBasket(1)}>→</button>
          </div>
        )}
      </div>
      <div
        ref={gameAreaRef}
        className="game-area"
        onTouchMove={handleTouchMove}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => e.preventDefault()} // prevent scroll
      >
        {clouds.map((cloud, i) => (
          <div key={i} className="cloud" style={{ left: `${cloud.x}%`, top: `${cloud.y}%` }}>☁️</div>
        ))}
        <div className="basket" style={{ left: `${basketX - 5}%` }}>🧺</div>
      </div>
    </div>
  );
};

export default StressCatch;