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
import { Radio, Bell, LogOut, Menu, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const seenKey = (uid) => `netops_notif_seen_${uid || "anon"}`;

export function AppShell({ brand, roleLabel, nav, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const loadNotifs = async () => {
    try {
      const { data } = await api.get("/notifications");
      // Detect new (unseen) ones and fire OS notifications
      const seen = new Set(JSON.parse(localStorage.getItem(seenKey(user?.id)) || "[]"));
      const fresh = data.filter((n) => !seen.has(n.id) && !n.read);
      // Skip firing on very first load (avoid spamming when app just opened)
      const firstLoadMarker = seenKey(user?.id) + "_first";
      const firstLoaded = localStorage.getItem(firstLoadMarker) === "1";
      if (firstLoaded) {
        fresh.forEach((n) => {
          notify({ title: n.title || "BaglanOps", body: n.message || "", tag: n.id });
        });
      } else {
        localStorage.setItem(firstLoadMarker, "1");
      }
      // Update seen set (cap at 200 to avoid unbounded growth)
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
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-primary/40 bg-primary/10">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-display text-base font-semibold leading-none">{brand}</div>
              <div className="font-label text-[9px] text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <div className="mb-2 px-2 font-label text-[9px] text-muted-foreground">CONTROL SURFACE</div>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              data-testid={n.testId}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm tx-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
              {n.badge > 0 && (
                <Badge variant="destructive" className="ml-auto font-mono text-[10px]">{n.badge}</Badge>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <div className="rounded-md border border-border bg-secondary/40 p-3">
            <div className="font-label text-[9px] text-muted-foreground">SIGNED IN AS</div>
            <div className="mt-1 truncate text-sm font-semibold">{user?.name}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">{user?.email}</div>
            {user?.dealer_code && (
              <div className="mt-1 font-label text-[9px] text-primary">CODE · {user.dealer_code}</div>
            )}
          </div>
        </div>
      </aside>

      <header className="glass sticky top-0 z-30 lg:ml-64">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} data-testid="sidebar-open-btn">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-label text-[10px] text-muted-foreground">SYSTEM · OPERATIONAL</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotifyToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9" data-testid="notif-bell-btn">
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
                  <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
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
                      <Badge variant="secondary" className="font-label text-[9px]">
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
                <DropdownMenuItem onClick={doLogout} data-testid="logout-btn">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
