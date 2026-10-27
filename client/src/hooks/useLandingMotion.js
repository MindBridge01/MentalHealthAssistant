import { useEffect } from 'react';

// Landing-only entrances and scroll-linked photography; native scrolling stays intact.
export default function useLandingMotion(rootRef, enabled = true) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (!enabled || preference.matches) return;
      const animations = new Map();
      const ease = 'cubic-bezier(.16, 1, .3, 1)';
      const animate = (element, frames, options = {}) => {
        const animation = element.animate(frames, { duration: 1150, easing: ease, fill: 'backwards', ...options });
        animations.set(element, animation);
        animation.finished.then(() => { if (animations.get(element) === animation) animations.delete(element); }, () => {});
      };
      root.classList.add('landing-motion-active');
      root.querySelectorAll('.landing-title-line > span').forEach((element, index) => {
        animate(element, [{ transform: 'translateY(115%) rotate(2deg)' }, { transform: 'translateY(0) rotate(0deg)' }], { duration: 1450, delay: 140 + index * 190 });
      });
      root.querySelectorAll('.landing-hero-content > :is(.landing-eyebrow, .landing-hero-description, .landing-actions, .landing-hero-facts)').forEach((element, index) => {
        animate(element, [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1000, delay: 180 + index * 150 });
      });
      const emblem = root.querySelector('.landing-hero-emblem');
      if (emblem) animate(emblem, [{ opacity: 0, transform: 'rotate(-100deg) scale(.65)' }, { opacity: 1, transform: 'rotate(0) scale(1)' }], { duration: 1500 });
      const selector = '.landing-hero-photo, .landing-how-photo, .landing-section-heading > h2, .landing-section-heading > p, .landing-option-card, .landing-step, .landing-privacy-grid article, .landing-approach-card, .landing-faq-item, .landing-scope-note';
      const targets = [...root.querySelectorAll(selector)];
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          observer.unobserve(element);
          element.classList.remove('landing-reveal-pending');
          const photo = element.matches('.landing-hero-photo, .landing-how-photo');
          const group = element.closest('.landing-support-grid, .landing-step-grid, .landing-privacy-grid, .landing-approach-grid, .landing-hero-gallery');
          const groupTargets = group ? [...group.querySelectorAll(selector)] : [];
          const delay = group ? Math.min(Math.max(0, groupTargets.indexOf(element)) * 140, 280) : element.tagName === 'P' ? 130 : 0;
          animate(element, photo ? [
            { opacity: .25, clipPath: 'inset(18% 8% 0 8%)', transform: 'translateY(65px)' },
            { opacity: 1, clipPath: 'inset(0)', transform: 'translateY(0)' },
          ] : [
            { opacity: 0, transform: 'translateY(55px)', clipPath: 'inset(0 0 16% 0)' },
            { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' },
          ], { duration: photo ? 1450 : 1100, delay });
        });
      }, { threshold: .12, rootMargin: '0px 0px -35px 0px' });
      targets.forEach(element => { element.classList.add('landing-reveal-pending'); observer.observe(element); });
      // Only visible photographs participate, and only scroll/resize schedules a frame.
      const photographs = [...root.querySelectorAll('.landing-hero-photo, .landing-how-photo, .landing-option-image')];
      const visible = new Set();
      let frame = 0;
      const update = () => {
        frame = 0;
        const viewport = window.innerHeight;
        visible.forEach(element => {
          const rect = element.getBoundingClientRect();
          const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewport / 2) / viewport));
          element.style.setProperty('--landing-parallax-y', `${progress * -28}px`);
        });
      };
      const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
      const photoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
        schedule();
      }, { rootMargin: '100px' });
      photographs.forEach(element => { element.classList.add('landing-parallax-photo'); photoObserver.observe(element); });
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      const revealFocused = event => {
        const element = event.target.closest(selector);
        if (!element) return;
        element.classList.remove('landing-reveal-pending');
        animations.get(element)?.cancel();
        observer.unobserve(element);
      };
      root.addEventListener('focusin', revealFocused);
      dispose = () => {
        observer.disconnect(); photoObserver.disconnect();
        window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
        window.cancelAnimationFrame(frame);
        root.removeEventListener('focusin', revealFocused);
        animations.forEach(animation => animation.cancel());
        targets.forEach(element => element.classList.remove('landing-reveal-pending'));
        photographs.forEach(element => { element.classList.remove('landing-parallax-photo'); element.style.removeProperty('--landing-parallax-y'); });
        root.classList.remove('landing-motion-active');
      };
    };
    setup(); preference.addEventListener('change', setup);
    return () => { dispose(); preference.removeEventListener('change', setup); };
  }, [rootRef, enabled]);
}
