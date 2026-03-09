import React from "react";
import { useParams, useNavigate } from "react-router-dom";

const PatientProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-purple-50 p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-8 relative">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 text-gray-500 hover:text-purple-600 font-medium text-sm flex items-center gap-1 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>

                <h2 className="text-3xl font-bold text-dark-blue900 text-center mb-8 border-b pb-4 mt-6">Patient Profile</h2>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center border-4 border-purple-200 shrink-0">
                        <svg className="w-16 h-16 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div>
                            <label className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Patient ID</label>
                            <div className="text-lg text-gray-800 font-medium py-1">{id}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <label className="text-xs text-purple-600 font-bold uppercase tracking-wider block mb-1">Status</label>
                                <div className="text-gray-800 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active Patient
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <label className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-1">Upcoming Appointments</label>
                                <div className="text-gray-800 font-medium">To be updated</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-gray-400 text-sm italic">
                            Additional patient medical records, history, and notes will be integrated securely here.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
