import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Activity, Users, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const statusColor = (s) =>
  s === "online" ? "default" : s === "degraded" ? "destructive" : s === "offline" ? "destructive" : "secondary";

const statusIcon = (s) =>
  s === "online" ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> :
  s === "degraded" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
  <WifiOff className="h-3.5 w-3.5 text-rose-500" />;

export default function DealerHealth() {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyRouter, setHistoryRouter] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dealer/routers/health/summary");
      setRouters(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const checkNow = async (routerId) => {
    try {
      await api.post(`/dealer/routers/${routerId}/check-now`);
      toast.success("Health check triggered");
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const viewHistory = async (router) => {
    setHistoryRouter(router);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/dealer/routers/${router.router_id}/health/history`, { params: { hours: 24 } });
      setHistory(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setHistoryLoading(false); }
  };

  const online = routers.filter((r) => r.health_status === "online").length;
  const offline = routers.filter((r) => r.health_status === "offline").length;
  const degraded = routers.filter((r) => r.health_status === "degraded").length;
  const unconfigured = routers.filter((r) => !r.router_ip).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">NETWORK HEALTH</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Router Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time status of all client routers. Health checks run every 10 minutes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1" data-testid="health-refresh-btn">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-border" data-testid="health-kpi-online">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">ONLINE</div>
            <div className="mt-1 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="font-display text-2xl font-semibold text-emerald-500">{online}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="health-kpi-degraded">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">DEGRADED</div>
            <div className="mt-1 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-display text-2xl font-semibold text-amber-500">{degraded}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="health-kpi-offline">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">OFFLINE</div>
            <div className="mt-1 flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-rose-500" />
              <span className="font-display text-2xl font-semibold text-rose-500">{offline}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="health-kpi-unconfigured">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">NOT CONFIGURED</div>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-display text-2xl font-semibold">{unconfigured}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Router Table */}
      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-[10px]">ROUTER</TableHead>
                <TableHead className="font-label text-[10px]">CLIENT</TableHead>
                <TableHead className="font-label text-[10px]">STATUS</TableHead>
                <TableHead className="font-label text-[10px]">WAN</TableHead>
                <TableHead className="font-label text-[10px]">DEVICES</TableHead>
                <TableHead className="font-label text-[10px]">LAST CHECK</TableHead>
                <TableHead className="font-label text-[10px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))}
              {!loading && routers.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No routers found. Add clients and they will appear here.
                </TableCell></TableRow>
              )}
              {!loading && routers.map((r) => (
                <TableRow key={r.router_id} className="row-hover" data-testid={`health-row-${r.router_id}`}>
                  <TableCell>
                    <div className="font-mono text-xs">{r.router_id}</div>
                    <div className="text-[10px] text-muted-foreground">{r.brand || "Unknown"} · {r.router_ip || "Not set"}</div>
                  </TableCell>
                  <TableCell className="text-xs">{r.client_name}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(r.health_status)} className="gap-1 font-label text-[9px]">
                      {statusIcon(r.health_status)}
                      {(r.health_status || "unknown").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] text-muted-foreground">{r.wan_ip || "—"}</span>
                    {r.wan_status && (
                      <div className={`text-[10px] ${r.wan_status === "connected" ? "text-emerald-500" : "text-rose-500"}`}>
                        {r.wan_status}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.connected_devices ?? "—"}</TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.last_health_check ? new Date(r.last_health_check).toLocaleString() : "Never"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => checkNow(r.router_id)}
                        disabled={!r.router_ip}
                        data-testid={`check-btn-${r.router_id}`}
                        className="gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Check
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => viewHistory(r)}
                        data-testid={`history-btn-${r.router_id}`}
                      >
                        <Activity className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={!!historyRouter} onOpenChange={(o) => !o && setHistoryRouter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Health History — <span className="font-mono">{historyRouter?.router_id}</span>
            </DialogTitle>
          </DialogHeader>
          {historyLoading && <Skeleton className="h-40 w-full" />}
          {!historyLoading && history.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No health data yet.</div>
          )}
          {!historyLoading && history.length > 0 && (
            <div className="space-y-2">
              {history.slice(-20).reverse().map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-md border border-border p-3 text-xs">
                  <Badge variant={statusColor(h.status)} className="font-label text-[9px]">
                    {h.status?.toUpperCase()}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                    {h.wan_ip && <span className="ml-2 font-mono">WAN: {h.wan_ip}</span>}
                    {h.connected_devices != null && <span className="ml-2">Devices: {h.connected_devices}</span>}
                  </div>
                  {h.error_message && (
                    <span className="text-rose-500 text-[10px]">{h.error_message}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
