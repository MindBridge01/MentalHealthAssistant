import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const screeningQuestionsData = [
    { id: 1, category: 'Anxiety', text: 'I feel nervous, anxious, or on edge.' },
    { id: 2, category: 'Anxiety', text: 'I cannot stop or control worrying.' },
    { id: 3, category: 'Anxiety', text: 'I worry too much about different things.' },
    { id: 4, category: 'Anxiety', text: 'I feel restless or unable to relax.' },
    { id: 5, category: 'Depression', text: 'I feel sad, empty, or hopeless.' },
    { id: 6, category: 'Depression', text: 'I have little interest or pleasure in doing things.' },
    { id: 7, category: 'Depression', text: 'I feel tired or have little energy.' },
    { id: 8, category: 'Depression', text: 'I feel worthless or guilty.' },
    { id: 9, category: 'Stress', text: 'I feel overwhelmed by responsibilities.' },
    { id: 10, category: 'Stress', text: 'I feel unable to control important things in my life.' },
    { id: 11, category: 'Stress', text: 'I feel irritated or easily angered.' },
    { id: 12, category: 'Stress', text: 'I have difficulty sleeping due to pressure or workload.' },
];

const screeningOptions = [
    { value: 0, label: 'Not at all' },
    { value: 1, label: 'Several days' },
    { value: 2, label: 'More than half the days' },
    { value: 3, label: 'Nearly every day' },
];

