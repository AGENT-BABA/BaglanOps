import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Users, Wrench, Router as RouterIcon, AlertOctagon, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

const KPI = [
  { key: "clients", label: "MY CLIENTS", icon: Users, tone: "text-primary" },
  { key: "workers", label: "MY WORKERS", icon: Wrench, tone: "text-emerald-500" },
  { key: "routers", label: "ROUTERS", icon: RouterIcon, tone: "text-primary" },
  { key: "open_tickets", label: "OPEN TICKETS", icon: AlertOctagon, tone: "text-rose-500" },
  { key: "unassigned", label: "UNASSIGNED", icon: AlertOctagon, tone: "text-amber-500" },
  { key: "resolved_today", label: "RESOLVED · 24H", icon: CheckCircle2, tone: "text-emerald-500" },
];

export default function DealerOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/dealer/overview");
      setStats(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(stats?.dealer_code || "");
    toast.success("Dealer code copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">DEALER OPERATIONS</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your Territory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live view of your clients, workers and open tickets. Auto-refreshing every 10s.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats?.dealer_code && (
            <button
              onClick={copyCode}
              data-testid="dealer-code-copy-btn"
              className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs tx-colors hover:bg-primary/20"
            >
              <Copy className="h-3 w-3" /> CODE · {stats.dealer_code}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {KPI.map((k) => (
          <Card key={k.key} className="border-border tx-transform hover:-translate-y-0.5" data-testid={`dealer-kpi-${k.key}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-label text-[9px] text-muted-foreground">{k.label}</div>
                  <div className="mt-1.5 font-display text-2xl font-semibold tabular-nums">
                    {loading || !stats ? <Skeleton className="h-7 w-14" /> : (stats[k.key] || 0).toLocaleString()}
                  </div>
                </div>
                <k.icon className={`h-4 w-4 ${k.tone}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-lg">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid gap-3 sm:grid-cols-2">
          <Link to="/dealer/tickets" className="rounded-md border border-border p-4 tx-colors hover:border-primary/50 hover:bg-primary/5" data-testid="quick-tickets">
            <div className="font-label text-[10px] text-muted-foreground">TICKETS</div>
            <div className="mt-1 font-display text-lg font-semibold">Assign & Track</div>
            <div className="mt-1 text-sm text-muted-foreground">Assign nearest available worker to each ticket.</div>
          </Link>
          <Link to="/dealer/workers" className="rounded-md border border-border p-4 tx-colors hover:border-primary/50 hover:bg-primary/5" data-testid="quick-workers">
            <div className="font-label text-[10px] text-muted-foreground">TEAM</div>
            <div className="mt-1 font-display text-lg font-semibold">Manage Workers</div>
            <div className="mt-1 text-sm text-muted-foreground">Add new maintenance workers with their service area.</div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
