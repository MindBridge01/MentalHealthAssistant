import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlayGames = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 relative">
            <span
                className="material-icons absolute top-6 left-6 text-3xl cursor-pointer text-gray-500 hover:text-gray-800"
                onClick={() => navigate('/ai-chat')}
            >
                close
            </span>
            <h1 className="text-4xl font-bold text-dark-blue900 mb-4">Play Games</h1>
            <p className="text-xl text-gray-600 max-w-2xl text-center mb-8">
                Our relaxing and therapeutic mental health mini-games will be available here soon.
            </p>
            <button
                className="relative px-6 py-4 bg-slate-800 rounded-2xl inline-flex justify-center items-center gap-2.5 gradient-stroke-darkblue text-white text-l font-bold font-[Satoshi]"
                onClick={() => navigate('/stress-catch')}
            >
                Stress Catching
            </button>
        </div>
    );
};

export default PlayGames;
