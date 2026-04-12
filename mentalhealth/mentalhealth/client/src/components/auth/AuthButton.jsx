function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="login-ui__google-icon" viewBox="0 0 24 24">
      <path
        d="M21.805 12.23c0-.67-.055-1.158-.173-1.665H12.18v3.74h5.548c-.112.928-.715 2.326-2.053 3.266l-.019.125 2.991 2.27.207.02c1.9-1.713 3-4.235 3-7.756Z"
        fill="#4285F4"
      />
      <path
        d="M12.18 21.905c2.718 0 5.003-.878 6.671-2.384l-3.179-2.415c-.851.579-1.997.983-3.492.983-2.663 0-4.924-1.713-5.73-4.082l-.121.01-3.11 2.357-.042.113c1.656 3.219 5.076 5.418 9.003 5.418Z"
        fill="#34A853"
      />
      <path
        d="M6.45 14.007a5.777 5.777 0 0 1-.336-1.924c0-.67.124-1.327.324-1.924l-.006-.128-3.15-2.395-.103.048A9.627 9.627 0 0 0 2.145 12.08c0 1.549.378 3.013 1.04 4.377l3.265-2.45Z"
        fill="#FBBC05"
      />
      <path
        d="M12.18 6.072c1.887 0 3.16.804 3.884 1.476l2.836-2.707C17.172 3.292 14.898 2.25 12.18 2.25c-3.927 0-7.347 2.199-9.003 5.418l3.259 2.475c.812-2.369 3.073-4.07 5.744-4.07Z"
        fill="#EB4335"
      />
    </svg>
  );
}

export default function AuthButton({
  type = "button",
  children,
  variant = "primary",
  disabled = false,
  onClick,
}) {
  const className =
    variant === "google"
      ? "login-ui__button login-ui__button--secondary"
      : "login-ui__button login-ui__button--primary";

  return (
    <button className={className} disabled={disabled} onClick={onClick} type={type}>
      {variant === "google" ? <GoogleIcon /> : null}
      <span>{children}</span>
    </button>
  );
}
