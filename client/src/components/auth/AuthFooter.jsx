import { Link } from "react-router-dom";

export default function AuthFooter({ currentRole }) {
  return (
    <p className="login-ui__footer">
      <span>Don&apos;t have a account ?</span>
      <Link className="login-ui__footer-link" to={`/signup/${currentRole}`}>
        Sign Up
      </Link>
    </p>
  );
}
