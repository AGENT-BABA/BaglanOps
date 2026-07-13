import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle, MessageSquare, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackTicket, setFeedbackTicket] = useState(null);
  const [working, setWorking] = useState("yes");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/user/tickets");
      setTickets(data);
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

  const submitFeedback = async () => {
    setBusy(true);
    try {
      await api.post(`/user/tickets/${feedbackTicket.id}/feedback`, {
        working: working === "yes",
        reason: working === "no" ? reason : "",
      });
      toast.success(working === "yes" ? "Thanks! Feedback sent to dealer." : "Reopened — dealer notified.");
      setFeedbackTicket(null);
      setReason("");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const deleteTicket = async () => {
    if (!toDelete || !deleteReason.trim()) return;
    setBusy(true);
    try {
      await api.delete(`/user/tickets/${toDelete.id}`, { data: { reason: deleteReason } });
      toast.success("Ticket deleted");
      setToDelete(null);
      setDeleteReason("");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const statusColor = (s) =>
    s === "resolved" ? "default" : s === "closed" ? "secondary" : s === "open" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div>
        <div className="font-label text-[10px] text-muted-foreground">HISTORY</div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">My Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track every request and confirm restorations.</p>
      </div>

      {loading && <Skeleton className="h-40 w-full" />}
      {!loading && tickets.length === 0 && (
        <Card className="border-border"><CardContent className="p-10 text-center text-sm text-muted-foreground">
          You haven't raised any tickets. Everything is smooth.
        </CardContent></Card>
      )}

      <div className="grid gap-3">
        {tickets.map((t) => (
          <Card key={t.id} className="border-border" data-testid={`ticket-card-${t.ticket_number}`}>
            <CardHeader className="flex-row items-start justify-between border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-mono text-sm">{t.ticket_number}</CardTitle>
                  <Badge variant={statusColor(t.status)} className="font-label text-[9px]">
                    {t.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-1 text-sm">
                  {t.issue_type.replace("_", " ")} · <span className="font-mono">{t.router_id}</span>
                </div>
                <div className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {new Date(t.created_at).toLocaleString()}
                </div>
              </div>
              {t.status === "resolved" && !t.feedback && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setFeedbackTicket(t)}
                  data-testid={`feedback-btn-${t.ticket_number}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Give feedback
                </Button>
              )}
              {t.status === "open" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                  onClick={() => setToDelete(t)}
                  data-testid={`delete-btn-${t.ticket_number}`}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5 text-sm">
              <p className="text-muted-foreground">{t.description}</p>
              {t.feedback && (
                <div className={`mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs
                  ${t.feedback.working
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                  {t.feedback.working ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {t.feedback.working ? "Working — confirmed" : `Not working: ${t.feedback.reason}`}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!feedbackTicket} onOpenChange={(o) => !o && setFeedbackTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm restoration</DialogTitle>
            <DialogDescription>
              Is your connection working now for ticket {feedbackTicket?.ticket_number}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <RadioGroup value={working} onValueChange={setWorking}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="fb-yes" data-testid="fb-yes-radio" />
                <Label htmlFor="fb-yes">Yes — connection is working</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="fb-no" data-testid="fb-no-radio" />
                <Label htmlFor="fb-no">No — still having issues</Label>
              </div>
            </RadioGroup>
            {working === "no" && (
              <div className="space-y-1.5">
                <Label className="font-label text-[10px]">WHAT'S STILL WRONG?</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the remaining issue…"
                  data-testid="fb-reason-input"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackTicket(null)}>Cancel</Button>
            <Button
              onClick={submitFeedback}
              disabled={busy || (working === "no" && !reason.trim())}
              data-testid="fb-submit-btn"
            >
              {busy ? "Submitting…" : "Submit feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(o) => { if (!o) { setToDelete(null); setDeleteReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ticket {toDelete?.ticket_number}?</DialogTitle>
            <DialogDescription>
              This will permanently remove the ticket. Please provide a reason for the deletion — the dealer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="font-label text-[10px]">REASON FOR DELETION</Label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Created by mistake, duplicate ticket…"
              data-testid="delete-reason-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setToDelete(null); setDeleteReason(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={deleteTicket}
              disabled={busy || !deleteReason.trim()}
              data-testid="delete-confirm-btn"
            >
              {busy ? "Deleting…" : "Delete ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
