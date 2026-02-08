import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  required?: boolean;
}
export function FormSection({
  title,
  children,
  defaultOpen = true,
  required = false
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-3 hover:bg-muted/50 transition-colors flex-col flex items-end justify-between">
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-sm">{title}</span>
          {required && <span className="text-destructive text-xs">*</span>}
        </div>
      </button>
      <div className={cn("transition-all duration-200 ease-in-out", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
        <div className="px-4 pb-4 pt-2 border-t border-[#005eeb]">{children}</div>
      </div>
    </div>;
}