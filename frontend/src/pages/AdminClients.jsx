import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get("/admin/clients/unassigned"),
        api.get("/admin/dealers"),
      ]);
      setClients(cRes.data);
      setDealers(dRes.data);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doAssign = async () => {
    if (!selectedClient || !selectedDealer) return;
    setBusy(true);
    try {
      await api.post(`/admin/clients/${selectedClient.id}/assign-dealer`, {
        dealer_id: selectedDealer,
      });
      toast.success(`${selectedClient.name} assigned to dealer`);
      setSelectedClient(null);
      setSelectedDealer("");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="font-label text-[10px] text-muted-foreground">UNASSIGNED CLIENTS</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">Assign unassigned clients to a dealer so tickets are routed correctly.</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-[10px]">NAME</TableHead>
                <TableHead className="font-label text-[10px]">EMAIL</TableHead>
                <TableHead className="font-label text-[10px]">PHONE</TableHead>
                <TableHead className="font-label text-[10px]">CITY</TableHead>
                <TableHead className="font-label text-[10px]">CREATED</TableHead>
                <TableHead className="font-label text-[10px] text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!loading && clients.map((c) => (
                <TableRow key={c.id} className="row-hover" data-testid={`client-row-${c.email}`}>
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.email}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell className="text-xs">{c.city}</TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setSelectedClient(c)}
                      data-testid={`assign-btn-${c.email}`}
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && clients.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No unassigned clients — all clients have been assigned to a dealer.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedClient} onOpenChange={(o) => { if (!o) { setSelectedClient(null); setSelectedDealer(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedClient?.name}</DialogTitle>
            <DialogDescription>
              Select a dealer to assign this client to. Their existing open tickets will also be reassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <label className="font-label text-[10px] text-muted-foreground">SELECT DEALER</label>
            <Select value={selectedDealer} onValueChange={setSelectedDealer}>
              <SelectTrigger data-testid="dealer-select">
                <SelectValue placeholder="Choose a dealer…" />
              </SelectTrigger>
              <SelectContent>
                {dealers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.dealer_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedClient(null); setSelectedDealer(""); }}>Cancel</Button>
            <Button
              onClick={doAssign}
              disabled={busy || !selectedDealer}
              data-testid="assign-confirm-btn"
            >
              {busy ? "Assigning…" : "Assign client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
