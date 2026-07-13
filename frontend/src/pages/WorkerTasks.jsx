import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, ExternalLink, PlayCircle, CheckCircle2, User, Bell, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const statusVariant = (s) =>
  s === "resolved" ? "default" : s === "closed" ? "secondary" :
  s === "assigned" ? "destructive" : s === "in_progress" ? "default" : "secondary";

export default function WorkerTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/worker/tasks");
      setTasks(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    // Also refresh when the tab regains focus
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, []);

  const start = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/worker/tasks/${id}/start`);
      toast.success("Task started");
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  const complete = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/worker/tasks/${id}/complete`);
      toast.success("Marked complete — client & dealer notified");
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusyId(null); }
  };

  const visible = tasks.filter((t) =>
    filter === "all" ? true :
    filter === "active" ? ["assigned", "in_progress"].includes(t.status) :
    ["resolved", "closed"].includes(t.status)
  );

  const active = tasks.filter((t) => ["assigned", "in_progress"].includes(t.status)).length;
  const completed = tasks.filter((t) => ["resolved", "closed"].includes(t.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="font-label text-[10px] text-muted-foreground">FIELD OPS</div>
          <Button
            size="sm" variant="ghost"
            className="h-6 gap-1 px-2 font-label text-[9px]"
            onClick={load}
            data-testid="worker-refresh-btn"
          >
            <RefreshCw className="h-3 w-3" /> REFRESH
          </Button>
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">My Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks assigned by your dealer. Tap &quot;Start&quot; when you&apos;re on-site, &quot;Complete&quot; once fixed. Auto-refreshes every 5s.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border" data-testid="worker-kpi-active">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">ACTIVE</div>
            <div className="mt-1 font-display text-2xl font-semibold text-rose-500">{active}</div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="worker-kpi-completed">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">COMPLETED</div>
            <div className="mt-1 font-display text-2xl font-semibold text-emerald-500">{completed}</div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="worker-kpi-total">
          <CardContent className="p-4">
            <div className="font-label text-[9px] text-muted-foreground">ALL TIME</div>
            <div className="mt-1 font-display text-2xl font-semibold">{tasks.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="active" data-testid="w-tab-active">Active</TabsTrigger>
          <TabsTrigger value="completed" data-testid="w-tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="all" data-testid="w-tab-all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && <Skeleton className="h-40 w-full" />}
      {!loading && visible.length === 0 && (
        <Card className="border-border">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {filter === "active" ? "No active tasks. Enjoy the break!" : "No tasks here yet."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {visible.map((t) => (
          <Card key={t.id} className="border-border" data-testid={`worker-task-${t.ticket_number}`}>
            <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-mono text-sm">{t.ticket_number}</CardTitle>
                  <Badge variant={statusVariant(t.status)} className="font-label text-[9px]">
                    {t.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="font-label text-[9px]">
                    {t.issue_type.replace("_", " ").toUpperCase()}
                  </Badge>
                  {t.assigned_at && Date.now() - new Date(t.assigned_at).getTime() < 60_000 && (
                    <Badge className="bg-emerald-600 font-label text-[9px] text-white">
                      <Bell className="mr-1 h-2.5 w-2.5" /> NEW
                    </Badge>
                  )}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> {t.client_name}
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> Assigned {new Date(t.assigned_at || t.created_at).toLocaleString()}
                </div>
              </div>
              {t.status === "assigned" && (
                <Button onClick={() => start(t.id)} disabled={busyId === t.id} className="gap-2" data-testid={`start-btn-${t.ticket_number}`}>
                  <PlayCircle className="h-4 w-4" /> Start
                </Button>
              )}
              {t.status === "in_progress" && (
                <Button onClick={() => complete(t.id)} disabled={busyId === t.id} className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid={`complete-btn-${t.ticket_number}`}>
                  <CheckCircle2 className="h-4 w-4" /> Mark Complete
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="font-label text-[10px] text-muted-foreground">ADDRESS</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {t.location}
                  </div>
                  {t.lat && t.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${t.lat},${t.lng}`}
                      target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-label text-[10px] text-primary hover:underline"
                      data-testid={`open-maps-${t.ticket_number}`}
                    >
                      NAVIGATE <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div>
                  <div className="font-label text-[10px] text-muted-foreground">ROUTER · ISSUE</div>
                  <div className="mt-1 font-mono text-xs">{t.router_id}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
