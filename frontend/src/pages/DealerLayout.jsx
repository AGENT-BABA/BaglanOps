import { AppShell } from "@/components/AppShell";
import { LayoutGrid, TicketCheck, Wrench, Users, Activity } from "lucide-react";

const NAV = [
  { to: "/dealer", label: "Overview", icon: LayoutGrid, exact: true, testId: "dealer-nav-overview" },
  { to: "/dealer/tickets", label: "Tickets", icon: TicketCheck, testId: "dealer-nav-tickets" },
  { to: "/dealer/health", label: "Router Health", icon: Activity, testId: "dealer-nav-health" },
  { to: "/dealer/workers", label: "Workers", icon: Wrench, testId: "dealer-nav-workers" },
  { to: "/dealer/clients", label: "Clients", icon: Users, testId: "dealer-nav-clients" },
];

export default function DealerLayout() {
  return <AppShell brand="BaglanOps" roleLabel="DEALER · OPS" nav={NAV} />;
}
