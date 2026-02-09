import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MasterFilterLabel } from "@/hooks/useSheetData";

interface Props {
  sku: string;
  chatgptData: string;
  categoryString: string;
  title: string;
  description: string;
  imageUrls: string[];
  masterFilterEnabled: boolean;
  masterFilterLabels: MasterFilterLabel[];
  masterFilterValues: Record<number, string>;
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className={`text-sm bg-muted/30 border border-border rounded-md px-3 py-2 min-h-[36px] break-all ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-muted-foreground italic">—</span>}
      </div>
    </div>
  );
}

export function ReviewStep({
  sku,
  chatgptData,
  categoryString,
  title,
  description,
  imageUrls,
  masterFilterEnabled,
  masterFilterLabels,
  masterFilterValues,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Confirm the data below. This will be written to the INPUT sheet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="INPUT!B2 — SKU" value={sku} mono />
        <Field label="INPUT!B6 — Title" value={title} />
      </div>

      <Field label="INPUT!B4 — ChatGPT Data" value={chatgptData} />
      <Field label="INPUT!B5 — Categories" value={categoryString} mono />
      <Field label="INPUT!B7 — Description" value={description} />

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">INPUT!B8:B15 — Images</Label>
        <div className="space-y-1.5">
          {imageUrls.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No images</p>
          ) : (
            imageUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] shrink-0">B{8 + i}</Badge>
                <span className="text-xs font-mono text-foreground truncate">{url}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {masterFilterEnabled && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">INPUT!D39:D77 — Master Filter</Label>
          <div className="grid grid-cols-2 gap-2">
            {masterFilterLabels.map((mf) => {
              const val = masterFilterValues[mf.row];
              if (!val?.trim()) return null;
              return (
                <div key={mf.row} className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="text-[10px] shrink-0">D{mf.row}</Badge>
                  <span className="text-muted-foreground">{mf.label}:</span>
                  <span className="font-medium">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
