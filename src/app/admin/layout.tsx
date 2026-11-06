import { requireRole } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "gauge" },
  { href: "/admin/therapists", label: "Therapists", icon: "stethoscope" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/appointments", label: "Appointments", icon: "calendar" },
  { href: "/admin/payments", label: "Revenue & payouts", icon: "wallet" },
  { href: "/admin/events", label: "Events", icon: "event" },
  { href: "/admin/gallery", label: "Gallery", icon: "gallery" },
  { href: "/admin/reports", label: "Reports & flags", icon: "alert" },
  { href: "/admin/access-log", label: "Access log", icon: "list" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <AppShell nav={NAV} userName={user.fullName || user.email || "Admin"} roleLabel="Admin" userId={user.id}>
      {children}
    </AppShell>
  );
}
