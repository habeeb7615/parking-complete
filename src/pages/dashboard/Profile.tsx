import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Building, MapPin, Calendar, Shield, Edit, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function Profile() {
  const { profile, user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    phone_number: "",
    contractor_name: "",
    attendant_name: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        user_name: profile.user_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        contractor_name: profile.contractor_name || "",
        attendant_name: profile.attendant_name || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Validate required fields
      if (!formData.user_name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }

      // Prepare update data
      const updateData: any = {
        user_name: formData.user_name.trim(),
        phone_number: formData.phone_number.trim(),
      };

      // Add role-specific fields
      if (profile?.role === "contractor") {
        updateData.contractor_name = formData.contractor_name;
      } else if (profile?.role === "attendant") {
        updateData.attendant_name = formData.attendant_name;
      }

      // Update profile using AuthContext
      const result = await updateProfile(updateData);

      if (result.success) {
        setIsEditing(false);
        // Profile will be automatically updated in the context
      } else {
        throw new Error(result.error?.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      user_name: profile?.user_name || "",
      email: profile?.email || "",
      phone_number: profile?.phone_number || "",
      contractor_name: profile?.contractor_name || "",
      attendant_name: profile?.attendant_name || "",
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "contractor":
        return "bg-blue-100 text-blue-800";
      case "attendant":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "contractor":
        return "Contractor";
      case "attendant":
        return "Attendant";
      default:
        return role;
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parkflow-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Account Status"
          value="Active"
          description="Account is active"
          icon={Shield}
          variant="success"
        />
        <MetricCard
          title="Role"
          value={getRoleLabel(profile.role)}
          description="User permissions"
          icon={User}
          variant="info"
        />
        <MetricCard
          title="Member Since"
          value={profile.created_on ? formatDate(profile.created_on) : (user?.created_at ? formatDate(user.created_at) : "N/A")}
          description="Account creation date"
          icon={Calendar}
          variant="default"
        />
        <MetricCard
          title="Last Login"
          value="Today"
          description="Most recent activity"
          icon={Calendar}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={profile.user_name} />
                  <AvatarFallback className="bg-parkflow-blue text-white text-lg">
                    {profile.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profile.user_name}</h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <Badge className={`${getRoleColor(profile.role)} mt-2`}>
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Full Name</Label>
                  <Input
                    id="user_name"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                {profile.role === "contractor" && (
                  <div className="space-y-2">
                    <Label htmlFor="contractor_name">Company Name</Label>
                    <Input
                      id="contractor_name"
                      value={formData.contractor_name}
                      onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                )}
                {profile.role === "attendant" && (
                  <div className="space-y-2">
                    <Label htmlFor="attendant_name">Attendant Name</Label>
                    <Input
                      id="attendant_name"
                      value={formData.attendant_name}
                      onChange={(e) => setFormData({ ...formData, attendant_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User ID</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className="bg-green-100 text-green-800">
                  {profile.status || "Active"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role</span>
                <Badge className={getRoleColor(profile.role)}>
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First Login</span>
                <span className="text-sm text-muted-foreground">
                  {profile.is_first_login ? "Yes" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account Created</span>
                <span className="text-sm text-muted-foreground">
                  {profile.created_on ? formatDate(profile.created_on) : (user?.created_at ? formatDate(user.created_at) : "N/A")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(new Date())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Login Count</span>
                <span className="text-sm text-muted-foreground">-</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
