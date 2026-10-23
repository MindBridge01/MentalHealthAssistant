function validateProfessional(input) {
  const data = {};
  for (const key of ['name','phone','profession','country','specialty','qualification','institution','practiceLocation','languages']) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 250) {
      throw Object.assign(new Error(`Please provide a valid ${key}.`), { status: 400 });
    }
    data[key] = input[key].trim();
  }
  if (!['doctor','counsellor','psychologist'].includes(data.profession)) throw Object.assign(new Error('Choose a professional type.'), {status:400});
  const registrationRequired = data.profession === 'doctor' || input.registrationApplicable !== false;
  data.registrationApplicable = registrationRequired;
  for(const key of ['licenseNumber','regulator']) {
    if(registrationRequired && (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 250)) throw Object.assign(new Error('Provide your registration authority and number.'), {status:400});
    data[key] = registrationRequired ? input[key].trim() : '';
  }
  data.registrationExpiry = '';
  if(input.registrationExpiry) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(input.registrationExpiry)||!Number.isFinite(Date.parse(input.registrationExpiry))||new Date(input.registrationExpiry).toISOString().slice(0,10)!==input.registrationExpiry||new Date(input.registrationExpiry)<new Date(new Date().toISOString().slice(0,10)))throw Object.assign(new Error('Provide a valid, unexpired registration date.'),{status:400});
    data.registrationExpiry=input.registrationExpiry;
  }
  if(!registrationRequired){if(typeof input.registrationExplanation!=='string'||input.registrationExplanation.trim().length<15||input.registrationExplanation.length>1000)throw Object.assign(new Error('Explain why registration is not applicable; an administrator must verify this.'),{status:400});data.registrationExplanation=input.registrationExplanation.trim();}
  if (input.consent !== true) throw Object.assign(new Error('Confirm your credentials and consent to verification.'), {status:400});
  data.consent = true;
  data.consentVersion = 'professional-v1';
  return data;
}
module.exports = { validateProfessional };
