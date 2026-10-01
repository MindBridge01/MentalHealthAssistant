import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SosDialog from "./SosDialog";

const navigation = [
  { label: "Dashboard", href: "/patient/dashboard", icon: "dashboard" },
  { label: "AI Chat", href: "/patient/chat", icon: "forum" },
  { label: "Assessments", href: "/patient/assessments", icon: "psychology" },
  { label: "Activities", href: "/patient/activities", icon: "self_improvement" },
  { label: "Community", href: "/patient/community", icon: "diversity_3" },
  { label: "Doctors", href: "/patient/doctors", icon: "medical_services" },
  { label: "Appointments", href: "/patient/appointments", icon: "event_available" },
];

function NavItem({ href, icon, label, onClick }) {
  return (
    <NavLink
      to={href}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
          isActive
            ? "bg-[var(--color-primary)] text-white shadow-[0_16px_36px_rgba(42,133,122,0.22)]"
            : "text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-text)]",
        ].join(" ")
      }
    >
      <span className="material-icons text-[20px]">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function PatientShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSosOpen, setSosOpen] = useState(false);

  const initials = useMemo(() => {
    if (!user?.name) return "MB";
    return user.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={[
            "fixed inset-y-0 left-0 z-30 w-72 border-r border-white/60 bg-[rgba(246,252,250,0.94)] p-6 shadow-[0_24px_80px_rgba(35,61,58,0.12)] backdrop-blur transition-transform lg:static lg:translate-x-0 lg:shadow-none",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="mb-10 flex items-center justify-between">
            <Link to="/patient/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-lg font-bold text-white">
                M
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-[var(--color-text)]">MindBridge</p>
                <p className="text-xs text-[var(--color-text-muted)]">Patient space</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-[var(--color-text-muted)] lg:hidden"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          <div className="mb-8 rounded-[28px] bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]">
                {initials}
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">{user?.name || "MindBridge member"}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
          </nav>

          <div className="mt-8 rounded-[28px] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-5">
            <p className="font-semibold text-[var(--color-text)]">Need urgent support?</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              If you are in immediate danger, call your local emergency services right away. You can also alert your emergency contact here.
            </p>
            <button
              type="button"
              onClick={() => setSosOpen(true)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-danger)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(204,93,76,0.28)]"
            >
              Open SOS
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text)]"
          >
            <span className="material-icons text-[20px]">logout</span>
            Sign out
          </button>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(246,252,250,0.84)] px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-2xl border border-white/60 bg-white p-3 text-[var(--color-text)] shadow-soft lg:hidden"
                >
                  <span className="material-icons">menu</span>
                </button>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                    Patient module
                  </p>
                  <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                    A calmer path, one step at a time
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSosOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-danger-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-danger)] shadow-soft"
              >
                <span className="material-icons text-[20px]">warning</span>
                SOS
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      <SosDialog open={isSosOpen} onClose={() => setSosOpen(false)} />
    </div>
  );
}
