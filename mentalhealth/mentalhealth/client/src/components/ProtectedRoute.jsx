import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role = null, allowedRoles = [] }) {
  const { user, isAuthenticated, isHydrating } = useAuth();
  const location = useLocation();
  const roleList = role ? [role] : allowedRoles;

  if (isHydrating) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roleList.length > 0 && !roleList.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
