// A verified provider identity authenticates the account; the database controls its role.
async function resolveGoogleIdentity(payload, users, createId) {
  if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
    throw Object.assign(new Error('A verified Google email is required.'), {status:401});
  }
  const linked = await users.findUserByGoogleId(payload.sub);
  if (linked) return linked;
  const email = payload.email.trim().toLowerCase();
  if (await users.findUserByEmail(email)) {
    throw Object.assign(new Error('An account already uses this email. Sign in using its existing login method. Google linking requires a separate verified account-linking step.'), {status:409});
  }
  return users.createUser({_id:createId(),email,name:payload.name || email,googleId:payload.sub,
    profilePic:payload.picture || null,role:'patient',createdAt:new Date(),updatedAt:new Date()});
}
module.exports={resolveGoogleIdentity};
