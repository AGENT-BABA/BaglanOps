import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminDailyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/admin/daily-reports?days=${days}`);
        setReports(data);
      } catch (e) { toast.error(apiErrorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, [days]);

  const avgUptime = reports.length ? (reports.reduce((s, r) => s + r.uptime_pct, 0) / reports.length).toFixed(1) : "—";
  const totalDown = reports.reduce((s, r) => s + r.down_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="font-label text-[10px] text-muted-foreground">HEALTH ANALYTICS</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Daily Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregated router health reports generated at 01:00 UTC daily.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" /><span className="font-label text-[10px]">AVG UPTIME</span>
            </div>
            <div className="font-display text-2xl font-bold">{avgUptime}%</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" /><span className="font-label text-[10px]">DOWN CHECKS</span>
            </div>
            <div className="font-display text-2xl font-bold text-rose-500">{totalDown}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" /><span className="font-label text-[10px]">REPORTS</span>
            </div>
            <div className="font-display text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="font-label text-[10px] text-muted-foreground">LAST</span>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 day</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Daily Health Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No daily reports available yet. Reports are generated at 01:00 UTC.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-label text-[10px]">DATE</TableHead>
                  <TableHead className="font-label text-[10px]">ROUTER</TableHead>
                  <TableHead className="font-label text-[10px]">UPTIME</TableHead>
                  <TableHead className="font-label text-[10px]">CHECKS</TableHead>
                  <TableHead className="font-label text-[10px]">UP / DOWN</TableHead>
                  <TableHead className="font-label text-[10px]">AVG LATENCY</TableHead>
                  <TableHead className="font-label text-[10px]">MIN / MAX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.router_id}</TableCell>
                    <TableCell>
                      <Badge variant={r.uptime_pct >= 99 ? "default" : r.uptime_pct >= 95 ? "secondary" : "destructive"}>
                        {r.uptime_pct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.total_checks}</TableCell>
                    <TableCell className="text-xs">
                      <span className="text-emerald-500">{r.up_count}</span> / <span className="text-rose-500">{r.down_count}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.avg_latency_ms != null ? `${r.avg_latency_ms}ms` : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.min_latency_ms != null ? `${r.min_latency_ms}` : "—"} / {r.max_latency_ms != null ? `${r.max_latency_ms}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
