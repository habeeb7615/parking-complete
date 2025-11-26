import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Attendant Dashboard</h1>
        <p className="text-slate-600">Live gate operations and vehicle management</p>
      </div>
      
      <Card className="bg-white/40 backdrop-blur-xl border-white/30 rounded-xl">
        <CardHeader>
          <CardTitle>Welcome, Attendant!</CardTitle>
          <CardDescription>Your parking operations panel</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Attendant dashboard content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}