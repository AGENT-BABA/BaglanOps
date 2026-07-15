import { AppShell } from "@/components/AppShell";
import { ClipboardList } from "lucide-react";

const NAV = [
  { to: "/worker", label: "My Tasks", icon: ClipboardList, exact: true, testId: "worker-nav-tasks" },
];

export default function WorkerLayout() {
  return <AppShell brand="BaglanOps" roleLabel="MAINTENANCE · WORKER" nav={NAV} />;
}
