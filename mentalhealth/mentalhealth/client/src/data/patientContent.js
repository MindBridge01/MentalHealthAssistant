export const assessmentQuestions = [
  {
    id: "stress-frequency",
    prompt: "Over the last two weeks, how often have you felt emotionally stretched or overwhelmed?",
  },
  {
    id: "sleep-quality",
    prompt: "How often has sleep felt difficult or less restorative than usual?",
  },
  {
    id: "interest-level",
    prompt: "How often have everyday activities felt harder to start or enjoy?",
  },
  {
    id: "support-level",
    prompt: "How often have you felt alone with what you're carrying?",
  },
  {
    id: "focus-level",
    prompt: "How often has it been hard to focus on study, work, or regular tasks?",
  },
  {
    id: "calm-access",
    prompt: "How often have you struggled to return to a calm baseline after stress?",
  },
];

export const assessmentOptions = [
  { label: "Not at all", value: 0, description: "This has felt mostly manageable." },
  { label: "A few days", value: 1, description: "It shows up sometimes." },
  { label: "More than half the days", value: 2, description: "It has been affecting me often." },
  { label: "Nearly every day", value: 3, description: "It has felt constant lately." },
];

export const quickActions = [
  {
    title: "Talk to a doctor",
    description: "Browse trusted professionals and book time when you are ready.",
    href: "/patient/doctors",
  },
  {
    title: "Try a breathing exercise",
    description: "A short calming exercise can help while you wait for support.",
    href: "/patient/activities/breathing-reset",
  },
];

export const dashboardFeatures = [
  {
    title: "AI Chat",
    description: "Reflect with supportive prompts and grounded responses.",
    href: "/patient/chat",
    accent: "from-emerald-200 via-teal-100 to-white",
  },
  {
    title: "Take Assessment",
    description: "A short check-in to guide your next best step.",
    href: "/patient/assessments",
    accent: "from-sky-200 via-cyan-100 to-white",
  },
  {
    title: "Explore Activities",
    description: "Breathing, grounding, and gentle reflection tools.",
    href: "/patient/activities",
    accent: "from-amber-100 via-orange-50 to-white",
  },
  {
    title: "Community",
    description: "See encouraging posts and share what is helping you.",
    href: "/patient/community",
    accent: "from-rose-100 via-pink-50 to-white",
  },
  {
    title: "Find a Doctor",
    description: "Browse specialists and choose a time that feels right.",
    href: "/patient/doctors",
    accent: "from-violet-100 via-indigo-50 to-white",
  },
  {
    title: "SOS / Emergency",
    description: "Quickly alert your emergency contact when you need immediate support.",
    href: "/patient/dashboard#sos",
    accent: "from-red-100 via-orange-50 to-white",
  },
];
