import { useEffect, useRef, useState } from 'react';

export default function BreathingActivity() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    const started = performance.now() - elapsedRef.current;
    const timer = window.setInterval(() => {
      const next = Math.min(60000, performance.now() - started);
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= 60000) setRunning(false);
    }, 100);
    return () => window.clearInterval(timer);
  }, [running]);
  const reset = () => { setRunning(false); elapsedRef.current = 0; setElapsed(0); };
  const start = () => { if (elapsed >= 60000) { elapsedRef.current = 0; setElapsed(0); } setRunning(true); };
  const remaining = Math.ceil((60000 - elapsed) / 1000);
  return <section id="breathing" className="landing-breathing landing-section" aria-labelledby="landing-breathing-title">
    <p className="landing-section-label">03 / TRY A SELF-GUIDED ACTIVITY</p>
    <div className="landing-section-heading"><h2 id="landing-breathing-title">Take a one-minute pause.</h2><p>A simple timer to make room for gentle, comfortable breathing.</p></div>
    <div className="landing-breathing-layout">
      <div className="landing-breathing-timer"><div className="landing-timer-ring" style={{ "--timer-progress": `${elapsed / 60000 * 360}deg` }} role="progressbar" aria-label="One-minute breathing timer" aria-valuemin={0} aria-valuemax={60} aria-valuenow={Math.floor(elapsed / 1000)}><span>{remaining}<small>seconds remaining</small></span></div><div className="landing-timer-controls"><button type="button" onClick={running ? () => setRunning(false) : start}>{running ? 'Pause timer' : elapsed >= 60000 ? 'Start again' : elapsed > 0 ? 'Resume timer' : 'Start timer'}</button><button type="button" onClick={reset} disabled={elapsed === 0 && !running}>Reset</button></div><p role="status" hidden={elapsed === 0 && !running}>{elapsed >= 60000 ? 'Your one-minute pause is complete.' : running ? 'Timer running. Breathe at your own pace.' : elapsed > 0 ? 'Timer paused.' : ''}</p></div>
      <div className="landing-breathing-instructions"><h3>Keep it comfortable.</h3><ol><li>Find a comfortable position and let your shoulders relax.</li><li>Breathe gently, without forcing a deep breath or holding it.</li><li>Let your breath flow out comfortably, and continue at your own pace.</li></ol><p>This timer is a short introduction, not a treatment or the full NHS exercise. Stop if you feel uncomfortable.</p><a className="landing-text-link" href="https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" target="_blank" rel="noopener noreferrer">Read the full NHS breathing guidance <span aria-hidden="true">↗</span></a></div>
    </div>
  </section>;
}
