function AlertTriangleIcon() {
  return (
    <svg aria-hidden="true" className="login-ui__support-icon" viewBox="0 0 24 24">
      <path
        d="M12 4.75 19.75 18H4.25L12 4.75Zm0-2.75c-.62 0-1.2.32-1.53.86L1.33 18.5A1.76 1.76 0 0 0 2.86 21h18.28a1.76 1.76 0 0 0 1.53-2.5L13.53 2.86A1.76 1.76 0 0 0 12 2Z"
        fill="currentColor"
      />
      <path d="M11 9h2v5h-2zM11 15.75h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

export default function SupportBanner() {
  return (
    <div className="login-ui__support" role="note">
      <AlertTriangleIcon />
      <span>Immediate Support</span>
    </div>
  );
}
