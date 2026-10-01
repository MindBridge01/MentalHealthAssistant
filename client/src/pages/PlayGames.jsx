import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlayGames = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 relative bg-gradient-to-br from-yellow-200 to-pink-300">
            <span
                className="material-icons absolute top-6 left-6 text-3xl cursor-pointer text-gray-500 hover:text-gray-800"
                onClick={() => navigate('/ai-chat')}
            >
                close
            </span>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Play Games</h1>
            <p className="text-xl text-gray-700 max-w-2xl text-center mb-8">
                Our relaxing and therapeutic mental health mini-games will be available here soon.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 cursor-pointer hover:bg-opacity-90 transition-all duration-300 border border-gray-300 hover:scale-105 flex items-center justify-center shadow-lg" onClick={() => navigate('/stress-catch')}>
                    <h3 className="text-2xl font-bold text-gray-800">Cloud Catch</h3>
                </div>
                <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 cursor-pointer hover:bg-opacity-90 transition-all duration-300 border border-gray-300 hover:scale-105 flex items-center justify-center shadow-lg" onClick={() => navigate('/fruit-match')}>
                    <h3 className="text-2xl font-bold text-gray-800">FruitMatch</h3>
                </div>
            </div>
        </div>
    );
};

export default PlayGames;
