import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function DealerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", address: "", lat: null, lng: null,
  });

  const load = async () => {
    try {
      const { data } = await api.get("/dealer/clients");
      setClients(data);
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (form.lat == null || form.lng == null) {
      toast.error("Please pick the client's location on the map");
      return;
    }
    setBusy(true);
    try {
      await api.post("/dealer/clients", { ...form, lat: Number(form.lat), lng: Number(form.lng) });
      toast.success("Client onboarded & router provisioned");
      setOpen(false);
      setForm({ name: "", email: "", password: "", phone: "", address: "", lat: null, lng: null });
      load();
    } catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const filtered = clients.filter((c) =>
    !q || c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.email.toLowerCase().includes(q.toLowerCase()) ||
    (c.address || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">CLIENT DIRECTORY</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients.length} client(s) under your dealer code. Add new subscribers to provision a router instantly.
          </p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" data-testid="clients-search" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-client-btn"><Plus className="h-4 w-4" /> Add Client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Onboard new client</DialogTitle>
                <DialogDescription>Search their address on the map — coordinates fill in automatically.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">FULL NAME</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="client-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="font-label text-[10px]">EMAIL</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="client-email" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-label text-[10px]">PASSWORD</Label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="client-password" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="font-label text-[10px]">PHONE</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="client-phone" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="font-label text-[10px]">ADDRESS</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Auto-filled — editable" data-testid="client-address" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-label text-[10px]">INSTALLATION LOCATION</Label>
                  <MapPicker
                    value={{ lat: form.lat, lng: form.lng, address: form.address }}
                    onChange={({ lat, lng, address }) => setForm((f) => ({ ...f, lat, lng, address: address || f.address }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={busy} data-testid="client-create-btn">
                  {busy ? "Adding…" : "Add client"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-[10px]">CLIENT</TableHead>
                <TableHead className="font-label text-[10px]">EMAIL</TableHead>
                <TableHead className="font-label text-[10px]">PHONE</TableHead>
                <TableHead className="font-label text-[10px]">ADDRESS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!loading && filtered.slice(0, 100).map((c) => (
                <TableRow key={c.id} className="row-hover">
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.email}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {c.address}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No matches.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
