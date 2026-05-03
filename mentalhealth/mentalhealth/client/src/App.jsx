import { Navigate, Outlet, Route, Routes, useLocation, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteLoader from "./components/RouteLoader";
import HeroNavbar from "./components/HeroNavbar/HeroNavbar";
import PatientShell from "./components/patient/PatientShell";
import AuthWindow from "./components/AuthWindow";
import Home from "./pages/Home";
import OnboardingPage from "./pages/patient/OnboardingPage";
import DoctorOnboardingPage from "./pages/doctor/DoctorOnboardingPage";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/patient/DashboardPage";
import ChatPage from "./pages/patient/ChatPage";
import AssessmentPage from "./pages/patient/AssessmentPage";
import AssessmentResultPage from "./pages/patient/AssessmentResultPage";
import ActivitiesPage from "./pages/patient/ActivitiesPage";
import ActivityDetailPage from "./pages/patient/ActivityDetailPage";
import CommunityPage from "./pages/patient/CommunityPage";
import CommunityPostPage from "./pages/patient/CommunityPostPage";
import DoctorsPage from "./pages/patient/DoctorsPage";
import DoctorProfilePage from "./pages/patient/DoctorProfilePage";
import BookingPage from "./pages/patient/BookingPage";
import BookingConfirmationPage from "./pages/patient/BookingConfirmationPage";
import AppointmentsPage from "./pages/patient/AppointmentsPage";
import Unauthorized from "./pages/Unauthorized";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function RootRedirect() {
  const { isHydrating, isAuthenticated, role, user } = useAuth();

  if (isHydrating) {
    return <RouteLoader label="Restoring your MindBridge session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === "patient") {
    return (
      <Navigate
        to={user?.onboardingCompleted ? "/patient/dashboard" : "/patient/onboarding"}
        replace
      />
    );
  }

  if (role === "pending-doctor") {
    return (
      <Navigate
        to={user?.onboardingCompleted ? "/patient/dashboard" : "/doctor/onboarding"}
        replace
      />
    );
  }

  if (role === "doctor") {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function PatientGate({ requireOnboardingComplete = true }) {
  const { user, isHydrating, role } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return <RouteLoader label="Loading your care space..." />;
  }

  if (requireOnboardingComplete && !user?.onboardingCompleted) {
    const onboardingPath = role === "pending-doctor" ? "/doctor/onboarding" : "/patient/onboarding";
    return <Navigate to={onboardingPath} state={{ from: location.pathname }} replace />;
  }

  if (!requireOnboardingComplete && user?.onboardingCompleted) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  return <Outlet />;
}

function PatientShellLayout() {
  return (
    <PatientShell>
      <Outlet />
    </PatientShell>
  );
}

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAboutPage = location.pathname === "/about";
  const isAuthPage = location.pathname.startsWith("/login") || location.pathname.startsWith("/signup");
  
  // Dashboard areas usually have their own sidebar/layout (PatientShell)
  const isDashboardArea = 
    location.pathname.startsWith("/patient") || 
    location.pathname.startsWith("/doctor/dashboard") || 
    location.pathname.startsWith("/admin/dashboard");

  // Choose the navbar theme based on the page
  let navTheme = "sticky"; // Default for white bg pages
  if (isHomePage || isAboutPage) {
    navTheme = "light"; // Transparent over video
  }

  return (
    <>
      {/* Show the unified HeroNavbar on all pages EXCEPT auth pages and dashboard areas (which have PatientShell) */}
      {!isAuthPage && !isDashboardArea && (
        <div className={isHomePage || isAboutPage ? "absolute top-0 left-0 w-full z-[100]" : ""}>
          <HeroNavbar theme={navTheme} />
        </div>
      )}

      {isAuthPage ? (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 z-50">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Home
          </Link>
        </div>
      ) : null}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/start" element={<RootRedirect />} />
        <Route path="/login" element={<AuthWindow mode="login" />} />
        <Route path="/login/:role" element={<AuthWindow mode="login" />} />
        <Route path="/signup" element={<AuthWindow mode="signup" />} />
        <Route path="/signup/:role" element={<AuthWindow mode="signup" />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/ai-chat" element={<ChatPage />} />
        <Route
          path="/community"
          element={
            <ProtectedRoute allowedRoles={["patient", "pending-doctor"]}>
              <PatientGate />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/community" replace />} />
        </Route>
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient", "pending-doctor"]}>
              <PatientGate />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/doctors" replace />} />
        </Route>
        <Route
          path="/questions"
          element={
            <ProtectedRoute allowedRoles={["patient", "pending-doctor"]}>
              <PatientGate />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/assessments" replace />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientGate requireOnboardingComplete={false} />
            </ProtectedRoute>
          }
        >
          <Route path="/patient/onboarding" element={<OnboardingPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["pending-doctor"]}>
              <PatientGate requireOnboardingComplete={false} />
            </ProtectedRoute>
          }
        >
          <Route path="/doctor/onboarding" element={<DoctorOnboardingPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["patient", "pending-doctor"]}>
              <PatientGate />
            </ProtectedRoute>
          }
        >
          <Route path="/patient" element={<PatientShellLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="assessments" element={<AssessmentPage />} />
            <Route path="assessments/:assessmentId" element={<AssessmentResultPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="activities/:activityId" element={<ActivityDetailPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="community/:postId" element={<CommunityPostPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="doctors/:doctorId" element={<DoctorProfilePage />} />
            <Route path="doctors/:doctorId/book" element={<BookingPage />} />
            <Route path="booking/confirmed" element={<BookingConfirmationPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
          </Route>
        </Route>

        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
