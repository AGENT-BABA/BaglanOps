import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { detectRouter } from "@/lib/routerDetect";
import { MapPicker } from "@/components/MapPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, WifiOff, Search, CheckCircle2, AlertTriangle, Loader2, Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const BRANDS = [
  { value: "tplink", label: "TP-Link" },
  { value: "netgear", label: "Netgear" },
  { value: "dlink", label: "D-Link" },
  { value: "asus", label: "Asus" },
  { value: "xiaomi", label: "Xiaomi / Mi" },
  { value: "mikrotik", label: "MikroTik" },
  { value: "cisco", label: "Cisco / Linksys" },
  { value: "other", label: "Other" },
];

export default function RouterSetup() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("router");
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [isNewRouter, setIsNewRouter] = useState(false);
  const [phase, setPhase] = useState(editId ? "manual" : "select");
  const [detectAttempts, setDetectAttempts] = useState(0);
  const [detectedIP, setDetectedIP] = useState("");

  // Form fields
  const [brand, setBrand] = useState("tplink");
  const [model, setModel] = useState("");
  const [routerIP, setRouterIP] = useState("192.168.0.1");
  const [wanIP, setWanIP] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [adminUser, setAdminUser] = useState("admin");
  const [adminPass, setAdminPass] = useState("");
  const [serialNum, setSerialNum] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null, address: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [createdRouterId, setCreatedRouterId] = useState("");
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    loadRouters();
  }, []);

  const loadRouters = async () => {
    try {
      const { data } = await api.get("/user/routers");
      setRouters(data);
      if (editId) {
        const r = data.find((x) => x.router_id === editId);
        if (r) {
          setSelectedRouter(r);
          setIsNewRouter(false);
          setBrand(r.brand || "tplink");
          setModel(r.model || "");
          setRouterIP(r.router_ip || "192.168.0.1");
          setWanIP(r.wan_ip || "");
          setMacAddress(r.mac_address || "");
          setAdminUser(r.admin_username || "admin");
          setAdminPass(r.admin_password || "");
          setSerialNum(r.serial_number || "");
          setLocation({ lat: r.lat, lng: r.lng, address: r.location || "" });
        }
      }
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const deleteRouter = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.delete(`/user/routers/${toDelete.router_id}`);
      toast.success(`Router ${toDelete.router_id} deleted`);
      setToDelete(null);
      await loadRouters();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const startDetection = (forNew) => {
    setPhase("detecting");
    setErr("");
    setDetectAttempts(0);
    setDetectedIP("");
    setIsNewRouter(forNew);
    tryAutoDetect(0);
  };

  const tryAutoDetect = async (attempt) => {
    setDetectAttempts(attempt + 1);
    try {
      const result = await detectRouter(attempt);
      if (result.detected) {
        setDetectedIP(result.ip || "");
        setBrand(result.brand || "tplink");
        setRouterIP(result.ip || "192.168.0.1");
        setPhase("detected");
        toast.success(`Router detected at ${result.ip}`);
      } else if (attempt + 1 >= 3) {
        setPhase("manual");
        toast("Auto-detection failed. Please enter details manually.");
      } else {
        setTimeout(() => tryAutoDetect(attempt + 1), 1500);
      }
    } catch {
      if (attempt + 1 >= 3) {
        setPhase("manual");
      } else {
        setTimeout(() => tryAutoDetect(attempt + 1), 1500);
      }
    }
  };

  const skipToManual = (forNew) => {
    setIsNewRouter(forNew);
    setPhase("manual");
  };

  const submitNewRouter = async () => {
    setBusy(true);
    setErr("");
    try {
      const { data } = await api.post("/user/routers", {
        brand,
        model,
        router_ip: routerIP,
        wan_ip: wanIP,
        mac_address: macAddress,
        admin_username: adminUser,
        admin_password: adminPass,
        serial_number: serialNum,
        location: location.address,
        lat: location.lat,
        lng: location.lng,
      });
      setCreatedRouterId(data.router_id);
      toast.success("Router registered! Health monitoring started.");
      setPhase("success");
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitEditRouter = async () => {
    if (!selectedRouter) return;
    setBusy(true);
    setErr("");
    try {
      await api.post("/user/routers/register", {
        router_id: selectedRouter.router_id,
        brand,
        model,
        router_ip: routerIP,
        wan_ip: wanIP,
        mac_address: macAddress,
        admin_username: adminUser,
        admin_password: adminPass,
        serial_number: serialNum,
      });
      toast.success("Router updated!");
      setPhase("success");
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const unregisteredRouters = routers.filter((r) => !r.router_ip || r.detection_status === "pending");
  const registeredRouters = routers.filter((r) => r.router_ip && r.detection_status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Phase: Success
  if (phase === "success") {
    return (
      <div className="space-y-6">
        <Card className="border-border">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h2 className="font-display text-2xl font-semibold">
              {isNewRouter ? "Router Registered!" : "Router Updated!"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isNewRouter ? (
                <>Your router ID is <span className="font-mono font-semibold">{createdRouterId}</span>. Health monitoring is now active. We'll check your router every 10 minutes.</>
              ) : (
                "Router settings have been updated."
              )}
            </p>
            <Button className="mt-6 gap-2" onClick={() => nav("/user")}>
              <Wifi className="h-4 w-4" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase: No routers — show Router ID input + Auto-Detect / Manual choice
  if (routers.length === 0 && phase === "select") {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">ROUTER SETUP</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Register Your Router</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll help you configure it step by step.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-display text-lg">New Router</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto gap-2 py-4"
                onClick={() => startDetection(true)}
                data-testid="auto-detect-btn"
              >
                <Search className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-label text-[10px]">AUTO-DETECT</div>
                  <div className="text-[11px] text-muted-foreground">Scan network for router</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto gap-2 py-4"
                onClick={() => skipToManual(true)}
                data-testid="manual-entry-btn"
              >
                <Settings className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-label text-[10px]">ENTER MANUALLY</div>
                  <div className="text-[11px] text-muted-foreground">Fill form yourself</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase: Select Router (existing routers — show list + Add New)
  if (phase === "select") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-label text-[10px] text-muted-foreground">ROUTER SETUP</div>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Manage Routers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure or edit your registered routers.
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setIsNewRouter(true);
              setBrand("tplink");
              setModel("");
              setRouterIP("192.168.0.1");
              setWanIP("");
              setMacAddress("");
              setAdminUser("admin");
              setAdminPass("");
              setSerialNum("");
              setLocation({ lat: null, lng: null, address: "" });
              setPhase("new-select");
            }}
            data-testid="add-router-btn"
          >
            <Plus className="h-4 w-4" /> Add Router
          </Button>
        </div>

        {unregisteredRouters.length > 0 && (
          <div>
            <div className="font-label text-[10px] text-muted-foreground mb-3">NEEDS SETUP</div>
            <div className="grid gap-3">
              {unregisteredRouters.map((r) => (
                <Card key={r.router_id} className="border-border">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-md border border-amber-500/30 bg-amber-500/10">
                        <WifiOff className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="font-mono text-sm">{r.router_id}</div>
                        <div className="text-xs text-muted-foreground">{r.location || "No location set"}</div>
                      </div>
                    </div>
                    <Button onClick={() => { setSelectedRouter(r); setIsNewRouter(false); startDetection(false); }} className="gap-2" data-testid={`setup-btn-${r.router_id}`}>
                      <Settings className="h-4 w-4" /> Set Up
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {registeredRouters.length > 0 && (
          <div>
            <div className="font-label text-[10px] text-muted-foreground mb-3">ALREADY CONFIGURED</div>
            <div className="grid gap-3">
              {registeredRouters.map((r) => (
                <Card key={r.router_id} className="border-border">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="font-mono text-sm">{r.router_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.brand} · {r.router_ip}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRouter(r);
                          setIsNewRouter(false);
                          setBrand(r.brand || "tplink");
                          setModel(r.model || "");
                          setRouterIP(r.router_ip || "192.168.0.1");
                          setWanIP(r.wan_ip || "");
                          setMacAddress(r.mac_address || "");
                          setAdminUser(r.admin_username || "admin");
                          setAdminPass(r.admin_password || "");
                          setSerialNum(r.serial_number || "");
                          setLocation({ lat: r.lat, lng: r.lng, address: r.location || "" });
                          setPhase("manual");
                        }}
                        data-testid={`edit-btn-${r.router_id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => setToDelete(r)}
                        data-testid={`delete-router-btn-${r.router_id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Phase: New router — Auto-Detect / Manual choice (from existing routers list)
  if (phase === "new-select") {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">ROUTER SETUP</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Register New Router</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll auto-detect your router or you can enter the details manually.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-display text-lg">New Router</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto gap-2 py-4"
                onClick={() => startDetection(true)}
                data-testid="auto-detect-btn"
              >
                <Search className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-label text-[10px]">AUTO-DETECT</div>
                  <div className="text-[11px] text-muted-foreground">Scan network for router</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto gap-2 py-4"
                onClick={() => skipToManual(true)}
                data-testid="manual-entry-btn"
              >
                <Settings className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-label text-[10px]">ENTER MANUALLY</div>
                  <div className="text-[11px] text-muted-foreground">Fill form yourself</div>
                </div>
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setPhase("select")} className="mt-2">
              Back to routers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase: Detecting
  if (phase === "detecting") {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">ROUTER SETUP</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Detecting Router...</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scanning your network for routers...
          </p>
        </div>
        <Card className="border-border">
          <CardContent className="p-10 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Attempt {detectAttempts}/3
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => skipToManual(isNewRouter)}>
                Skip — Enter Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase: Detected / Manual — Router details form with MapPicker
  if (phase === "detected" || phase === "manual") {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-label text-[10px] text-muted-foreground">ROUTER SETUP</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {phase === "detected" ? "Router Detected!" : isNewRouter ? "Enter Router Details" : "Edit Router"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {phase === "detected"
              ? <>Detected at <span className="font-mono">{detectedIP}</span>. Review and complete the details below.</>
              : isNewRouter
                ? <>Setting up <span className="font-mono">your new router</span></>
                : <>Update settings for <span className="font-mono">{selectedRouter?.router_id}</span></>
            }
          </p>
        </div>

        {phase === "detected" && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Router detected at <span className="font-mono">{detectedIP}</span>. Please fill in the remaining details.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="font-display text-lg">Router Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {!isNewRouter && (
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ROUTER ID</Label>
                <Input value={selectedRouter?.router_id || ""} disabled className="font-mono opacity-60" />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label className="font-label text-[10px]">BRAND</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger data-testid="router-brand"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="font-label text-[10px]">MODEL (optional)</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Archer AX55" data-testid="router-model" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ROUTER IP (LAN)</Label>
                <Input value={routerIP} onChange={(e) => setRouterIP(e.target.value)} placeholder="192.168.0.1" className="font-mono" data-testid="router-ip" />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">WAN IP (optional)</Label>
                <Input value={wanIP} onChange={(e) => setWanIP(e.target.value)} placeholder="Public IP" className="font-mono" data-testid="router-wan-ip" />
                <div className="text-[10px] text-muted-foreground">
                  Your ISP-assigned public IP. Without this, WAN status will show "unknown".
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="font-label text-[10px]">MAC ADDRESS (optional)</Label>
              <Input value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className="font-mono" data-testid="router-mac" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ADMIN USERNAME</Label>
                <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="font-mono" data-testid="router-admin-user" />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ADMIN PASSWORD</Label>
                <Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Router login password" data-testid="router-admin-pass" />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="font-label text-[10px]">SERIAL NUMBER (optional)</Label>
              <Input value={serialNum} onChange={(e) => setSerialNum(e.target.value)} className="font-mono" data-testid="router-serial" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">LOCATION</Label>
                <MapPicker
                  value={location}
                  onChange={setLocation}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="font-label text-[10px]">ADDRESS (editable)</Label>
                <Input
                  value={location.address}
                  onChange={(e) => setLocation((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Auto-filled from map — you can edit or type manually"
                  data-testid="router-address"
                />
              </div>
            </div>

            {err && (
              <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPhase(isNewRouter ? (routers.length === 0 ? "select" : "new-select") : "select")}>Cancel</Button>
              <Button
                onClick={isNewRouter ? submitNewRouter : submitEditRouter}
                disabled={busy || !routerIP || !adminPass}
                className="gap-2"
                data-testid="register-router-btn"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {busy ? (isNewRouter ? "Registering..." : "Updating...") : isNewRouter ? "Register Router & Start Monitoring" : "Update Router"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete router {toDelete?.router_id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the router <span className="font-mono">{toDelete?.router_id}</span> and all its health monitoring data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-router-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteRouter}
              disabled={busy}
              className="bg-rose-600 text-white hover:bg-rose-700"
              data-testid="delete-router-confirm"
            >
              {busy ? "Deleting…" : "Delete router"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
