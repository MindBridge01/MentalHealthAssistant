import { Link } from "react-router-dom";

export default function AuthFooter() {
  return (
    <div className="login-ui__footer" style={{ display:"block", width:"100%", textAlign: "center", marginTop: "24px" }}>
      <p style={{ display:"block", lineHeight:"1.8", margin: "0 0 8px 0", color: "#64748b", fontSize: "14px" }}>
        <span>Don&apos;t have an account? </span>
        <Link className="login-ui__footer-link" to="/signup/patient" style={{ display:"inline", whiteSpace:"nowrap", fontWeight: 600, color: "#0d9488" }}>
          Patient Sign Up
        </Link>
        <span style={{ margin: "0 8px", color: "#cbd5e1" }}>·</span>
        <Link className="login-ui__footer-link" to="/signup/doctor" style={{ fontWeight: 600, color: "#0d9488" }}>
          Professional Sign Up
        </Link>
      </p>
      <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
        Hospital officers join by invitation. Administrator accounts are privately provisioned.
      </p>
    </div>
  );
}
