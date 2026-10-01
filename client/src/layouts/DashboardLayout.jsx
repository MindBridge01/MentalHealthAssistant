import Navbar from "../components/Navbar.jsx";

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default DashboardLayout;
