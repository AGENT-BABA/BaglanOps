import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, MapPin, Trash2, Users, Phone } from "lucide-react";
import { toast } from "sonner";
import { MapPicker } from "@/components/MapPicker";

export default function AdminDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", city: "",
    address: "", lat: null, lng: null, dealer_code: "",
  });

  const [selectedDealer, setSelectedDealer] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/dealers");
      setDealers(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reset = () => setForm({
    name: "", email: "", password: "", phone: "", city: "",
    address: "", lat: null, lng: null, dealer_code: "",
  });

  const submit = async () => {
    if (form.lat == null || form.lng == null) {
      toast.error("Please pick the dealer's location on the map");
      return;
    }
    setBusy(true);
    try {
      await api.post("/admin/dealers", { ...form, lat: Number(form.lat), lng: Number(form.lng) });
      toast.success("Dealer created");
      setOpen(false);
      reset();
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const { data } = await api.delete(`/admin/dealers/${toDelete.id}`);
      toast.success(`Deleted · removed ${data.removed.workers} workers, ${data.removed.clients} clients`);
      setToDelete(null);
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const openWorkers = async (dealer) => {
    setSelectedDealer(dealer);
    setWorkersLoading(true);
    setWorkers([]);
    try {
      const { data } = await api.get(`/admin/dealers/${dealer.id}/workers`);
      setWorkers(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setWorkersLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">NETWORK PARTNERS</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Dealers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage every dealer, their code, and their territory.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-dealer-btn"><Plus className="h-4 w-4" /> Add Dealer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add a new dealer</DialogTitle>
              <DialogDescription>Pick their base location on the map — no coordinates needed.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">DEALER NAME</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="dealer-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">EMAIL</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="dealer-email" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">PASSWORD</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="dealer-password" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">PHONE</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="dealer-phone" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">CITY</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="dealer-city" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">DEALER CODE</Label>
                  <Input value={form.dealer_code} onChange={(e) => setForm({ ...form, dealer_code: e.target.value })}
                    className="font-mono uppercase" placeholder="e.g. DEL-E5" data-testid="dealer-code" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ADDRESS</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Auto-filled when you pick on the map (editable)" data-testid="dealer-address" />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">LOCATION</Label>
                <MapPicker
                  value={{ lat: form.lat, lng: form.lng, address: form.address }}
                  onChange={({ lat, lng, address }) => setForm((f) => ({ ...f, lat, lng, address: address || f.address }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy} data-testid="dealer-create-btn">
                {busy ? "Creating…" : "Create dealer"}
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
                <TableHead className="font-label text-[10px]">NAME</TableHead>
                <TableHead className="font-label text-[10px]">EMAIL</TableHead>
                <TableHead className="font-label text-[10px]">CITY</TableHead>
                <TableHead className="font-label text-[10px]">CODE</TableHead>
                <TableHead className="font-label text-[10px]">PHONE</TableHead>
                <TableHead className="font-label text-[10px]">WORKERS</TableHead>
                <TableHead className="font-label text-[10px]">TICKETS</TableHead>
                <TableHead className="font-label text-[10px] text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!loading && dealers.map((d) => (
                <TableRow
                  key={d.id}
                  className="row-hover cursor-pointer"
                  onClick={() => openWorkers(d)}
                  data-testid={`dealer-row-${d.dealer_code}`}
                >
                  <TableCell className="text-sm font-medium">{d.name}</TableCell>
                  <TableCell className="font-mono text-xs">{d.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {d.city}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-[10px]">{d.dealer_code}</Badge></TableCell>
                  <TableCell className="text-xs">{d.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px] gap-1">
                      <Users className="h-3 w-3" /> {d.worker_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">
                      <span className="text-emerald-500">{d.resolved_tickets || 0}</span>
                      <span className="text-muted-foreground"> / {d.total_tickets || 0}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm" variant="outline"
                      className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                      onClick={() => setToDelete(d)}
                      data-testid={`delete-dealer-btn-${d.dealer_code}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && dealers.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No dealers yet.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Worker dialog */}
      <Dialog open={!!selectedDealer} onOpenChange={(o) => { if (!o) { setSelectedDealer(null); setWorkers([]); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Workers — {selectedDealer?.name}</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{selectedDealer?.dealer_code}</span> · {workers.length} worker(s) assigned
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {workersLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : workers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-label text-[10px]">NAME</TableHead>
                    <TableHead className="font-label text-[10px]">EMAIL</TableHead>
                    <TableHead className="font-label text-[10px]">PHONE</TableHead>
                    <TableHead className="font-label text-[10px]">SERVICE AREA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm font-medium">{w.name}</TableCell>
                      <TableCell className="font-mono text-xs">{w.email}</TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {w.phone}</span>
                      </TableCell>
                      <TableCell className="text-xs">{w.service_area || w.city || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No workers assigned to this dealer yet.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dealer · {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the dealer <span className="font-mono">{toDelete?.dealer_code}</span> along with
              <span className="font-semibold"> all their workers, clients, routers, tickets and notifications</span>.
              This action cannot be undone. Type-confirm not required — please double-check before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={busy}
              className="bg-rose-500 hover:bg-rose-600 focus:ring-rose-500"
              data-testid="delete-deletealer-btn"
            >
              {busy ? "Deleting…" : "Yes, delete dealer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
