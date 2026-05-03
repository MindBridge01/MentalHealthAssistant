export default function LoginContainer({ children, imageAlt, imageSrc }) {
  return (
    <section className="login-ui" aria-label="MindBridge login">
      <div className="login-ui__shell">
        <div className="login-ui__content">{children}</div>
      </div>
    </section>
  );
}
