import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ChatGptStep({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">ChatGPT Output</h2>
        <p className="text-sm text-muted-foreground">
          Paste the ChatGPT-generated data for this product. This is optional.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="chatgpt" className="text-sm font-medium">ChatGPT Data</Label>
        <Textarea
          id="chatgpt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste ChatGPT output here..."
          className="min-h-[240px] font-mono text-sm"
        />
      </div>
    </div>
  );
}
