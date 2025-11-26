import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building,
  MapPin,
  Users,
  Car,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  Activity,
  QrCode,
  UserPlus,
  X,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
  badge?: string;
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "contractor", "attendant"],
  },
  {
    title: "Contractors",
    href: "/dashboard/contractors",
    icon: Building,
    roles: ["super_admin"],
  },
  {
    title: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
    roles: ["super_admin"],
  },
  {
    title: "Locations",
    href: "/dashboard/locations",
    icon: MapPin,
    roles: ["super_admin", "contractor"],
  },
  {
    title: "Attendants",
    href: "/dashboard/attendants",
    icon: Users,
    roles: ["super_admin", "contractor"],
  },
  {
    title: "Vehicles",
    href: "/dashboard/vehicles",
    icon: Car,
    roles: ["super_admin", "contractor", "attendant"],
  },
  {
    title: "QR Scanner",
    href: "/dashboard/qr-scanner",
    icon: QrCode,
    roles: ["attendant"],
  },
  {
    title: "Check In/Out",
    href: "/dashboard/check-inout",
    icon: UserPlus,
    roles: ["attendant"],
  },
  {
    title: "Logs",
    href: "/dashboard/logs",
    icon: Activity,
    roles: ["super_admin", "contractor", "attendant"],
  },
  {
    title: "Income",
    href: "/dashboard/income",
    icon: BarChart3,
    roles: ["super_admin", "contractor"],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
    roles: ["super_admin", "contractor"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["super_admin", "contractor", "attendant"],
  },
];

export function Sidebar({ className, isMobileOpen, onMobileClose }: SidebarProps) {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!profile) return null;

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(profile.role)
  );

  const handleNavigation = (href: string) => {
    navigate(href);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex w-64 flex-col bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 text-white/90", className)}>
        <div className="flex-1 overflow-y-auto py-4 sm:py-6">
          <nav className="grid items-start px-2 sm:px-3 text-xs sm:text-sm font-medium">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1 rounded-lg text-xs sm:text-sm py-2 px-2 sm:px-3",
                    isActive
                      ? "bg-white/15 text-white hover:bg-white/20"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-parkflow-blue px-1.5 py-0.5 text-xs text-white flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-2 sm:p-4">
          <div className="rounded-lg bg-white/10 p-3 sm:p-4 text-center shadow-sm text-white">
            <p className="text-xs sm:text-sm font-medium">ParkFlow Pro</p>
            <p className="text-xs text-white/70 mt-1">
              {profile.role === "super_admin" ? "System Administrator" :
               profile.role === "contractor" ? "Contractor Panel" :
               "Attendant Panel"}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
          <div className="fixed left-0 top-0 h-full w-64 sm:w-72 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 text-white/90">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
              <h2 className="text-base sm:text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileClose}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-3 sm:py-4">
              <nav className="grid items-start px-2 sm:px-3 text-sm font-medium">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
                  
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start mb-1 rounded-lg text-sm py-2 px-2 sm:px-3",
                        isActive
                          ? "bg-white/15 text-white hover:bg-white/20"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-parkflow-blue px-1.5 py-0.5 text-xs text-white flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </nav>
            </div>
            
            <div className="p-3 sm:p-4 border-t border-white/10">
              <div className="rounded-lg bg-white/10 p-3 sm:p-4 text-center shadow-sm text-white">
                <p className="text-xs sm:text-sm font-medium">ParkFlow Pro</p>
                <p className="text-xs text-white/70 mt-1">
                  {profile.role === "super_admin" ? "System Administrator" :
                   profile.role === "contractor" ? "Contractor Panel" :
                   "Attendant Panel"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}