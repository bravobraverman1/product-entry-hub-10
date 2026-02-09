import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MasterFilterLabel } from "@/hooks/useSheetData";

interface Props {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  labels: MasterFilterLabel[];
  values: Record<number, string>;
  onChange: (row: number, value: string) => void;
}

export function MasterFilterStep({ enabled, onToggle, labels, values, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Master Filter</h2>
        <p className="text-sm text-muted-foreground">
          Toggle to enter master filter values. These are written to the INPUT sheet.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
        <Switch checked={enabled} onCheckedChange={onToggle} id="mf-toggle" />
        <Label htmlFor="mf-toggle" className="text-sm font-medium cursor-pointer">
          Requires Master Filter?
        </Label>
        <span className="text-xs text-muted-foreground ml-auto">
          {enabled ? "Yes" : "No"}
        </span>
      </div>

      {enabled && (
        <div className="space-y-3">
          {labels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No master filter fields configured. Connect a Google Sheet to load fields.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {labels.map((mf) => (
                <div key={mf.row} className="space-y-1">
                  <Label className="text-xs font-medium">{mf.label}</Label>
                  <Input
                    value={values[mf.row] || ""}
                    onChange={(e) => onChange(mf.row, e.target.value)}
                    placeholder={`Enter ${mf.label.toLowerCase()}`}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
