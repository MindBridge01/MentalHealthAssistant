import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RouteLoader from "./RouteLoader";

export default function ProtectedRoute({ children, role = null, allowedRoles = [] }) {
  const { user, isAuthenticated, isHydrating } = useAuth();
  const location = useLocation();
  const roles = role ? [role] : allowedRoles;

  if (isHydrating) {
    return <RouteLoader label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
