import React from 'react';
import { useNavigate } from 'react-router-dom';

const Counseling = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 md:p-8 relative">
            <span
                className="material-icons absolute top-6 left-6 text-3xl cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
                onClick={() => navigate('/')}
            >
                arrow_back
            </span>

            <div className="w-full max-w-3xl bg-white/80 backdrop-blur border border-purple-100 shadow-xl rounded-3xl p-8 md:p-12 relative overflow-hidden text-center">
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="material-icons text-white text-5xl">volunteer_activism</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-dark-blue900 mb-6">
                        Counseling & Community Support
                    </h1>

                    <p className="text-xl text-gray-700 mb-8 max-w-xl mx-auto leading-relaxed">
                        You're not doing this alone. We highly encourage reaching out to our verified counseling channels. Speaking with others who understand what you are going through can make a world of difference.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10 w-full max-w-lg mx-auto">
                        <a
                            href="https://t.me/mindbridge_counseling"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full sm:w-1/2 bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            <span className="material-icons text-2xl">telegram</span>
                            Telegram Channel
                        </a>

                        <a
                            href="https://discord.gg/mindbridge"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full sm:w-1/2 bg-indigo-500 hover:bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            <span className="material-icons text-2xl">forum</span>
                            Discord Server
                        </a>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl text-left shadow-sm">
                        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                            <span className="material-icons text-purple-700">support_agent</span> Prefer to speak to a professional?
                        </h3>
                        <p className="text-purple-800 text-base leading-relaxed mb-4">
                            Our platform connects you with verified professional doctors and licensed therapists. You can easily find and book an appointment with a specialist for deeper, personalized counseling.
                        </p>
                        <button
                            onClick={() => navigate("/doctor-dashboard")}
                            className="px-6 py-2.5 bg-white text-purple-700 border border-purple-300 rounded-xl font-bold hover:bg-purple-100 transition-colors shadow-sm"
                        >
                            Book a Therapist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Counseling;
