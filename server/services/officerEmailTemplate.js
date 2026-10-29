const {emailLayout,logoAttachments}=require('./emailLayout');
function renderOfficerInviteEmail({ name, hospitalName, inviteUrl, expiresHours = 48, appOrigin }) {
  new URL(appOrigin);
  const paragraphs = [
    `Hello ${name},`,
    `You have been invited by the administration to manage appointments for ${hospitalName} on the MindBridge care platform.`,
    `As a hospital booking officer, you will receive appointment requests from verified patients and coordinate scheduling with approved professionals.`,
    `To activate your account, set your secure password, and enroll in Multi-Factor Authentication (MFA), please open the secure link below:`,
    inviteUrl,
    `Security Note: This invitation is single-use and will expire in ${expiresHours} hours. This email does not contain a password. Never forward or share this link.`,
    `MindBridge Operations\nPlease do not reply with medical information.`,
  ];

  return {
    subject: `MindBridge: Invitation to join as Booking Officer for ${hospitalName}`,
    text: paragraphs.join('\n\n'),
    html: emailLayout({title:'Your hospital workspace is ready', paragraphs:paragraphs.filter(p=>p!==inviteUrl),action:'Complete officer setup',url:inviteUrl}),
    attachments: logoAttachments(),
  };
}

module.exports={renderOfficerInviteEmail};
