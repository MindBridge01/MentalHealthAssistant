import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/apiClient';

const DoctorSignupWizard = () => {
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    nameWithInitials: '',
    dateOfBirth: '',
    gender: '',
    nicPassport: '',
    profilePhoto: null,
    email: '',
    mobileNumber: '',
    residentialAddress: '',
    
    // Step 2
    slmcNumber: '',
    doctorType: '',
    specialization: '',
    yearsOfExperience: '',
    medicalDegree: '',
    university: '',
    yearGraduated: '',
    currentHospital: '',
    designation: '',

    // Step 3
    primarySpecialization: '',
    areasOfExpertise: [],

    // Step 4
    registrationType: '',
    docRegistrationCert: null,
    docSlmcId: null,
    docMedicalDegree: null,
    docPostgrad: null,
    docSpecialist: null,
    docOther: null
  });

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newAreas = checked 
        ? [...prev.areasOfExpertise, value]
        : prev.areasOfExpertise.filter(area => area !== value);
      return { ...prev, areasOfExpertise: newAreas };
    });
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const fileKeys = ['docRegistrationCert', 'docSlmcId', 'docMedicalDegree', 'docPostgrad', 'docSpecialist', 'docOther'];
      const uploadedUrls = {};
      
      for (const key of fileKeys) {
        if (formData[key] instanceof File) {
          const uploadData = new FormData();
          uploadData.append('image', formData[key]);
          
          const uploadRes = await fetch('/api/upload', {
             method: 'POST',
             body: uploadData
          });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            uploadedUrls[key] = uploadJson.imagePath;
          }
        }
      }

      const body = {
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: "PENDING_APPROVAL_123!", 
        ...formData,
        ...uploadedUrls
      };

      const user = await apiRequest("/api/auth/signup-doctor", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setUser(user);
      await refreshUser();
      setApplicationSubmitted(true);
    } catch (err) {
      if (err.status === 409) {
        setError("User already exists with this email.");
      } else {
        setError(err.message || "Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToPDF = () => {
    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('MindBridge Application Summary', 40, 60);
      
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.line(40, 75, 555, 75);

      pdf.setFontSize(14);
      pdf.setTextColor(51, 65, 85); // slate-700
      pdf.text('Personal & Contact Information', 40, 105);
      
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139); // slate-500
      let y = 130;
      
      const addLine = (label, value) => {
        pdf.setFont(undefined, 'bold');
        pdf.text(`${label}:`, 40, y);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${value || 'N/A'}`, 160, y);
        y += 20;
      };
      
      addLine('Full Name', formData.fullName);
      addLine('Email', formData.email);
      addLine('NIC/Passport', formData.nicPassport);
      addLine('Mobile', formData.mobileNumber);
      addLine('Date of Birth', formData.dateOfBirth);
      addLine('Gender', formData.gender);
      
      y += 15;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(51, 65, 85);
      pdf.text('Professional Information', 40, y);
      
      y += 25;
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      addLine('SLMC Number', formData.slmcNumber);
      addLine('Doctor Type', formData.doctorType);
      addLine('Specialization', formData.primarySpecialization || formData.specialization);
      addLine('Experience', formData.yearsOfExperience ? `${formData.yearsOfExperience} years` : 'N/A');
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Areas of Expertise:', 40, y);
      pdf.setFont(undefined, 'normal');
      pdf.text(formData.areasOfExpertise.length > 0 ? formData.areasOfExpertise.join(', ') : 'None selected', 160, y);
      y += 30;

      y += 10;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(51, 65, 85);
      pdf.text('Attached Documents', 40, y);
      
      y += 25;
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      
      const docs = [
        { label: 'Registration Cert', file: formData.docRegistrationCert },
        { label: 'SLMC ID', file: formData.docSlmcId },
        { label: 'Medical Degree', file: formData.docMedicalDegree },
        { label: 'Postgraduate', file: formData.docPostgrad },
        { label: 'Specialist Cert', file: formData.docSpecialist },
        { label: 'Other', file: formData.docOther }
      ];
      
      let hasDocs = false;
      docs.forEach(doc => {
        if (doc.file) {
          addLine(doc.label, doc.file.name);
          hasDocs = true;
        }
      });
      
      if (!hasDocs) {
        pdf.setFont(undefined, 'normal');
        pdf.text('No documents attached.', 40, y);
        y += 20;
      }

      y += 30;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text('This document serves as the formal application for joining the MindBridge platform.', 40, y);

      pdf.save('Doctor_Application_MindBridge.pdf');
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try submitting your application directly.");
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Full Name *</label>
        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" placeholder="e.g. Dr. Jane Doe" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Name with Initials *</label>
          <input type="text" name="nameWithInitials" value={formData.nameWithInitials} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Date of Birth *</label>
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#475569]" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Gender *</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#475569] appearance-none cursor-pointer">
            <option value="" disabled>Select ▼</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">NIC / Passport Number *</label>
          <input type="text" name="nicPassport" value={formData.nicPassport} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Email Address *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Mobile Number *</label>
          <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Residential Address *</label>
          <textarea name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" rows="2"></textarea>
        </div>
      </div>
      <div className="pt-6">
        <button type="button" onClick={nextStep} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium py-3.5 rounded-xl transition-colors text-[15px]">
          Next
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Doctor Type *</label>
          <select name="doctorType" value={formData.doctorType} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#475569] appearance-none cursor-pointer">
            <option value="" disabled>Select ▼</option>
            <option value="General Practitioner">General Practitioner</option>
            <option value="Consultant">Consultant</option>
            <option value="Specialist">Specialist</option>
            <option value="Therapist">Therapist</option>
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Years of Experience *</label>
          <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Medical Degree *</label>
          <input type="text" name="medicalDegree" value={formData.medicalDegree} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" placeholder="MBBS" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">University *</label>
          <input type="text" name="university" value={formData.university} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Current Hospital / Institution</label>
          <input type="text" name="currentHospital" value={formData.currentHospital} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" />
        </div>
      </div>
      <div className="flex gap-4 pt-6">
        <button type="button" onClick={prevStep} className="w-1/3 py-3.5 rounded-xl text-[#334155] bg-[#f1f5f9] hover:bg-[#e2e8f0] font-medium transition-colors text-[15px]">
          Back
        </button>
        <button type="button" onClick={nextStep} className="w-2/3 py-3.5 rounded-xl text-white bg-[#0f172a] hover:bg-[#1e293b] font-medium transition-colors text-[15px]">
          Next
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const primaryOptions = [
      "Psychiatry", "Clinical Psychology", "Counseling Psychology", 
      "Child & Adolescent Psychiatry", "Addiction Psychiatry", "Other"
    ];
    
    const expertiseOptions = [
      "Anxiety", "Depression", "Stress Management", "Relationship Issues",
      "Trauma", "Addiction", "Child & Adolescent Mental Health",
      "Sleep Problems", "Eating Disorders", "OCD", "PTSD", "Other"
    ];

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-3">Primary Specialization *</label>
          <div className="space-y-2">
            {primaryOptions.map(opt => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="primarySpecialization" 
                  value={opt} 
                  checked={formData.primarySpecialization === opt}
                  onChange={handleChange}
                  className="w-4 h-4 text-sky-500 border-[#cbd5e1] focus:ring-sky-500"
                />
                <span className="text-[#475569] text-[14px]">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#334155] mb-3">Areas of Expertise (Select all that apply) *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expertiseOptions.map(opt => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  value={opt}
                  checked={formData.areasOfExpertise.includes(opt)}
                  onChange={handleCheckboxChange}
                  className="w-[18px] h-[18px] border-2 border-[#cbd5e1] rounded-[4px] text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-[#475569] text-[14px]">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={prevStep} className="w-1/3 py-3.5 rounded-xl text-[#334155] bg-[#f1f5f9] hover:bg-[#e2e8f0] font-medium transition-colors text-[15px]">
            Back
          </button>
          <button type="button" onClick={nextStep} className="w-2/3 py-3.5 rounded-xl text-white bg-[#0f172a] hover:bg-[#1e293b] font-medium transition-colors text-[15px]">
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="space-y-5">
        <p className="text-[14px] text-[#64748b] mb-4">Please complete your registration details and upload relevant documents.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-[#334155] mb-1.5">SLMC Registration Number *</label>
            <input type="text" name="slmcNumber" value={formData.slmcNumber} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors" required />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Registration Type *</label>
            <select name="registrationType" value={formData.registrationType} onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors text-[#475569] appearance-none cursor-pointer" required>
              <option value="" disabled>Select ▼</option>
              <option value="Medical Doctor">Medical Doctor</option>
              <option value="Counselor">Counselor</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Registration Certificate</label>
            <input type="file" name="docRegistrationCert" onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" accept=".pdf" />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#334155] mb-1.5">SLMC ID / Supporting Document</label>
            <input type="file" name="docSlmcId" onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" accept=".pdf" />
          </div>
          
          <div className="pt-2">
            <h3 className="text-[14px] font-bold text-[#334155] mb-3">Qualification Documents</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Medical Degree</label>
                <input type="file" name="docMedicalDegree" onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" accept=".pdf" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Postgraduate Qualification</label>
                <input type="file" name="docPostgrad" onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" accept=".pdf" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Specialist Certificate</label>
                <input type="file" name="docSpecialist" onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" accept=".pdf" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#334155] mb-1.5">Other Qualification</label>
                <input type="file" name="docOther" onChange={handleChange} className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" accept=".pdf" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={prevStep} className="w-1/3 py-3.5 rounded-xl text-[#334155] bg-[#f1f5f9] hover:bg-[#e2e8f0] font-medium transition-colors text-[15px]">
            Back
          </button>
          <button type="button" onClick={nextStep} className="w-2/3 py-3.5 rounded-xl text-white bg-[#0f172a] hover:bg-[#1e293b] font-medium transition-colors text-[15px]">
            Review Application
          </button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const handleDownload = (e, file) => {
      e.preventDefault();
      e.stopPropagation();
      if (!file) return;
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      // Revoke after a minute to ensure the new tab has time to load the blob
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };

    return (
      <div className="space-y-6">
        <div id="application-summary" className="p-6 border border-slate-200 rounded-xl bg-slate-50 space-y-4 text-left">
          <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Application Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
             <div><strong className="text-slate-800">Full Name:</strong> {formData.fullName}</div>
             <div><strong className="text-slate-800">Email:</strong> {formData.email}</div>
             <div><strong className="text-slate-800">NIC/Passport:</strong> {formData.nicPassport}</div>
             <div><strong className="text-slate-800">Mobile:</strong> {formData.mobileNumber}</div>
             <div><strong className="text-slate-800">SLMC Number:</strong> {formData.slmcNumber}</div>
             <div><strong className="text-slate-800">Doctor Type:</strong> {formData.doctorType}</div>
             <div><strong className="text-slate-800">Specialization:</strong> {formData.primarySpecialization || formData.specialization || 'N/A'}</div>
             <div><strong className="text-slate-800">Experience:</strong> {formData.yearsOfExperience} years</div>
          </div>
          
          <div className="text-sm text-slate-600 mt-2">
             <strong className="text-slate-800 block mb-1">Areas of Expertise:</strong>
             {formData.areasOfExpertise.length > 0 ? formData.areasOfExpertise.join(', ') : 'None selected'}
          </div>

          <div className="text-sm text-slate-600 mt-2">
             <strong className="text-slate-800 block mb-1">Attached Documents:</strong>
             <ul className="list-disc pl-5 space-y-1">
               {formData.docRegistrationCert && <li>Registration Certificate: <a href="#" onClick={(e) => handleDownload(e, formData.docRegistrationCert)} className="text-sky-600 hover:underline font-medium">{formData.docRegistrationCert.name}</a></li>}
               {formData.docSlmcId && <li>SLMC ID: <a href="#" onClick={(e) => handleDownload(e, formData.docSlmcId)} className="text-sky-600 hover:underline font-medium">{formData.docSlmcId.name}</a></li>}
               {formData.docMedicalDegree && <li>Medical Degree: <a href="#" onClick={(e) => handleDownload(e, formData.docMedicalDegree)} className="text-sky-600 hover:underline font-medium">{formData.docMedicalDegree.name}</a></li>}
               {formData.docPostgrad && <li>Postgraduate: <a href="#" onClick={(e) => handleDownload(e, formData.docPostgrad)} className="text-sky-600 hover:underline font-medium">{formData.docPostgrad.name}</a></li>}
               {formData.docSpecialist && <li>Specialist Cert: <a href="#" onClick={(e) => handleDownload(e, formData.docSpecialist)} className="text-sky-600 hover:underline font-medium">{formData.docSpecialist.name}</a></li>}
               {formData.docOther && <li>Other: <a href="#" onClick={(e) => handleDownload(e, formData.docOther)} className="text-sky-600 hover:underline font-medium">{formData.docOther.name}</a></li>}
               {!formData.docRegistrationCert && !formData.docSlmcId && !formData.docMedicalDegree && !formData.docPostgrad && !formData.docSpecialist && !formData.docOther && <li>None attached</li>}
             </ul>
          </div>
          
          <p className="text-xs text-slate-500 mt-6 italic text-center">
             This document serves as the formal application for joining the MindBridge platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="button" onClick={exportToPDF} className="w-full py-3.5 rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 font-semibold transition-colors text-[15px] flex items-center justify-center gap-2 border border-sky-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Download PDF
          </button>
        </div>
        
        <div className="flex gap-4 pt-2">
          <button type="button" onClick={prevStep} className="w-1/3 py-3.5 rounded-xl text-[#334155] bg-[#f1f5f9] hover:bg-[#e2e8f0] font-medium transition-colors text-[15px]">
            Back
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-2/3 py-3.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-semibold transition-colors text-[15px] disabled:opacity-50">
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    );
  };

  const progressPercentage = (step / 5) * 100;

  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-[28px] font-bold text-[#0f172a] mb-3">Application Submitted!</h2>
          <p className="text-[#64748b] text-[15px] mb-8 max-w-sm mx-auto">
            Your application and attached documents have been submitted successfully. Our verification team will review your credentials and grant you access shortly.
          </p>
          <button type="button" onClick={() => navigate("/")} className="px-8 py-3.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium rounded-xl transition-colors text-[15px]">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden p-8 md:p-12">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div className="h-full bg-[#0ea5e9] transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>

        {/* Close Button */}
        <button 
          type="button"
          onClick={() => navigate('/login/patient')}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Return to Login"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="text-center mb-8 mt-2">
          <h2 className="text-[28px] font-bold text-[#0f172a]">Create Your Account</h2>
          <p className="text-[#64748b] mt-1 text-[15px]">Join MindBridge to start your mental health journey</p>
        </div>

        <div className="flex bg-[#f1f5f9] p-1 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => navigate('/signup/patient')}
            className="flex-1 py-2 rounded-lg text-[#64748b] hover:text-[#0f172a] font-medium transition-colors text-[15px]"
          >
            Patient
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-lg bg-white text-[#0f172a] font-semibold shadow-sm text-[15px]"
          >
            Doctor
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-100">{success}</div>}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

        <p className="text-center text-[14px] text-[#64748b] mt-8">
          Already have an account? <a href="/login" className="text-[#334155] font-bold hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default DoctorSignupWizard;

