import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function MetricCard({ title, value, description, icon: Icon, trend, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200',
    success: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
    warning: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
    danger: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
    info: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  };

  const iconStyles = {
    default: 'text-slate-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <Card className={`${variantStyles[variant]} hover:shadow-lg transition-all duration-200 rounded-xl border-2 hover:scale-105`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-700">{title}</CardTitle>
        <div className={`p-1.5 sm:p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconStyles[variant]}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">{value}</div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">{description}</p>
        )}
        {trend && (
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <span className={`font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-slate-500">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}