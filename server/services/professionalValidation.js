function validateProfessional(input) {
  const data = {};
  for (const key of ['name','phone','profession','licenseNumber','regulator','specialty','qualification','institution','practiceLocation','languages']) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 250) {
      throw Object.assign(new Error(`Please provide a valid ${key}.`), { status: 400 });
    }
    data[key] = input[key].trim();
  }
  if (!['doctor','counsellor','psychologist'].includes(data.profession)) throw Object.assign(new Error('Choose a professional type.'), {status:400});
  if (input.consent !== true) throw Object.assign(new Error('Confirm your credentials and consent to verification.'), {status:400});
  data.consent = true;
  data.consentVersion = 'professional-v1';
  return data;
}
module.exports = { validateProfessional };