function shuffleArray(array) {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const severityData = {
    Depression: {
        instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
        options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
        ],
        questions: [
            { id: 'd1', text: 'Little interest or pleasure in doing things' },
            { id: 'd2', text: 'Feeling down, depressed, or hopeless' },
            { id: 'd3', text: 'Trouble falling or staying asleep, or sleeping too much' },
            { id: 'd4', text: 'Feeling tired or having little energy' },
            { id: 'd5', text: 'Poor appetite or overeating' },
            { id: 'd6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
            { id: 'd7', text: 'Trouble concentrating on things, such as reading or watching television' },
            { id: 'd8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless' },
            { id: 'd9', text: 'Thoughts that you would be better off dead or of hurting yourself' }
        ],
        calculateScore: (answersArr) => {
            let total = 0;
            let needsHelp = false;
            answersArr.forEach((ans, idx) => {
                total += ans;
                if (idx === 8 && ans > 0) needsHelp = true; // Q9 is index 8
            });
            let level = '';
            if (total <= 4) level = 'Minimal';
            else if (total <= 9) level = 'Mild';
            else if (total <= 14) level = 'Moderate';
            else if (total <= 19) level = 'Moderately Severe';
            else level = 'Severe';
            return { total, level, needsHelp };
        }
    },
    Anxiety: {
        instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
        options: [
            { value: 0, label: 'Not at all' },
            { value: 1, label: 'Several days' },
            { value: 2, label: 'More than half the days' },
            { value: 3, label: 'Nearly every day' }
        ],
        questions: [
            { id: 'a1', text: 'Feeling nervous, anxious, or on edge' },
            { id: 'a2', text: 'Not being able to stop or control worrying' },
            { id: 'a3', text: 'Worrying too much about different things' },
            { id: 'a4', text: 'Trouble relaxing' },
            { id: 'a5', text: 'Being so restless that it is hard to sit still' },
            { id: 'a6', text: 'Becoming easily annoyed or irritable' },
            { id: 'a7', text: 'Feeling afraid as if something awful might happen' }
        ],
        calculateScore: (answersArr) => {
            let total = answersArr.reduce((a, b) => a + b, 0);
            let level = '';
            if (total <= 4) level = 'Minimal';
            else if (total <= 9) level = 'Mild';
            else if (total <= 14) level = 'Moderate';
            else level = 'Severe';
            return { total, level, needsHelp: false };
        }
    },
    Stress: {
        instruction: 'In the last month, how often have you felt or thought the following?',
        options: [
            { value: 0, label: 'Never' },
            { value: 1, label: 'Almost Never' },
            { value: 2, label: 'Sometimes' },
            { value: 3, label: 'Fairly Often' },
            { value: 4, label: 'Very Often' }
        ],
        questions: [
            { id: 's1', text: 'Been upset because of something that happened unexpectedly' },
            { id: 's2', text: 'Felt unable to control important things in your life' },
            { id: 's3', text: 'Felt nervous and stressed' },
            { id: 's4', text: 'Felt confident about your ability to handle personal problems' },
            { id: 's5', text: 'Felt that things were going your way' },
            { id: 's6', text: 'Found that you could not cope with all the things you had to do' },
            { id: 's7', text: 'Been able to control irritations in your life' },
            { id: 's8', text: 'Felt that you were on top of things' },
            { id: 's9', text: 'Been angered because of things outside your control' },
            { id: 's10', text: 'Felt difficulties were piling up so high that you could not overcome them' }
        ],
        calculateScore: (answersArr) => {
            let total = 0;
            const reverseIndices = [3, 4, 6, 7]; // Q4, Q5, Q7, Q8
            answersArr.forEach((ans, idx) => {
                if (reverseIndices.includes(idx)) {
                    total += (4 - ans);
                } else {
                    total += ans;
                }
            });
            let level = '';
            if (total <= 13) level = 'Low';
            else if (total <= 26) level = 'Moderate';
            else level = 'High';
            return { total, level, needsHelp: false };
        }
    }
};

const Questions = () => {
    const navigate = useNavigate();

    // App state
    const [step, setStep] = useState(1);
    const [screeningAnswers, setScreeningAnswers] = useState([]);
    const [primaryIssue, setPrimaryIssue] = useState('');
    const [severityAnswersArr, setSeverityAnswersArr] = useState([]);
    const [finalResult, setFinalResult] = useState(null);

    // Shuffle only once per assessment using useMemo
    const shuffledScreeningQuestions = useMemo(() => {
        return shuffleArray(screeningQuestionsData);
    }, [step === 1 && screeningAnswers.length === 0]);

    const currentScreeningIndex = screeningAnswers.length;

    // Handle answering a screening question
    const handleScreeningAnswer = (value) => {
        const newAnswers = [...screeningAnswers, { question: shuffledScreeningQuestions[currentScreeningIndex], value }];
        setScreeningAnswers(newAnswers);

        // If completed all screening questions
        if (newAnswers.length === shuffledScreeningQuestions.length) {
            calculatePrimaryIssue(newAnswers);
        }
    };

    const calculatePrimaryIssue = (answers) => {
        let scores = { Anxiety: 0, Depression: 0, Stress: 0 };

        answers.forEach(ans => {
            scores[ans.question.category] += ans.value;
        });

        // Find highest score
        let maxScore = -1;
        let pIssue = 'Anxiety'; // default tie-breaker

        for (const [category, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                pIssue = category;
            }
        }

        setPrimaryIssue(pIssue);
        setStep("transition");
    };

    // Derived values for Severity
    const activeSeverityData = primaryIssue ? severityData[primaryIssue] : null;
    const currentSeverityIndex = severityAnswersArr.length;

    const handleSeverityAnswer = (value) => {
        const newAnswers = [...severityAnswersArr, value];
        setSeverityAnswersArr(newAnswers);

        if (newAnswers.length === activeSeverityData.questions.length) {
            const result = activeSeverityData.calculateScore(newAnswers);
            setFinalResult(result);

            const highLevels = ['Moderately Severe', 'Severe', 'High'];
            // If the user scores high or triggers the critical needsHelp flag
            if (highLevels.includes(result.level) || result.needsHelp) {
                navigate('/counseling');
            } else {
                setStep(3);
            }
        }
    };

    const resetAssessment = () => {
        setStep(1);
        setScreeningAnswers([]);
        setSeverityAnswersArr([]);
        setPrimaryIssue('');
        setFinalResult(null);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 md:p-8 relative">
            <span
                className="material-icons absolute top-6 left-6 text-3xl cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
                onClick={() => navigate('/ai-chat')}
            >
                close
            </span>

            <div className="w-full max-w-2xl bg-white/80 backdrop-blur border border-purple-100 shadow-xl rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="relative z-10">
                    {/* ====== STEP 1 ====== */}
                    {step === 1 && currentScreeningIndex < shuffledScreeningQuestions.length && (
                        <div className="animate-fadeIn">
                            <span className="text-sm font-semibold text-purple-600 tracking-wider uppercase mb-2 block">
                                Questionnaire • Part 1 ({currentScreeningIndex + 1}/{shuffledScreeningQuestions.length})
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-dark-blue900 mb-8 leading-tight">
                                Over the last 2 weeks, how often have you experienced the following?
                            </h2>
                            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 shadow-sm">
                                <p className="text-xl font-medium text-gray-800">
                                    "{shuffledScreeningQuestions[currentScreeningIndex].text}"
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {screeningOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleScreeningAnswer(opt.value)}
                                        className="w-full text-left px-6 py-4 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md transition-all text-lg text-gray-700 font-medium"
                                    >
                                        <span className="inline-block w-8 text-purple-500 font-bold">{opt.value}</span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ====== TRANSITION STEP ====== */}
                    {step === "transition" && (
                        <div className="animate-fadeIn text-center py-12">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <span className="material-icons text-4xl">check_circle</span>
                            </div>
                            <h2 className="text-3xl font-bold text-dark-blue900 mb-4">Part 1 Complete</h2>
                            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                                Thank you for taking the time to answer the screening questions. Based on your responses, we have a few more specific follow-up questions to help us better understand what you are experiencing right now in Part 2.
                            </p>
                            <button
                                onClick={() => setStep(2)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
                            >
                                Continue to Part 2
                            </button>
                        </div>
                    )}

                    {/* ====== STEP 2 ====== */}
                    {step === 2 && activeSeverityData && currentSeverityIndex < activeSeverityData.questions.length && (
                        <div className="animate-fadeIn">
                            <span className="text-sm font-semibold text-blue-600 tracking-wider uppercase mb-2 block">
                                Questionnaire • Part 2 ({currentSeverityIndex + 1}/{activeSeverityData.questions.length})
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-dark-blue900 mb-8 leading-tight">
                                {activeSeverityData.instruction}
                            </h2>
                            <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100 shadow-sm">
                                <p className="text-xl font-medium text-blue-900">
                                    "{activeSeverityData.questions[currentSeverityIndex].text}"
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeSeverityData.options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSeverityAnswer(opt.value)}
                                        className="w-full text-left px-6 py-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all text-lg text-gray-700 font-medium"
                                    >
                                        <span className="inline-block w-8 text-blue-500 font-bold">{opt.value}</span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ====== RESULT (Only shows for Low/Moderate) ====== */}
                    {step === 3 && finalResult && (
                        <div className="animate-fadeIn text-center py-8">
                            <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <span className="material-icons text-white text-5xl">health_and_safety</span>
                            </div>
                            <h2 className="text-3xl font-bold text-dark-blue900 mb-4">Assessment Complete</h2>
                            <p className="text-xl text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
                                Great news! Based on your responses, <span className="font-bold text-teal-700">Based on this screening, there are no concerns identified right now.</span>.
                            </p>

                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8 text-left">
                                <h3 className="font-bold text-gray-800 mb-2">What does this mean?</h3>
                                <p className="text-gray-600">
                                    Your mental wellbeing appears to be in a healthy state. Maintaining good habits like regular sleep, diet, and exercise will help you stay this way. If you ever want to talk, our AI agent is always ready to chat.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/ai-chat')}
                                    className="px-8 py-3 bg-dark-blue900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-md"
                                >
                                    Go to AI Chat
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-8 py-3 bg-white text-dark-blue900 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Questions;
