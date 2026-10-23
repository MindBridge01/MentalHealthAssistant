export const defaultLearnContent = [
  {
    id: "calm-breathing-reset",
    title: "A calm breathing reset for busy days",
    type: "Relaxation guide",
    topic: "Stress",
    language: "English",
    duration: "5 min",
    description:
      "A quick grounding routine you can do between meetings or before bed to settle your body and slow the pace of the day.",
    thumbnail:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    author: "MindBridge Wellbeing Studio",
    source: "MindBridge",
    publicationDate: "2026-02-11",
    reviewDate: "2026-02-25",
    isClinicallyReviewed: true,
    reviewer: "Dr. Maya Chen, Clinical Psychologist",
    externalLink: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
    contentNote: "",
    status: "Published",
    format: "Relaxation guide",
    label: "Relief exercise",
  },
  {
    id: "stress-sleep-narrative",
    title: "How stress can affect sleep, in plain English",
    type: "Gentle read",
    topic: "Sleep",
    language: "English",
    duration: "4 min",
    description:
      "A short reflection on common stress patterns and simple ways to place more rest back into the evening routine.",
    thumbnail:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    author: "Alicia R., Community contributor",
    source: "MindBridge community journal",
    publicationDate: "2026-01-13",
    reviewDate: "2026-01-20",
    isClinicallyReviewed: false,
    reviewer: "",
    externalLink: "https://www.sleepfoundation.org/",
    contentNote: "Personal experience—not medical advice.",
    status: "Published",
    format: "Gentle read",
    label: "Reflection",
  },
  {
    id: "grounding-steps-podcast",
    title: "Grounding steps when your thoughts are racing",
    type: "Podcast",
    topic: "Anxiety",
    language: "English",
    duration: "12 min",
    description:
      "A gentle conversation about noticing early signs of overwhelm and returning to the present moment with sensory cues.",
    thumbnail:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
    author: "Dr. Priya Nair",
    source: "MindBridge Podcast",
    publicationDate: "2026-03-02",
    reviewDate: "2026-03-07",
    isClinicallyReviewed: true,
    reviewer: "Dr. Priya Nair, Therapist",
    externalLink: "https://www.youtube.com/watch?v=Kxg9QjM9JQ8",
    contentNote: "",
    status: "Published",
    format: "Podcast",
    label: "Audio",
  },
  {
    id: "what-is-cortisol",
    title: "What is cortisol, and why does stress feel physical?",
    type: "Research explained",
    topic: "Stress",
    language: "English",
    duration: "8 min",
    description:
      "A short, clear explanation of the stress-response system and why tension can appear in the body before it is noticed in the mind.",
    thumbnail:
      "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=900&q=80",
    author: "Research team, MindBridge Health",
    source: "National Institute of Mental Health",
    publicationDate: "2026-01-09",
    reviewDate: "2026-01-17",
    isClinicallyReviewed: true,
    reviewer: "Dr. Leanne Morris, Clinical Lead",
    externalLink: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
    contentNote: "",
    status: "Published",
    format: "Research explained",
    label: "Research",
  },
  {
    id: "mindful-3-minute-guide",
    title: "A 3-minute mindful reset for tense moments",
    type: "Expert talk",
    topic: "Mindfulness",
    language: "English",
    duration: "3 min",
    description:
      "A concise expert-led practice to help you slow down your breathing and notice what is happening in your body without judgment.",
    thumbnail:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
    author: "Dr. Hannah Lake",
    source: "Mindfulness for Everyday Life",
    publicationDate: "2026-02-18",
    reviewDate: "2026-02-24",
    isClinicallyReviewed: true,
    reviewer: "Dr. Hannah Lake, Consultant Therapist",
    externalLink: "https://www.youtube.com/watch?v=ZToicYcHIOU",
    contentNote: "",
    status: "Published",
    format: "Expert talk",
    label: "Video",
  },
];

export function readLearnContent() {
  try {
    const stored = localStorage.getItem("mindbridge-learn-content");
    if (!stored) return defaultLearnContent;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultLearnContent;
  } catch {
    return defaultLearnContent;
  }
}

export function writeLearnContent(items) {
  localStorage.setItem("mindbridge-learn-content", JSON.stringify(items));
}

export const defaultLearnSubmissions = [
  {
    id: "sub-001",
    submitter: "Amina N.",
    submissionType: "Personal reflection",
    title: "I found comfort in a 10-minute sunset walk",
    link: "https://example.com/reflective-walk",
    explanation: "This reflection helped me reconnect after a very tense week.",
    displayPreference: "Community contributor",
    status: "Pending review",
    date: "2026-02-10",
    reviewHistory: "Submitted for moderation.",
  },
  {
    id: "sub-002",
    submitter: "Dr. Samir H.",
    submissionType: "Expert talk",
    title: "Stress and body signs: what to notice early",
    link: "https://example.com/stress-body-signs",
    explanation: "Short professional overview for patients looking for practical, non-diagnostic guidance.",
    displayPreference: "Name",
    status: "Review",
    date: "2026-02-14",
    reviewHistory: "Admin requested a clearer source attribution.",
  },
];

export function readLearnSubmissions() {
  try {
    const stored = localStorage.getItem("mindbridge-learn-submissions");
    if (!stored) return defaultLearnSubmissions;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultLearnSubmissions;
  } catch {
    return defaultLearnSubmissions;
  }
}

export function writeLearnSubmissions(items) {
  localStorage.setItem("mindbridge-learn-submissions", JSON.stringify(items));
}
