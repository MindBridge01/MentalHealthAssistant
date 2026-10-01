const LANGUAGES = ['English', 'Sinhala', 'Tamil'];
const GENDERS = ['', 'Woman', 'Man', 'Non-binary', 'Prefer not to say'];
const PHONE = /^\+?[0-9 ()-]{7,25}$/;

function validateRegistration(input, now = new Date()) {
  const errors = {};
  const data = {};
  const limits = { name: 120, preferredName: 80, dateOfBirth: 10, gender: 30,
    phone: 25, language: 20, city: 120, previousCare: 20, careContext: 2000,
    contactName: 120, contactRelationship: 80, contactPhone: 25 };
  for (const [key, limit] of Object.entries(limits)) {
    const value = input?.[key];
    if (value != null && typeof value !== 'string') errors[key] = 'Please enter text.';
    data[key] = typeof value === 'string' ? value.trim() : '';
    if (data[key].length > limit) errors[key] = `Use ${limit} characters or fewer.`;
  }
  if (data.name.length < 2) errors.name = 'Enter your full name.';
  const dob = new Date(`${data.dateOfBirth}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth) || !Number.isFinite(dob.getTime()) ||
      dob.toISOString().slice(0, 10) !== data.dateOfBirth || dob > now || dob.getUTCFullYear() < 1900) {
    errors.dateOfBirth = 'Enter a valid date of birth.';
  } else {
    let age = now.getUTCFullYear() - dob.getUTCFullYear();
    if (now.getUTCMonth() < dob.getUTCMonth() ||
       (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) age--;
    if (age < 18) errors.dateOfBirth = 'This university prototype currently supports adults aged 18 and over.';
  }
  if (!PHONE.test(data.phone)) errors.phone = 'Enter a valid contact number.';
  if (!LANGUAGES.includes(data.language)) errors.language = 'Choose a preferred language.';
  if (!GENDERS.includes(data.gender)) errors.gender = 'Choose one of the available options.';
  if (!['yes', 'no', 'prefer-not-to-say'].includes(data.previousCare)) errors.previousCare = 'Choose an option.';
  if (data.contactName || data.contactPhone || data.contactRelationship) {
    if (!data.contactName) errors.contactName = 'Enter your trusted contact’s name, or leave all contact fields empty.';
    if (!data.contactRelationship) errors.contactRelationship = 'Enter your relationship.';
    if (!PHONE.test(data.contactPhone)) errors.contactPhone = 'Enter a valid trusted contact number.';
  }
  for (const key of ['privacyAccepted', 'supportAcknowledged', 'emailReminders']) data[key] = input?.[key] === true;
  if (!data.privacyAccepted) errors.privacyAccepted = 'Please acknowledge how your registration information will be used.';
  if (!data.supportAcknowledged) errors.supportAcknowledged = 'Please acknowledge the service limitations.';
  return { data, errors };
}

function validateDecision(input) {
  if (!['approved', 'needs_information', 'declined'].includes(input?.status)) return 'Choose a valid review decision.';
  if (typeof input.note !== 'string' || input.note.trim().length > 1000) return 'Use a review note of up to 1,000 characters.';
  if (input.status !== 'approved' && input.note.trim().length < 10) return 'Explain the next step in at least 10 characters.';
  if (!Number.isInteger(input.version) || input.version < 1) return 'Refresh the application before reviewing it.';
  return null;
}

module.exports = { validateRegistration, validateDecision };
