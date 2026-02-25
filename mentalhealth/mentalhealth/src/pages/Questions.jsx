import React from 'react';
import { useNavigate } from 'react-router-dom';

const Questions = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 relative">
            <span
                className="material-icons absolute top-6 left-6 text-3xl cursor-pointer text-gray-500 hover:text-gray-800"
                onClick={() => navigate('/ai-chat')}
            >
                close
            </span>
            <h1 className="text-4xl font-bold text-dark-blue900 mb-4">Questions</h1>
            <p className="text-xl text-gray-600 max-w-2xl text-center">
                Our curated mental health questionnaire and self-assessment tools will be available here soon.
            </p>
        </div>
    );
};

export default Questions;
