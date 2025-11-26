import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Save, User, Bell, Shield, Database, Globe, Lock, Palette, Monitor } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences and options
          </p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Profile Status"
          value="Active"
          description="Account configured"
          icon={User}
          variant="success"
        />
        <MetricCard
          title="Notifications"
          value="3"
          description="Active channels"
          icon={Bell}
          variant="info"
        />
        <MetricCard
          title="Security Level"
          value="High"
          description="2FA enabled"
          icon={Shield}
          variant="success"
        />
        <MetricCard
          title="Data Backup"
          value="Enabled"
          description="Auto backup active"
          icon={Database}
          variant="success"
        />
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your account and profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Update personal details</p>
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Manage alerts and emails</p>
              <Button variant="outline" className="w-full">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security
            </CardTitle>
            <CardDescription>
              Security settings and access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Password and permissions</p>
              <Button variant="outline" className="w-full">
                Security
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              System
            </CardTitle>
            <CardDescription>
              System configuration and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Database and backups</p>
              <Button variant="outline" className="w-full">
                System
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Basic system configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Backup</p>
                <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Temporarily disable system access</p>
              </div>
              <Button variant="outline" size="sm">
                Disable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
