import React from "react";
import * as Progress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleAlert, Clock, SendIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export type BarterStatus = 
  | "pending" 
  | "accepted" 
  | "inProgress" 
  | "completed" 
  | "rejected";

interface BarterProgressProps {
  status: BarterStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    percent: 25,
    color: "bg-yellow-500",
    icon: SendIcon,
    iconClass: "text-yellow-500"
  },
  accepted: {
    percent: 50,
    color: "bg-blue-500",
    icon: CheckCircle2,
    iconClass: "text-blue-500"
  },
  inProgress: {
    percent: 75,
    color: "bg-violet-500",
    icon: Clock,
    iconClass: "text-violet-500"
  },
  completed: {
    percent: 100,
    color: "bg-green-500",
    icon: CheckCircle2,
    iconClass: "text-green-500"
  },
  rejected: {
    percent: 0,
    color: "bg-red-500",
    icon: CircleAlert,
    iconClass: "text-red-500"
  }
};

export function BarterProgress({ status, className }: BarterProgressProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between text-sm font-medium">
        <h3 className="text-base font-semibold">{t("items.barterProgress")}</h3>
        <p className="text-muted-foreground">
          {t(`items.barterStatus.${status}`)}
        </p>
      </div>
      
      <Progress.Root 
        className="relative h-4 w-full overflow-hidden rounded-full bg-gray-100"
        value={config.percent}
      >
        <Progress.Indicator
          className={cn("h-full w-full flex-1 transition-all duration-700 ease-in-out", config.color)}
          style={{ transform: `translateX(-${100 - config.percent}%)` }}
        />
      </Progress.Root>
      
      <div className="flex justify-between mt-3">
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full border-2",
            status === "pending" || status === "accepted" || status === "inProgress" || status === "completed" 
              ? "border-yellow-500 bg-yellow-50" 
              : "border-gray-200 bg-gray-50"
          )}>
            <SendIcon size={14} className={status === "pending" || status === "accepted" || status === "inProgress" || status === "completed" ? "text-yellow-500" : "text-gray-400"} />
          </div>
          <span className="text-xs mt-1">{t("items.barterSteps.sent")}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full border-2",
            status === "accepted" || status === "inProgress" || status === "completed" 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 bg-gray-50"
          )}>
            <CheckCircle2 size={14} className={status === "accepted" || status === "inProgress" || status === "completed" ? "text-blue-500" : "text-gray-400"} />
          </div>
          <span className="text-xs mt-1">{t("items.barterSteps.accepted")}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full border-2",
            status === "inProgress" || status === "completed" 
              ? "border-violet-500 bg-violet-50" 
              : "border-gray-200 bg-gray-50"
          )}>
            <Clock size={14} className={status === "inProgress" || status === "completed" ? "text-violet-500" : "text-gray-400"} />
          </div>
          <span className="text-xs mt-1">{t("items.barterSteps.inProgress")}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full border-2",
            status === "completed" 
              ? "border-green-500 bg-green-50" 
              : "border-gray-200 bg-gray-50"
          )}>
            <CheckCircle2 size={14} className={status === "completed" ? "text-green-500" : "text-gray-400"} />
          </div>
          <span className="text-xs mt-1">{t("items.barterSteps.completed")}</span>
        </div>
      </div>
    </div>
  );
}