import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { UserCog, Clock, MapPin, ExternalLink, Wrench } from "lucide-react";
import { toast } from "sonner";

const statusVariant = (s) =>
  s === "resolved" ? "default" : s === "closed" ? "secondary" :
  s === "open" ? "destructive" : "secondary";

export default function DealerTickets() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [assignTicket, setAssignTicket] = useState(null);
  const [nearby, setNearby] = useState({ workers: [], ticket: null });
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dealer/tickets", { params: { status } });
      setTickets(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [status]);

  const openAssign = async (t) => {
    setAssignTicket(t);
    setNearby({ workers: [], ticket: null });
    try {
      const { data } = await api.get(`/dealer/tickets/${t.id}/nearby-workers`);
      setNearby(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const doAssign = async (workerId) => {
    setBusyId(workerId);
    try {
      await api.post(`/dealer/tickets/${assignTicket.id}/assign`, { worker_id: workerId });
      toast.success("Assigned. Worker notified.");
      setAssignTicket(null);
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="font-label text-[10px] text-muted-foreground">TICKET QUEUE</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign the nearest available worker to each ticket. Workers get notified in real-time.
        </p>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList data-testid="dealer-ticket-tabs">
          <TabsTrigger value="all" data-testid="d-tab-all">All</TabsTrigger>
          <TabsTrigger value="open" data-testid="d-tab-open">Open</TabsTrigger>
          <TabsTrigger value="assigned" data-testid="d-tab-assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="d-tab-progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved" data-testid="d-tab-resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-[10px]">TICKET</TableHead>
                <TableHead className="font-label text-[10px]">CLIENT · ROUTER</TableHead>
                <TableHead className="font-label text-[10px]">LOCATION</TableHead>
                <TableHead className="font-label text-[10px]">ISSUE</TableHead>
                <TableHead className="font-label text-[10px]">WORKER</TableHead>
                <TableHead className="font-label text-[10px]">CREATED</TableHead>
                <TableHead className="font-label text-[10px]">STATUS</TableHead>
                <TableHead className="font-label text-[10px] text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))}
              {!loading && tickets.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No tickets in this queue.
                </TableCell></TableRow>
              )}
              {!loading && tickets.map((t) => (
                <TableRow key={t.id} className="row-hover" data-testid={`d-ticket-row-${t.ticket_number}`}>
                  <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{t.client_name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{t.router_id}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {t.location}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-label text-[9px]">
                      {t.issue_type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.worker_name ? (
                      <span className="inline-flex items-center gap-1"><Wrench className="h-3 w-3" /> {t.worker_name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(t.created_at).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(t.status)} className="font-label text-[9px]">
                      {t.status.toUpperCase()}
                    </Badge>
                    {t.feedback && (
                      <div className={`mt-1 text-[10px] ${t.feedback.working ? "text-emerald-500" : "text-rose-500"}`}>
                        {t.feedback.working ? "✓ CONFIRMED" : "✗ REOPENED"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {(t.status === "open" || t.status === "assigned") && (
                      <Button
                        size="sm"
                        variant={t.status === "open" ? "default" : "outline"}
                        onClick={() => openAssign(t)}
                        data-testid={`assign-btn-${t.ticket_number}`}
                        className="gap-1"
                      >
                        <UserCog className="h-3.5 w-3.5" /> {t.status === "open" ? "Assign" : "Reassign"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign modal */}
      <Dialog open={!!assignTicket} onOpenChange={(o) => !o && setAssignTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign worker · {assignTicket?.ticket_number}</DialogTitle>
            <DialogDescription>
              Workers are sorted by <span className="font-semibold">distance from the client</span> and current job load.
              Closest and least-busy on top.
            </DialogDescription>
          </DialogHeader>
          {nearby.ticket && (
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs">
              <div className="font-label text-[10px] text-muted-foreground">CLIENT LOCATION</div>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {nearby.ticket.location}
                {nearby.ticket.lat && (
                  <a
                    href={`https://www.google.com/maps?q=${nearby.ticket.lat},${nearby.ticket.lng}`}
                    target="_blank" rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 font-label text-[10px] text-primary hover:underline"
                  >
                    OPEN IN MAPS <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {nearby.workers.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {nearby.ticket ? "No workers available." : "Finding nearest workers…"}
              </div>
            )}
            {nearby.workers.map((w, i) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-md border border-border p-3 tx-colors hover:bg-secondary/60"
                data-testid={`nearby-worker-${w.id}`}
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 font-mono text-xs">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{w.name}</div>
                    {i === 0 && <Badge className="font-label text-[9px]">NEAREST</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {w.area}</span>
                    {w.distance_km !== null && (
                      <span className="font-mono">· {w.distance_km} km away</span>
                    )}
                    <span>· {w.active_jobs} active job(s)</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => doAssign(w.id)}
                  disabled={busyId === w.id}
                  data-testid={`assign-confirm-${w.id}`}
                >
                  {busyId === w.id ? "Assigning…" : "Assign"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
