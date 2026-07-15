import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotifyToggle } from "@/components/NotifyToggle";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Radio, Home, TicketCheck, Bell, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const seenKey = (uid) => `netops_notif_seen_${uid || "anon"}`;

export default function UserLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [notifs, setNotifs] = useState([]);

  const loadNotifs = async () => {
    try {
      const { data } = await api.get("/notifications");
      const seen = new Set(JSON.parse(localStorage.getItem(seenKey(user?.id)) || "[]"));
      const fresh = data.filter((n) => !seen.has(n.id) && !n.read);
      const firstLoadMarker = seenKey(user?.id) + "_first";
      if (localStorage.getItem(firstLoadMarker) === "1") {
        fresh.forEach((n) => notify({ title: n.title || "BaglanOps", body: n.message || "", tag: n.id }));
      } else {
        localStorage.setItem(firstLoadMarker, "1");
      }
      const nextSeen = [...seen, ...data.map((n) => n.id)].slice(-200);
      localStorage.setItem(seenKey(user?.id), JSON.stringify(nextSeen));
      setNotifs(data);
    } catch (err) {
      console.error("notifications poll failed", err);
    }
  };

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = notifs.filter((n) => !n.read).length;
  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      loadNotifs();
    } catch (err) {
      console.error("mark read failed", err);
    }
  };

  const doLogout = () => {
    logout();
    toast("Signed out");
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-primary/40 bg-primary/10">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-display text-base font-semibold leading-none">BaglanOps</div>
              <div className="font-label text-[9px] text-muted-foreground">CLIENT PORTAL</div>
            </div>
          </div>
          <nav className="ml-6 flex items-center gap-1">
            <NavLink
              to="/user"
              end
              data-testid="user-nav-home"
              className={({ isActive }) => cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm tx-colors",
                isActive ? "border-primary/30 bg-primary/10" : "border-transparent text-muted-foreground hover:bg-secondary"
              )}
            >
              <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/user/tickets"
              data-testid="user-nav-tickets"
              className={({ isActive }) => cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm tx-colors",
                isActive ? "border-primary/30 bg-primary/10" : "border-transparent text-muted-foreground hover:bg-secondary"
              )}
            >
              <TicketCheck className="h-3.5 w-3.5" /><span className="hidden sm:inline">My Tickets</span>
            </NavLink>

          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NotifyToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9" data-testid="user-notif-btn">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-label text-[10px] text-muted-foreground">NOTIFICATIONS</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifs.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">You&apos;re all caught up.</div>
                )}
                {notifs.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "block w-full border-b border-border p-3 text-left last:border-0 tx-colors hover:bg-secondary",
                      !n.read && "bg-primary/5"
                    )}
                    data-testid={`notif-item-${n.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={n.type === "restored" ? "default" : n.type === "issue_detected" ? "destructive" : "secondary"}
                        className="font-label text-[9px]"
                      >
                        {n.type.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.message}</div>
                  </button>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="user-menu-btn">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 font-mono text-xs">
                    {(user?.name || "U").slice(0, 1)}
                  </span>
                  <span className="hidden sm:inline text-sm">{user?.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={doLogout} data-testid="user-logout-btn">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
