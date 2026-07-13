import { AppShell } from "@/components/AppShell";
import { LayoutGrid, Building2, Users } from "lucide-react";

const NAV = [
  { to: "/admin", label: "System Overview", icon: LayoutGrid, exact: true, testId: "admin-nav-overview" },
  { to: "/admin/dealers", label: "Dealers", icon: Building2, testId: "admin-nav-dealers" },
  { to: "/admin/clients", label: "Clients", icon: Users, testId: "admin-nav-clients" },
];

export default function AdminLayout() {
  return <AppShell brand="NetOps" roleLabel="SYSTEM · ADMIN" nav={NAV} />;
}
