import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserPlus, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function QuickActions() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const actions = [
    {
      title: "Add Contractor",
      description: "Create a new contractor account",
      icon: Plus,
      onClick: () => navigate("/dashboard/contractors"),
      show: profile?.role === "super_admin"
    },
    {
      title: "Add Location",
      description: "Add a new parking location",
      icon: MapPin,
      onClick: () => navigate("/dashboard/locations"),
      show: profile?.role === "super_admin" || profile?.role === "contractor"
    },
    {
      title: "Add Attendant",
      description: "Create a new attendant account",
      icon: UserPlus,
      onClick: () => navigate("/dashboard/attendants"),
      show: profile?.role === "super_admin" || profile?.role === "contractor"
    }
  ];

  const visibleActions = actions.filter(action => action.show);

  if (visibleActions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4 mr-3 shrink-0" />
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-sm text-muted-foreground">{action.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}