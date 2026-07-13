import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Radio, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "dealer") return "/dealer";
  if (role === "worker") return "/worker";
  return "/user";
}

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const isRegister = loc.pathname === "/register";
  const [tab, setTab] = useState(isRegister ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && user.role) nav(roleHome(user.role), { replace: true });
  }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (tab === "login") {
        const res = await login(email, password);
        if (!res.ok) { setErr(res.error); return; }
        toast.success(`Welcome, ${res.user.name}`);
        nav(roleHome(res.user.role), { replace: true });
      } else {
        const res = await register({
          email, password, name, phone,
          role: "user",
          lat: null, lng: null,
        });
        if (!res.ok) { setErr(res.error); return; }
        toast.success(`Welcome, ${res.user.name} — let's set up your router`);
        nav("/user/router-setup", { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Left panel */}
      <div className="relative hidden lg:flex flex-col justify-between border-r border-border p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(https://images.pexels.com/photos/37730212/pexels-photo-37730212.jpeg?auto=compress&cs=tinysrgb&h=1200)`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-background/75 dark:bg-background/85" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-xl font-semibold">NetOps</span>
          <span className="font-label text-[10px] text-muted-foreground">/ COMMAND</span>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="font-label text-xs text-muted-foreground">ISP MAINTENANCE PLATFORM · v2.0</div>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Four roles.<br /> One <span className="text-primary">command center</span>.
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Admins oversee every dealer. Dealers dispatch nearest workers. Workers get pinged with the address. Clients confirm the fix. Zero downtime, full accountability.
          </p>
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { k: "Admin", d: "Analytics" },
              { k: "Dealer", d: "Assign" },
              { k: "Worker", d: "Execute" },
              { k: "Client", d: "Confirm" },
            ].map((s) => (
              <div key={s.k} className="rounded-md border border-border bg-card/60 p-2.5">
                <div className="font-display text-sm font-semibold">{s.k}</div>
                <div className="font-label text-[9px] text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 font-label text-[10px] text-muted-foreground">
          © NETOPS · SECURE JWT SESSION · 24H
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-primary/40 bg-primary/10">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold">NetOps</span>
          </div>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-5">
              <div className="font-label text-[10px] text-muted-foreground">GET STARTED</div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                {tab === "login" ? "Sign in to your dashboard" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tab === "login"
                  ? "Access role-specific views for admin, dealer, worker or client."
                  : "Create a client account to report issues and track tickets."}
              </p>
            </div>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" data-testid="tab-login">Sign in</TabsTrigger>
                    <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {tab === "login" && (
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                      <Label className="font-label text-[10px]">EMAIL</Label>
                      <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="font-label text-[10px]">PASSWORD</Label>
                      <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-password" />
                    </div>
                    {err && (
                      <Alert variant="destructive" data-testid="auth-error"><AlertDescription>{err}</AlertDescription></Alert>
                    )}
                    <Button type="submit" disabled={busy} className="w-full gap-2" data-testid="submit-auth-btn">
                      {busy ? "Working…" : "Sign in"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                )}

                {tab === "register" && (
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                      <Label className="font-label text-[10px]">FULL NAME</Label>
                      <Input required value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="font-label text-[10px]">PHONE</Label>
                      <Input required value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-phone" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="font-label text-[10px]">EMAIL</Label>
                      <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="font-label text-[10px]">PASSWORD</Label>
                      <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-password" />
                    </div>
                    {err && (
                      <Alert variant="destructive" data-testid="auth-error"><AlertDescription>{err}</AlertDescription></Alert>
                    )}
                    <Button type="submit" disabled={busy} className="w-full gap-2" data-testid="submit-auth-btn">
                      {busy ? "Working…" : "Create account"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <p className="mt-5 text-center font-label text-[10px] text-muted-foreground">
              <Link to="/login" className="underline">HOME</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
