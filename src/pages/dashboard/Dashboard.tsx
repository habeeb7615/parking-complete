import { useAuth } from "@/contexts/AuthContext";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { ContractorDashboard } from "@/components/dashboard/ContractorDashboard";
import Attendants from "./Attendants";

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parkflow-blue"></div>
      </div>
    );
  }

  switch (profile.role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "contractor":
      return <ContractorDashboard />;
    case "attendant":
      return <Attendants />;
    default:
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Invalid role: {profile.role}
          </h2>
        </div>
      );
  }
}