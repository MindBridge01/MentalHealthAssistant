export const screeningQuestionsData = [
  { id: 1, category: 'Anxiety', text: 'I feel nervous, anxious, or on edge.' },
  { id: 2, category: 'Anxiety', text: 'I cannot stop or control worrying.' },
  { id: 3, category: 'Anxiety', text: 'I worry too much about different things.' },
  { id: 5, category: 'Depression', text: 'I feel sad, empty, or hopeless.' },
  { id: 6, category: 'Depression', text: 'I have little interest or pleasure in doing things.' },
  { id: 7, category: 'Depression', text: 'I feel tired or have little energy.' },
  { id: 9, category: 'Stress', text: 'I feel overwhelmed by responsibilities.' },
  { id: 10, category: 'Stress', text: 'I feel unable to control important things in my life.' },
  { id: 11, category: 'Stress', text: 'I feel irritated or easily angered.' },
];

export const screeningOptions = [
  { value: 0, label: 'Not at all', description: 'This has felt mostly manageable.' },
  { value: 1, label: 'Several days', description: 'It shows up sometimes.' },
  { value: 2, label: 'More than half the days', description: 'It has been affecting me often.' },
  { value: 3, label: 'Nearly every day', description: 'It has felt constant lately.' },
];

export const severityData = {
  Depression: {
      instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
      options: [
          { value: 0, label: 'Not at all', description: 'Rarely happens' },
          { value: 1, label: 'Several days', description: 'Occasional' },
          { value: 2, label: 'More than half the days', description: 'Frequent' },
          { value: 3, label: 'Nearly every day', description: 'Constant' }
      ],
      questions: [
          { id: 'd1', text: 'Little interest or pleasure in doing things' },
          { id: 'd2', text: 'Feeling down, depressed, or hopeless' },
          { id: 'd3', text: 'Trouble falling or staying asleep, or sleeping too much' },
          { id: 'd4', text: 'Feeling tired or having little energy' },
          { id: 'd6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
          { id: 'd9', text: 'Thoughts that you would be better off dead or of hurting yourself' }
      ],
      calculateScore: (answersArr) => {
          let total = 0;
          let needsHelp = false;
          answersArr.forEach((ans, idx) => {
              total += ans.score;
              // Thoughts of hurting yourself is now at index 5
              if (idx === 5 && ans.score > 0) needsHelp = true;
          });
          let level = '';
          if (total <= 3) level = 'Minimal';
          else if (total <= 6) level = 'Mild';
          else if (total <= 10) level = 'Moderate';
          else if (total <= 14) level = 'Moderately Severe';
          else level = 'Severe';
          return { total, level, needsHelp };
      }
  },
  Anxiety: {
      instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
      options: [
          { value: 0, label: 'Not at all', description: 'Rarely happens' },
          { value: 1, label: 'Several days', description: 'Occasional' },
          { value: 2, label: 'More than half the days', description: 'Frequent' },
          { value: 3, label: 'Nearly every day', description: 'Constant' }
      ],
      questions: [
          { id: 'a1', text: 'Feeling nervous, anxious, or on edge' },
          { id: 'a2', text: 'Not being able to stop or control worrying' },
          { id: 'a3', text: 'Worrying too much about different things' },
          { id: 'a4', text: 'Trouble relaxing' },
          { id: 'a5', text: 'Being so restless that it is hard to sit still' },
          { id: 'a7', text: 'Feeling afraid as if something awful might happen' }
      ],
      calculateScore: (answersArr) => {
          let total = answersArr.reduce((a, b) => a + b.score, 0);
          let level = '';
          if (total <= 3) level = 'Minimal';
          else if (total <= 6) level = 'Mild';
          else if (total <= 10) level = 'Moderate';
          else level = 'Severe';
          return { total, level, needsHelp: false };
      }
  },
  Stress: {
      instruction: 'In the last month, how often have you felt or thought the following?',
      options: [
          { value: 0, label: 'Never', description: 'Rarely happens' },
          { value: 1, label: 'Almost Never', description: 'Occasional' },
          { value: 2, label: 'Sometimes', description: 'Frequent' },
          { value: 3, label: 'Fairly Often', description: 'Very frequent' },
          { value: 4, label: 'Very Often', description: 'Constant' }
      ],
      questions: [
          { id: 's1', text: 'Been upset because of something that happened unexpectedly' },
          { id: 's2', text: 'Felt unable to control important things in your life' },
          { id: 's3', text: 'Felt nervous and stressed' },
          { id: 's4', text: 'Felt confident about your ability to handle personal problems' },
          { id: 's6', text: 'Found that you could not cope with all the things you had to do' },
          { id: 's10', text: 'Felt difficulties were piling up so high that you could not overcome them' }
      ],
      calculateScore: (answersArr) => {
          let total = 0;
          // s4 is the only reverse question left, which is at index 3
          const reverseIndices = [3];
          answersArr.forEach((ans, idx) => {
              if (reverseIndices.includes(idx)) {
                  total += (4 - ans.score);
              } else {
                  total += ans.score;
              }
          });
          let level = '';
          if (total <= 8) level = 'Low';
          else if (total <= 16) level = 'Moderate';
          else level = 'High';
          return { total, level, needsHelp: false };
      }
  }
};

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
