import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "@/pages/Login";
import AdminLayout from "@/pages/AdminLayout";
import AdminOverview from "@/pages/AdminOverview";
import AdminDealers from "@/pages/AdminDealers";
import AdminClients from "@/pages/AdminClients";
import AdminSettings from "@/pages/AdminSettings";
import AdminDailyReports from "@/pages/AdminDailyReports";
import DealerLayout from "@/pages/DealerLayout";
import DealerOverview from "@/pages/DealerOverview";
import DealerTickets from "@/pages/DealerTickets";
import DealerWorkers from "@/pages/DealerWorkers";
import DealerClients from "@/pages/DealerClients";
import DealerHealth from "@/pages/DealerHealth";
import WorkerLayout from "@/pages/WorkerLayout";
import WorkerTasks from "@/pages/WorkerTasks";
import UserLayout from "@/pages/UserLayout";
import UserDashboard from "@/pages/UserDashboard";
import UserTickets from "@/pages/UserTickets";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="font-label text-xs text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  const home =
    user.role === "admin" ? "/admin" :
    user.role === "dealer" ? "/dealer" :
    user.role === "worker" ? "/worker" : "/user";
  return <Navigate to={home} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />

            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="dealers" element={<AdminDealers />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="daily-reports" element={<AdminDailyReports />} />
            </Route>

            <Route path="/dealer" element={<ProtectedRoute role="dealer"><DealerLayout /></ProtectedRoute>}>
              <Route index element={<DealerOverview />} />
              <Route path="tickets" element={<DealerTickets />} />
              <Route path="health" element={<DealerHealth />} />
              <Route path="workers" element={<DealerWorkers />} />
              <Route path="clients" element={<DealerClients />} />
            </Route>

            <Route path="/worker" element={<ProtectedRoute role="worker"><WorkerLayout /></ProtectedRoute>}>
              <Route index element={<WorkerTasks />} />
            </Route>

            <Route path="/user" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
              <Route index element={<UserDashboard />} />
              <Route path="tickets" element={<UserTickets />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ErrorBoundary>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
