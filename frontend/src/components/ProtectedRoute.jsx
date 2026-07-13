import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="font-label text-xs text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    const home = { admin: "/admin", dealer: "/dealer", worker: "/worker", user: "/user" };
    return <Navigate to={home[user.role] || "/login"} replace />;
  }
  return children;
}
