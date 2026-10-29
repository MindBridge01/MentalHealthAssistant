export const categories = ['NORMAL_INFORMATION', 'EMOTIONAL_DISTRESS', 'SELF_HARM_CONCERN', 'HARM_TO_OTHERS_CONCERN', 'DIAGNOSIS_REQUEST', 'MEDICATION_REQUEST', 'ABUSE_OR_SAFEGUARDING', 'MEDICAL_EMERGENCY', 'OUT_OF_SCOPE', 'PROMPT_ATTACK'];
const rules = [['SELF_HARM_CONCERN', /\b(kill myself|end my life|suicid\w*|hurt myself|self[- ]harm|don't want to (live|wake up)|do not want to live)\b/i], ['HARM_TO_OTHERS_CONCERN', /\b(kill (him|her|them|someone)|hurt (him|her|them|someone)|shoot someone)\b/i], ['MEDICAL_EMERGENCY', /\b(overdos\w*|can't breathe|cannot breathe|chest pain|took (all|too many) (the )?pills)\b/i], ['DIAGNOSIS_REQUEST', /\b(diagnose me|do i have|what disorder|am i bipolar|am i depressed)\b/i], ['MEDICATION_REQUEST', /\b(dose|dosage|medication|antidepressant|ssri|stop.*pills)\b/i], ['ABUSE_OR_SAFEGUARDING', /\b(abusing me|abused|unsafe at home|being threatened|sexual assault)\b/i], ['PROMPT_ATTACK', /\b(ignore (all |previous |your )*instructions|reveal.*system prompt|developer mode|bypass.*safety)\b/i], ['EMOTIONAL_DISTRESS', /\b(overwhelmed|lonely|anxious|sad|grieving|hopeless|stressed)\b/i]];
const urgent = ['SELF_HARM_CONCERN', 'HARM_TO_OTHERS_CONCERN', 'MEDICAL_EMERGENCY'];
export function deterministicSafety(message, recent = []) {
  const current = [...recent.filter(m => m.role === 'user').slice(-2).map(m => m.content), message].join('\n');
  const matches = rules.filter(([, pattern]) => pattern.test(current)).map(([category]) => category);
  return {
    categories: matches.length ? matches : ['NORMAL_INFORMATION'],
    risk_level: matches.some(c => urgent.includes(c)) ? 'HIGH' : matches.length ? 'MEDIUM' : 'LOW'
  };
}
export function mergeSafety(a, b) {
  if (!b || !Array.isArray(b.categories) || !b.categories.length || b.categories.some(c => !categories.includes(c)) || !['LOW', 'MEDIUM', 'HIGH'].includes(b.risk_level)) throw Error('Invalid safety classification');
  const merged = [...new Set([...a.categories, ...b.categories])].filter(c => c !== 'NORMAL_INFORMATION');
  const risk = merged.some(c => urgent.includes(c)) ? 'HIGH' : ['LOW', 'MEDIUM', 'HIGH'][Math.max(['LOW', 'MEDIUM', 'HIGH'].indexOf(a.risk_level), ['LOW', 'MEDIUM', 'HIGH'].indexOf(b.risk_level))];
  return {
    categories: merged.length ? merged : ['NORMAL_INFORMATION'],
    risk_level: risk
  };
}
export const safeFallback = 'I cannot provide a reliable, source-supported answer to that right now. I can listen, but I cannot diagnose conditions or advise medication changes. A qualified mental-health professional can help you explore your concerns.';
export function controlledResponse(safety) {
  if (safety.categories.includes('MEDICAL_EMERGENCY')) return 'What you described could need urgent medical attention. Please contact local emergency services or go to the nearest emergency department now. If possible, ask someone nearby to stay with you. This chat cannot provide emergency treatment or contact services for you.';
  if (safety.categories.includes('HARM_TO_OTHERS_CONCERN')) return 'Please put distance between yourself and anyone you might hurt, and move away from weapons or other dangerous items if you can do so safely. Contact local emergency services for immediate help if someone may be in danger. Can you reach a trusted person who can help keep everyone safe? This chat does not contact anyone for you.';
  if (safety.risk_level === 'HIGH') return 'I am sorry things feel this difficult. Your safety matters. Are you in immediate danger or have you already hurt yourself? If so, contact local emergency services or go to the nearest emergency department now. If you can, move away from anything you could use to hurt yourself and reach a trusted person who can stay with you. This chat cannot contact services or other people for you.';
  if (safety.categories.includes('ABUSE_OR_SAFEGUARDING')) return 'You deserve to feel safe. If you are in immediate danger, contact local emergency services when it is safe to do so. Consider reaching a trusted person or a qualified safeguarding professional. You do not need to share identifying details here. If someone monitors your device, use a safer device when possible.';
  if (safety.categories.includes('PROMPT_ATTACK')) return 'I can help with supportive conversation and approved mental-health information, but I cannot bypass safety or privacy rules.';
  if (safety.categories.includes('OUT_OF_SCOPE')) return 'My scope is mental-health information and supportive conversation. What would you like to explore within that?';
  return null;
}
export function outputAllowed(answer, sources) {
  if (typeof answer !== 'string' || answer.length > 6000 || !answer.trim()) return false;
  if (/\b(you (definitely |clearly )?(have|suffer from) (depression|bipolar|ptsd|schizophrenia|anxiety disorder)|you are diagnosed|guaranteed (cure|recovery)|(?:start|stop|increase|decrease|double|change|take) (?:your |the )?(?:medication|dose|antidepressants?|\d+\s*mg))\b/i.test(answer)) return false;
  // URLs must come from trusted server metadata, never model-generated links.
  if (/https?:\/\//i.test(answer)) return false;
  const citations = [...answer.matchAll(/\[S(\d+)\]/g)].map(m => Number(m[1]));
  return citations.length > 0 && citations.every(n => n >= 1 && n <= sources.length);
}
