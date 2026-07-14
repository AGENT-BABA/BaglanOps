import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Wrench, Building2, Router as RouterIcon, AlertOctagon, CheckCircle2, MapPin, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const KPI = [
  { key: "total_dealers", label: "DEALERS", icon: Building2, tone: "text-primary" },
  { key: "total_workers", label: "WORKERS", icon: Wrench, tone: "text-emerald-500" },
  { key: "total_clients", label: "CLIENTS", icon: Users, tone: "text-primary" },
  { key: "pppoe_sessions", label: "PPPOE SESSIONS", icon: Wifi, tone: "text-cyan-500" },
  { key: "total_routers", label: "ROUTERS", icon: RouterIcon, tone: "text-primary" },
  { key: "open_tickets", label: "OPEN TICKETS", icon: AlertOctagon, tone: "text-rose-500" },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, a, ar] = await Promise.all([
        api.get("/admin/system-stats"),
        api.get("/admin/analytics"),
        api.get("/admin/area-analytics"),
      ]);
      setStats(s.data);
      setAnalytics(a.data);
      setAreas(ar.data);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="font-label text-[10px] text-muted-foreground">SYSTEM OPERATIONS</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Command Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full visibility across every dealer, worker and client in your network.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {KPI.map((k) => (
          <Card key={k.key} className="border-border tx-transform hover:-translate-y-0.5" data-testid={`kpi-${k.key}`}>
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

      {/* MikroTik Status */}
      {!loading && stats && (
        <div className="flex items-center gap-2 text-xs">
          {stats.mikrotik_online ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">MikroTik CCR: Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">MikroTik CCR: Not configured or offline</span>
            </>
          )}
        </div>
      )}

      {/* Dealer performance */}
      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-lg">Dealer Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-label text-[10px]">DEALER</TableHead>
                <TableHead className="font-label text-[10px]">CODE</TableHead>
                <TableHead className="font-label text-[10px]">CITY</TableHead>
                <TableHead className="font-label text-[10px] text-right">CLIENTS</TableHead>
                <TableHead className="font-label text-[10px] text-right">WORKERS</TableHead>
                <TableHead className="font-label text-[10px] text-right">TICKETS</TableHead>
                <TableHead className="font-label text-[10px] text-right">OPEN</TableHead>
                <TableHead className="font-label text-[10px] text-right">RESOLVE %</TableHead>
                <TableHead className="font-label text-[10px] text-right">AVG MTTR (m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!loading && analytics.map((d) => (
                <TableRow key={d.dealer_id} className="row-hover" data-testid={`admin-dealer-row-${d.dealer_code}`}>
                  <TableCell className="text-sm font-medium">{d.dealer_name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-[10px]">{d.dealer_code}</Badge></TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {d.city}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{d.total_clients}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{d.total_workers}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{d.tickets_all}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-rose-500">{d.tickets_open}</TableCell>
                  <TableCell className="text-right">
                    <Badge className="font-label text-[9px]"
                      variant={d.resolve_rate > 70 ? "default" : d.resolve_rate > 40 ? "secondary" : "destructive"}>
                      {d.resolve_rate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{d.avg_resolution_min || "—"}</TableCell>
                </TableRow>
              ))}
              {!loading && analytics.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  No dealers yet.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Area chart */}
      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-lg">Top Areas · Ticket Volume</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72 w-full">
            {!loading && areas.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areas.slice(0, 12)} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="area" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {areas.slice(0, 12).map((_, i) => (
                      <Cell key={i} fill="hsl(217 91% 60%)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {!loading && areas.length === 0 && (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No area data yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
