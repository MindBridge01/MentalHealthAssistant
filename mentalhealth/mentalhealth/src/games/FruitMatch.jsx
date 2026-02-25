import React, { useState, useEffect, useCallback } from 'react';
import './FruitMatch.css';

const fruits = [
  { name: 'Apple', emoji: '🍎' },
  { name: 'Banana', emoji: '🍌' },
  { name: 'Grapes', emoji: '🍇' },
  { name: 'Strawberry', emoji: '🍓' },
  { name: 'Watermelon', emoji: '🍉' },
  { name: 'Pineapple', emoji: '🍍' },
];

const FruitMatch = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bestTime, setBestTime] = useState(() => {
    const stored = localStorage.getItem('fruitMatchBestTime');
    return stored ? parseInt(stored) : null;
  });
  const [bestMoves, setBestMoves] = useState(() => {
    const stored = localStorage.getItem('fruitMatchBestMoves');
    return stored ? parseInt(stored) : null;
  });

  // Shuffle array utility
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Initialize game with shuffled cards
  const initializeGame = useCallback(() => {
    const gameFruits = fruits.slice(0, 6); // Use 6 fruits for 6 pairs
    const cardPairs = gameFruits.flatMap(fruit => [
      { id: `${fruit.name}-1`, name: fruit.name, emoji: fruit.emoji, flipped: false, matched: false },
      { id: `${fruit.name}-2`, name: fruit.name, emoji: fruit.emoji, flipped: false, matched: false }
    ]);
    setCards(shuffleArray(cardPairs));
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTime(0);
    setGameStarted(true);
    setGameCompleted(false);
  }, [shuffleArray]);

  // Handle card click
  const handleCardClick = (cardId) => {
    if (flippedCards.length === 2) return; // Prevent clicking when 2 cards are already flipped

    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return; // Prevent clicking flipped or matched cards

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // Update card state to show it as flipped
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, flipped: true } : c
    ));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);

      // Check for match after a short delay
      setTimeout(() => {
        const [firstId, secondId] = newFlipped;
        const firstCard = cards.find(c => c.id === firstId);
        const secondCard = cards.find(c => c.id === secondId);

        if (firstCard.name === secondCard.name) {
          // Match found - mark as matched
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
          ));
          setMatchedPairs(prev => prev + 1);
        } else {
          // No match - flip back
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
          ));
        }
        setFlippedCards([]);
      }, 1000);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted]);

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === 6 && gameStarted) {
      setGameCompleted(true);
      setGameStarted(false);

      // Update best scores
      if (!bestTime || time < bestTime) {
        setBestTime(time);
        localStorage.setItem('fruitMatchBestTime', time.toString());
      }
      if (!bestMoves || moves < bestMoves) {
        setBestMoves(moves);
        localStorage.setItem('fruitMatchBestMoves', moves.toString());
      }
    }
  }, [matchedPairs, gameStarted, time, moves, bestTime, bestMoves]);

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setGameCompleted(false);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTime(0);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fruit-match">
      <div className="game-container">
        <h1>Fruit Match</h1>

        {!gameStarted && !gameCompleted && (
          <div className="start-screen">
            <p>Match the fruit pairs to test your focus!</p>
            <button className="start-button" onClick={initializeGame}>
              Start Game
            </button>
          </div>
        )}

        {gameStarted && !gameCompleted && (
          <div className="game-play">
            <div className="game-stats">
              <div className="stat">Time: {formatTime(time)}</div>
              <div className="stat">Moves: {moves}</div>
              <div className="stat">Pairs: {matchedPairs}/6</div>
              <button className="reset-button" onClick={resetGame}>
                Reset
              </button>
            </div>

            <div className="cards-grid">
              {cards.map(card => (
                <div
                  key={card.id}
                  className={`card ${card.flipped || card.matched ? 'flipped' : ''}`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className="card-inner">
                    <div className="card-front">?</div>
                    <div className="card-back">
                      <div className="fruit-emoji">{card.emoji}</div>
                      <div className="fruit-name">{card.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameCompleted && (
          <div className="completion-screen">
            <h2>Great focus! 🎉</h2>
            <div className="final-stats">
              <p>Time: {formatTime(time)}</p>
              <p>Moves: {moves}</p>
            </div>
            {(bestTime || bestMoves) && (
              <div className="best-scores">
                {bestTime && <p>Best Time: {formatTime(bestTime)}</p>}
                {bestMoves && <p>Best Moves: {bestMoves}</p>}
              </div>
            )}
            <button className="play-again-button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FruitMatch;