import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HydrationErrorBoundary } from "@/components/HydrationErrorBoundary";
import { MobileRouter } from "@/components/MobileRouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import RoleSelection from "./pages/RoleSelection";
import Login from "./pages/Login";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordSimple from "./pages/ResetPasswordSimple";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SuperAdminVerification from "./pages/SuperAdminVerification";
import OnboardingPage from "./pages/OnboardingPage";
import Dashboard from "./pages/dashboard/Dashboard";
import Contractors from "./pages/dashboard/Contractors";
import Locations from "./pages/dashboard/Locations";
import Attendants from "./pages/dashboard/Attendants";
import Vehicles from "./pages/dashboard/Vehicles";
import Reports from "./pages/dashboard/Reports";
import Income from "./pages/dashboard/Income";
import Logs from "./pages/dashboard/Logs";
import Subscriptions from "./pages/dashboard/Subscriptions";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/dashboard/Profile";
import QRScanner from "./pages/dashboard/QRScanner";
import CheckInOut from "./pages/dashboard/CheckInOut";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HydrationErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MobileRouter>
              <Routes>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/login" element={<Login />} />
              <Route path="/superadmin-verification" element={<SuperAdminVerification />} />
              <Route path="/superadminlogin" element={<SuperAdminLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPasswordSimple />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="contractors" element={<Contractors />} />
                <Route path="locations" element={<Locations />} />
                <Route path="attendants" element={<Attendants />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="reports" element={<Reports />} />
                <Route path="income" element={<Income />} />
                <Route path="logs" element={<Logs />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="qr-scanner" element={<QRScanner />} />
                <Route path="check-inout" element={<CheckInOut />} />
                {/* Fallback for any unmatched dashboard routes */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
              {/* Catch-all route for any other paths */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </MobileRouter>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HydrationErrorBoundary>
);

export default App;
