// Fixed educational summaries, not clinician-reviewed or retrieved PDF passages.
const who = 'https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress';
const care = 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health';
const depression = 'https://www.nimh.nih.gov/health/topics/depression';
const anxiety = 'https://www.nimh.nih.gov/health/topics/anxiety-disorders';
export const topics = [
  ['depression', 'Depression is a mental-health condition that can affect feelings, thinking, sleep, eating and daily activities. It differs from passing sadness. A qualified professional can assess symptoms; this chat cannot diagnose you.', depression],
  ['causes of depression', 'Depression has no single explanation. Biological, genetic, psychological and environmental factors can contribute. A general description cannot establish the cause of an individual person’s symptoms.', depression],
  ['anxiety', 'Occasional anxiety is part of life. Anxiety disorders involve persistent fear or worry that can interfere with daily activities. A professional assessment is needed to distinguish a disorder from temporary worry.', anxiety],
  ['types of anxiety disorders', 'Examples include generalized anxiety disorder, panic disorder, social anxiety disorder and phobia-related disorders. Learning these names does not determine whether someone has one.', anxiety],
  ['grounding', 'Grounding brings attention back to the present. Notice your surroundings and gently reconnect with what you are doing. It is a coping practice, not a diagnosis or cure.', who],
  ['unhooking from thoughts', 'Unhooking means noticing difficult thoughts without automatically letting them direct your actions. Return attention gently to the present activity.', who],
  ['acting on values', 'Consider how you want to treat yourself and others, then choose one small action consistent with that value.', who],
  ['making room for emotions', 'Making room means allowing feelings to be present without fighting every feeling. You do not need to force an exercise that feels uncomfortable.', who],
  ['self kindness', 'Try responding to yourself with the care you would offer someone facing difficulty. Kindness is a practice, not a demand to feel positive.', who],
  ['engaging with the present', 'Bring attention to the activity in front of you. When attention wanders, gently reconnect with what you can notice now.', who],
  ['the WHO stress guide', 'Doing What Matters in Times of Stress introduces practical coping skills including grounding, unhooking, values, making room and kindness.', who],
  ['practising stress management', 'The WHO guide suggests brief regular practice of coping skills. These exercises support wellbeing and do not replace needed professional care.', who],
  ['mental health', 'Mental health includes emotional, psychological and social wellbeing; it is more than the absence of illness.', care],
  ['self care', 'Self-care includes manageable daily habits supporting wellbeing. Different people find different activities helpful.', care],
  ['sleep habits', 'A consistent sleep schedule and less screen exposure before bed can support sleep.', care],
  ['physical activity and wellbeing', 'Regular activity, including small amounts of walking, can support wellbeing. Choose activity suited to your abilities.', care],
  ['relaxing activities', 'Consider a low-pressure activity you enjoy, such as music, reading or time in nature.', care],
  ['setting priorities', 'Separate tasks that need attention now from those that can wait. Avoid taking on more than you can manage.', care],
  ['social connection', 'Trusted friends or family can offer emotional support and practical help. Consider reaching out to someone supportive.', care],
  ['seeking professional help', 'Speak with a qualified professional when symptoms are distressing or affect daily life. Seek urgent help immediately if safety is at risk.', care]
];

// 10 introductions x 5 endings x 20 topics = 1,000 exact supported phrasings.
const introductions = ['What is ', 'Explain ', 'Tell me about ', 'Please explain ', 'Can you explain ', 'Can you tell me about ', 'I want to learn about ', 'Give me an overview of ', 'Share information about ', 'Help me understand '];
const endings = ['', ' in simple words', ' briefly', ' for a beginner', ' in plain language'];
export const normalize = text => text.toLowerCase().trim().replace(/[?.!]+$/g, '').replace(/\s+/g, ' ');
export const faqEntries = topics.flatMap(([topic, answer, url], index) => introductions.flatMap(start => endings.map(end => ({
  question: `${start}${topic}${end}?`, topic, answer, url, id: `faq-${index + 1}`
}))));
const lookup = new Map(faqEntries.map(entry => [normalize(entry.question), entry]));
for (const [topic, answer, url] of topics) lookup.set(normalize(topic), { topic, answer, url });
lookup.set(normalize('What grounding exercise does the WHO stress-management guide describe?'), lookup.get('grounding'));

export function educationalFaq(question, safety) {
  // Exact whole-message matching avoids guessing at diagnoses or multi-part requests.
  if (safety.risk_level !== 'LOW' || safety.categories.some(category => category !== 'NORMAL_INFORMATION')) return null;
  const entry = lookup.get(normalize(question));
  if (!entry) return null;
  return `Built-in educational FAQ — not an answer retrieved from your uploaded PDFs.\n\n${entry.answer}\n\nGeneral information only; not a personal assessment or treatment plan.\nSource: ${entry.url}`;
}
