import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Info, CheckCircle } from "lucide-react";

export type AlertType = "warning" | "info" | "danger" | "success";

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
}

interface AlertCardProps {
  alert: AlertItem;
}

const alertConfig: Record<AlertType, { 
  icon: typeof AlertTriangle; 
  bgClass: string;
  iconClass: string;
}> = {
  warning: { 
    icon: AlertTriangle, 
    bgClass: "bg-warning/10 border-warning/30",
    iconClass: "text-warning"
  },
  info: { 
    icon: Info, 
    bgClass: "bg-info/10 border-info/30",
    iconClass: "text-info"
  },
  danger: { 
    icon: Bell, 
    bgClass: "bg-destructive/10 border-destructive/30",
    iconClass: "text-destructive"
  },
  success: { 
    icon: CheckCircle, 
    bgClass: "bg-success/10 border-success/30",
    iconClass: "text-success"
  },
};

export function AlertCard({ alert }: AlertCardProps) {
  const config = alertConfig[alert.type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm",
      config.bgClass
    )}>
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconClass)} />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
      </div>
    </div>
  );
}

interface AlertListProps {
  alerts: AlertItem[];
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
