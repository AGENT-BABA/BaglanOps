import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/StatusPill";
import { AlertTriangle, TicketPlus, Zap, Wifi, WifiOff, Clock, ArrowDown, ArrowUp, Gauge } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import SpeedTest from "@/components/SpeedTest";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [routers, setRouters] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState("");
  const [issueType, setIssueType] = useState("wire_cut");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [speedTestOpen, setSpeedTestOpen] = useState(false);

  const load = async () => {
    try {
      const [r, t] = await Promise.all([api.get("/user/routers"), api.get("/user/tickets")]);
      setRouters(r.data);
      setTickets(t.data);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  const openReport = (routerId) => {
    setSelectedRouter(routerId || (routers[0]?.router_id ?? ""));
    setReportOpen(true);
  };

  const submitReport = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/user/report-issue", {
        router_id: selectedRouter,
        issue_type: issueType,
        description: desc,
      });
      toast.success(`Ticket ${data.ticket_number} created — dealer notified`);
      setReportOpen(false);
      setDesc("");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const activeTickets = tickets.filter((t) => t.status !== "closed");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">CLIENT DASHBOARD</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time view of your internet connection. Report issues to your dealer with one click.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setSpeedTestOpen(true)}
            data-testid="speed-test-btn"
          >
            <Zap className="h-4 w-4" /> Test Speed
          </Button>
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="report-issue-btn" onClick={() => openReport()}>
                <TicketPlus className="h-4 w-4" /> Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Report a connection issue</DialogTitle>
                <DialogDescription>Your dealer will be notified immediately.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">ROUTER</Label>
                  <Select value={selectedRouter} onValueChange={setSelectedRouter}>
                    <SelectTrigger data-testid="report-router-select"><SelectValue placeholder="Select router" /></SelectTrigger>
                    <SelectContent>
                      {routers.map((r) => (
                        <SelectItem key={r.router_id} value={r.router_id} className="max-w-full">
                          <span className="block max-w-[420px] truncate">{r.pppoe_username || r.router_id}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">ISSUE TYPE</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger data-testid="report-issue-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wire_cut">Wire cut / cable damaged</SelectItem>
                      <SelectItem value="no_signal">No internet signal</SelectItem>
                      <SelectItem value="slow_speed">Very slow speed</SelectItem>
                      <SelectItem value="outage">Complete outage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">DESCRIPTION (OPTIONAL)</Label>
                  <Textarea data-testid="report-desc-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add any details for the technician…" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                <Button data-testid="report-submit-btn" disabled={busy || !selectedRouter} onClick={submitReport}>
                  {busy ? "Submitting…" : "Submit report"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* PPPoE Connection cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-border"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        {!loading && routers.map((r) => (
          <Card key={r.router_id} className="border-border" data-testid={`user-router-card-${r.router_id}`}>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">CONNECTION</div>
                  <CardTitle className="font-mono text-base">{r.pppoe_username || r.router_id}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === "online" || r.health_status === "online" ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-rose-500" />
                  )}
                  <StatusPill status={r.health_status || r.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">PROFILE</div>
                  <div className="mt-1 flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" /> {r.pppoe_profile || "default"}
                  </div>
                </div>
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">IP ADDRESS</div>
                  <div className="mt-1 font-mono text-xs">{r.pppoe_ip || "—"}</div>
                </div>
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">UPTIME</div>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {r.pppoe_uptime || "—"}
                  </div>
                </div>
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">STATUS</div>
                  <div className="mt-1">
                    {(r.health_status || r.status) === "online" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">● Online</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-medium">● Offline</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Usage */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-3">
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">DOWNLOADED</div>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                    <ArrowDown className="h-3 w-3 text-emerald-500" />
                    {formatBytes(r.usage_in)}
                  </div>
                </div>
                <div>
                  <div className="font-label text-[9px] text-muted-foreground">UPLOADED</div>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                    <ArrowUp className="h-3 w-3 text-blue-500" />
                    {formatBytes(r.usage_out)}
                  </div>
                </div>
              </div>
              {(r.health_status || r.status) !== "online" && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Connection appears offline — possible wire cut or outage.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!loading && routers.length === 0 && (
          <Card className="border-border md:col-span-2">
            <CardContent className="py-12 text-center">
              <WifiOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No connection assigned yet. Contact your admin to get a router assigned.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active tickets teaser */}
      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between border-b border-border">
          <CardTitle className="font-display text-lg">Active Tickets</CardTitle>
          <Link to="/user/tickets" className="font-label text-[10px] text-primary hover:underline">VIEW ALL</Link>
        </CardHeader>
        <CardContent className="p-0">
          {activeTickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No active tickets. Everything running smooth.</div>
          ) : (
            <div className="divide-y divide-border">
              {activeTickets.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 row-hover">
                  <Badge variant="outline" className="font-mono text-[10px]">{t.ticket_number}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {t.issue_type.replace("_", " ")} · {t.router_id}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge className="font-label text-[9px]" variant={t.status === "open" ? "destructive" : "secondary"}>
                    {t.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Speed Test Dialog */}
      <Dialog open={speedTestOpen} onOpenChange={setSpeedTestOpen}>
        <DialogContent className="sm:max-w-md">
          <SpeedTest onClose={() => setSpeedTestOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
