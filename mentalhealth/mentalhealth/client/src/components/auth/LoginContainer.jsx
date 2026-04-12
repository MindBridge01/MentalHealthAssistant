export default function LoginContainer({ children, imageAlt, imageSrc }) {
  return (
    <section className="login-ui" aria-label="MindBridge login">
      <div className="login-ui__shell">
        <div className="login-ui__content">{children}</div>
        <aside className="login-ui__visual-panel">
          <img alt={imageAlt} className="login-ui__visual-image" src={imageSrc} />
        </aside>
      </div>
    </section>
  );
}
