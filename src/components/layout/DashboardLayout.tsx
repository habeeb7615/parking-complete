import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FirstLoginHandler } from "@/components/FirstLoginHandler";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionExpiryWarning } from "@/components/SubscriptionExpiryWarning";

export function DashboardLayout() {
  const { user, profile, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  console.log('DashboardLayout: loading =', loading, 'user =', user?.id, 'profile =', profile?.id);

  if (loading) {
    console.log('DashboardLayout: Showing loading spinner');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parkflow-blue"></div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('DashboardLayout: No user or profile, redirecting to role selection');
    return <Navigate to="/" replace />;
  }

  if (profile.status === "inactive") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-parkflow-red mb-4">Account Inactive</h1>
          <p className="text-muted-foreground">
            Your account is currently inactive. Please contact your administrator to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FirstLoginHandler>
      <div className="min-h-screen bg-[radial-gradient(900px_450px_at_70%_20%,theme(colors.indigo.200)/20,transparent_60%),linear-gradient(to_bottom_right,theme(colors.slate.50),theme(colors.slate.100))]">
        <Navbar onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <div className="flex min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
          <Sidebar 
            className="sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] hidden lg:flex" 
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
          <main className="flex-1 overflow-hidden">
            <div className="p-2 sm:p-3 lg:p-4 xl:p-6">
              <SubscriptionExpiryWarning className="mb-4" />
              <Outlet />
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </FirstLoginHandler>
  );
}