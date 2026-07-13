import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";
import { MapPicker } from "@/components/MapPicker";

export default function DealerWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", area: "",
    address: "", lat: null, lng: null,
  });

  const load = async () => {
    try {
      const { data } = await api.get("/dealer/workers");
      setWorkers(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (form.lat == null || form.lng == null) {
      toast.error("Please pick the worker's base location on the map");
      return;
    }
    setBusy(true);
    try {
      await api.post("/dealer/workers", { ...form, lat: Number(form.lat), lng: Number(form.lng) });
      toast.success("Worker added");
      setOpen(false);
      setForm({ name: "", email: "", password: "", phone: "", area: "", address: "", lat: null, lng: null });
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">MAINTENANCE TEAM</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Workers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a base location (address or pin) — we'll route them the nearest tickets automatically.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-worker-btn"><Plus className="h-4 w-4" /> Add Worker</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add a maintenance worker</DialogTitle>
              <DialogDescription>Search their address or drop a pin — coordinates fill automatically.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">FULL NAME</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="worker-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">EMAIL</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="worker-email" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">PASSWORD</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="worker-password" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">PHONE</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="worker-phone" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">SERVICE AREA</Label>
                  <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Shramik Nagar" data-testid="worker-area" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ADDRESS</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Auto-filled from map — editable" data-testid="worker-address" />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">BASE LOCATION</Label>
                <MapPicker
                  value={{ lat: form.lat, lng: form.lng, address: form.address }}
                  onChange={({ lat, lng, address }) => setForm((f) => ({ ...f, lat, lng, address: address || f.address }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy} data-testid="worker-create-btn">
                {busy ? "Adding…" : "Add worker"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-[10px]">WORKER</TableHead>
                <TableHead className="font-label text-[10px]">EMAIL</TableHead>
                <TableHead className="font-label text-[10px]">AREA</TableHead>
                <TableHead className="font-label text-[10px]">ADDRESS</TableHead>
                <TableHead className="font-label text-[10px]">PHONE</TableHead>
                <TableHead className="font-label text-[10px] text-right">ACTIVE</TableHead>
                <TableHead className="font-label text-[10px] text-right">DONE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!loading && workers.map((w) => (
                <TableRow key={w.id} className="row-hover" data-testid={`worker-row-${w.email}`}>
                  <TableCell className="text-sm font-medium">{w.name}</TableCell>
                  <TableCell className="font-mono text-xs">{w.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {w.area}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {w.address || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{w.phone}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={w.active_jobs > 0 ? "destructive" : "secondary"} className="font-mono text-[10px]">
                      {w.active_jobs}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-500">{w.completed_jobs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
