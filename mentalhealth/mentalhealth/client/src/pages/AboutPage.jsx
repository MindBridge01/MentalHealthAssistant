import React, { useState, useEffect } from "react";
import HeroNavbar from "../components/HeroNavbar/HeroNavbar";
import heroVideo from "../assets/videos/heroVideo.mp4";

const SecurityFeature = ({ title, description, icon }) => (
  <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-300 hover:bg-white/10">
    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
      {icon}
    </div>
    <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
    <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
  </div>
);

const AboutPage = () => {
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealing(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section - Matching HeroSec Style */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1593px] flex-col px-4 sm:px-6 lg:px-[25px]">
          <div className={`transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${isRevealing ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'}`}>
            <HeroNavbar theme="light" />
          </div>

          <div className="flex flex-1 items-center justify-center text-center">
            <div className={`max-w-4xl transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] delay-500 ${isRevealing ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">Our Story</span>
              <h1 className="mb-6 font-display text-6xl font-thin leading-tight tracking-tight text-white sm:text-7xl lg:text-8xl" style={{ fontFamily: '"Editor\'s Note"' }}>
                Bridging the Gap in <br /> Mental Wellness
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-gray-300 sm:text-xl">
                We believe that quality mental health support should be accessible, private, and tailored to every individual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-light text-white sm:text-5xl">Our Mission</h2>
              <div className="space-y-6 text-lg text-gray-400">
                <p>
                  MindBridge was born from a simple yet powerful idea: that technology can be used to create a more empathetic world. We combine advanced AI with human professional care to ensure nobody has to face their mental health journey alone.
                </p>
                <p>
                  Our platform provides a safe space for expression, immediate support through AI companionship, and a direct bridge to professional help when you need it most.
                </p>
              </div>
              <div className="flex gap-12 pt-4">
                <div>
                  <div className="text-4xl font-light text-blue-400">10k+</div>
                  <div className="mt-1 text-sm text-gray-500 uppercase tracking-widest">Active Users</div>
                </div>
                <div>
                  <div className="text-4xl font-light text-blue-400">500+</div>
                  <div className="mt-1 text-sm text-gray-500 uppercase tracking-widest">Certified Doctors</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl" />
              <div className="relative rounded-[40px] border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
                <div className="overflow-hidden rounded-[32px]">
                   {/* Placeholder for an about us image or just a cool abstract element */}
                   <div className="bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex items-center justify-center">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-700">
                        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                        <path d="M12 7v10M7 12h10" />
                      </svg>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Protocol Section - THE COOL ONE */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-[#050505]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light text-white mb-6 sm:text-5xl">Fort-Knox Level Security</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Your mental health is personal. We treat it with the highest standards of data protection and privacy in the industry.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <SecurityFeature 
              title="AES-256-GCM Encryption"
              description="Your data is encrypted at rest using military-grade standards. Even we can't read your clinical notes."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
            <SecurityFeature 
              title="PHI Data Masking"
              description="Our AI engine automatically masks Personally Identifiable Information before processing any request."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
            <SecurityFeature 
              title="Zero-Knowledge Logging"
              description="Audit logs are sanitized at the entry point. We track actions, not your sensitive conversations."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l2.223-2.223m-2.223 2.223L13 10l-2.5-2.5" />
                </svg>
              }
            />
            <SecurityFeature 
              title="Role-Based Access (RBAC)"
              description="Strict permissions ensure only you and your authorized medical professional can access your history."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <SecurityFeature 
              title="Crisis Detection AI"
              description="Real-time monitoring for emergency patterns with automated immediate redirection to SOS resources."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              }
            />
            <SecurityFeature 
              title="Local AI Processing"
              description="Powered by Ollama, our AI can run locally on our infrastructure, ensuring data never leaves our secure perimeter."
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Decorative elements for 'cool' feel */}
        <div className="pointer-events-none absolute top-1/2 left-0 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </section>

      {/* Final CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-light text-white mb-8 sm:text-4xl">Ready to start your journey?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/signup/patient" className="rounded-full bg-white px-10 py-4 text-sm font-semibold text-black transition hover:bg-gray-200">
              Join MindBridge
            </a>
            <a href="/ai-chat" className="rounded-full border border-white/20 bg-white/5 px-10 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
              Try AI Chat
            </a>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm">
        <p>&copy; 2026 MindBridge Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
