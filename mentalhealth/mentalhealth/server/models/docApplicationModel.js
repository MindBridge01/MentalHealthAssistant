const { query } = require("../config/database");
const { normalizeId } = require("./_shared");

function mapApplication(row) {
  if (!row) return null;
  const data = row.application_data || {};
  return {
    _id: row.id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    
    // Explicitly mapping all registration data from the JSON column
    fullName: data.fullName,
    nameWithInitials: data.nameWithInitials,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    nicPassport: data.nicPassport,
    email: data.email,
    mobileNumber: data.mobileNumber,
    residentialAddress: data.residentialAddress,
    
    slmcNumber: data.slmcNumber,
    doctorType: data.doctorType,
    specialization: data.specialization,
    yearsOfExperience: data.yearsOfExperience,
    medicalDegree: data.medicalDegree,
    university: data.university,
    yearGraduated: data.yearGraduated,
    currentHospital: data.currentHospital,
    designation: data.designation,
    
    primarySpecialization: data.primarySpecialization,
    areasOfExpertise: data.areasOfExpertise,
    registrationType: data.registrationType,
    
    // Documents
    docRegistrationCert: data.docRegistrationCert,
    docSlmcId: data.docSlmcId,
    docMedicalDegree: data.docMedicalDegree,
    docPostgrad: data.docPostgrad,
    docSpecialist: data.docSpecialist,
    docOther: data.docOther,
    
    // Raw fallback
    applicationData: data
  };
}

async function createDocApplication(application) {
  const result = await query(
    `INSERT INTO doctor_applications (id, user_id, application_data, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      normalizeId(application._id),
      normalizeId(application.userId),
      application.applicationData,
      application.status || 'pending',
      application.createdAt || new Date(),
      application.updatedAt || new Date()
    ]
  );
  return mapApplication(result.rows[0]);
}

async function getApplicationByUserId(userId) {
  const result = await query(
    `SELECT * FROM doctor_applications WHERE user_id = $1 LIMIT 1`,
    [normalizeId(userId)]
  );
  return mapApplication(result.rows[0]);
}

async function getApplicationById(id) {
  const result = await query(
    `SELECT * FROM doctor_applications WHERE id = $1 LIMIT 1`,
    [normalizeId(id)]
  );
  return mapApplication(result.rows[0]);
}

async function updateApplicationStatus(id, status) {
  const result = await query(
    `UPDATE doctor_applications SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
    [status, new Date(), normalizeId(id)]
  );
  return mapApplication(result.rows[0]);
}

module.exports = {
  createDocApplication,
  getApplicationByUserId,
  getApplicationById,
  updateApplicationStatus
};
