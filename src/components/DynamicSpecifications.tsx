import { useMemo, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { PropertyDefinition, LegalValue } from "@/data/defaultProperties";

// Unit overrides for specific properties
const UNIT_OVERRIDES: Record<string, string> = {
  "Beam Angle": "°",
  "Air Movement": "m³/h",
  "Fan Cutout": "cm",
};

function FanCutoutInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"pair" | "diameter">("diameter");
  
  // Detect mode from value
  useEffect(() => {
    if (value.includes("X") || value.includes("x")) {
      setMode("pair");
    } else if (value) {
      setMode("diameter");
    }
  }, [value]);

  const handlePairChange = (num1: string, num2: string) => {
    if (num1 && num2) {
      onChange(`${num1}X${num2}`);
    } else if (!num1 && !num2) {
      onChange("");
    }
  };

  const handleDiameterChange = (num: string) => {
    onChange(num);
  };

  const pairMatch = value.match(/^(\d+)X(\d+)$/i);
  const diameterValue = pairMatch ? "" : value;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => {
            setMode("pair");
            onChange("");
          }}
          className={`text-xs px-2 py-1 rounded border ${
            mode === "pair" ? "bg-muted border-primary" : "border-border"
          }`}
        >
          W×H
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("diameter");
            onChange("");
          }}
          className={`text-xs px-2 py-1 rounded border ${
            mode === "diameter" ? "bg-muted border-primary" : "border-border"
          }`}
        >
          ⌀
        </button>
      </div>
      {mode === "pair" && (
        <div className="flex gap-1">
          <Input
            type="number"
            placeholder="W"
            value={pairMatch ? pairMatch[1] : ""}
            onChange={(e) => handlePairChange(e.target.value, pairMatch ? pairMatch[2] : "")}
            className="h-9 text-sm flex-1"
          />
          <span className="flex items-center text-xs font-semibold">×</span>
          <Input
            type="number"
            placeholder="H"
            value={pairMatch ? pairMatch[2] : ""}
            onChange={(e) => handlePairChange(pairMatch ? pairMatch[1] : "", e.target.value)}
            className="h-9 text-sm flex-1"
          />
          <span className="flex items-center text-xs text-muted-foreground">cm</span>
        </div>
      )}
      {mode === "diameter" && (
        <div className="relative">
          <Input
            type="number"
            placeholder="Diameter"
            value={diameterValue}
            onChange={(e) => handleDiameterChange(e.target.value)}
            className="h-9 text-sm pr-10"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            cm
          </span>
        </div>
      )}
    </div>
  );
}

interface DynamicSpecificationsProps {
  properties: PropertyDefinition[];
  legalValues: LegalValue[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onOtherValue?: (propertyName: string, value: string) => void;
  selectedMainCategory?: string;
  categoryFilterMap?: Array<{ categoryKeyword: string; filterDefault: string }>;
  filterDefaultMap?: Array<{ name: string; allowedProperties: string[] }>;
}

export function DynamicSpecifications({
  properties,
  legalValues,
  values,
  onChange,
  onOtherValue,
  selectedMainCategory,
  categoryFilterMap = [],
  filterDefaultMap = [],
}: DynamicSpecificationsProps) {
  const sections = useMemo(() => {
    // Filter properties based on category if available
    let filteredProperties = properties;
    
    if (selectedMainCategory && categoryFilterMap.length > 0 && filterDefaultMap.length > 0) {
      // Find matching category keyword (category name must contain the keyword fully)
      const matchedKeyword = categoryFilterMap.find((m) => {
        const keyword = m.categoryKeyword.trim();
        return keyword && selectedMainCategory.includes(keyword);
      });

      if (matchedKeyword) {
        // Find corresponding filter default
        const filterDefault = filterDefaultMap.find((f) => f.name === matchedKeyword.filterDefault);
        if (filterDefault && filterDefault.allowedProperties.length > 0) {
          // Only show properties that are in the allowed list
          filteredProperties = properties.filter((p) =>
            filterDefault.allowedProperties.some(
              (allowed) => allowed.toLowerCase() === p.name.toLowerCase()
            )
          );
        }
      }
    }

    const map = new Map<string, PropertyDefinition[]>();
    for (const prop of filteredProperties) {
      const group = map.get(prop.section) || [];
      group.push(prop);
      map.set(prop.section, group);
    }
    return Array.from(map.entries());
  }, [properties, selectedMainCategory, categoryFilterMap, filterDefaultMap]);

  const optionsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const lv of legalValues) {
      const list = map.get(lv.propertyName) || [];
      list.push(lv.allowedValue);
      map.set(lv.propertyName, list);
    }
    return map;
  }, [legalValues]);

  const handleOtherSubmit = useCallback((propertyName: string, key: string, value: string) => {
    onChange(key, value);
    onOtherValue?.(propertyName, value);
  }, [onChange, onOtherValue]);

  return (
    <div className="space-y-5">
      {sections.map(([sectionName, props]) => (
        <div key={sectionName}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {sectionName}
          </p>
          {sectionName.toLowerCase() === "filters" && (
            <p className="text-xs text-destructive mb-2">
              Please avoid “Other.” Exhaust all existing options first and use it only when no listed value applies.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {props.map((prop) => {
              const unitOverride = UNIT_OVERRIDES[prop.name];
              const displayUnit = unitOverride || prop.unitSuffix;
              const isFanCutout = prop.name === "Fan Cutout";

              return (
                <div key={prop.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{prop.name}</Label>
                  {prop.inputType === "dropdown" && (
                    <SearchableSelect
                      value={values[prop.key] || ""}
                      onValueChange={(v) => onChange(prop.key, v)}
                      options={optionsMap.get(prop.name) || []}
                      placeholder="Select..."
                      allowOther
                      onOtherSubmit={(v) => handleOtherSubmit(prop.name, prop.key, v)}
                    />
                  )}
                  {prop.inputType === "text" && !isFanCutout && (
                    <div className="relative">
                      <Input
                        value={values[prop.key] || ""}
                        onChange={(e) => onChange(prop.key, e.target.value)}
                        placeholder={`Enter ${prop.name.toLowerCase()}`}
                        className={displayUnit ? "h-9 text-sm pr-10" : "h-9 text-sm"}
                      />
                      {displayUnit && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {displayUnit}
                        </span>
                      )}
                    </div>
                  )}
                  {isFanCutout && (
                    <FanCutoutInput value={values[prop.key] || ""} onChange={(v) => onChange(prop.key, v)} />
                  )}
                  {prop.inputType === "number" && (
                    <div className="relative">
                      <Input
                        type="number"
                        value={values[prop.key] || ""}
                        onChange={(e) => onChange(prop.key, e.target.value)}
                        placeholder="0"
                        className={displayUnit ? "h-9 text-sm pr-10" : "h-9 text-sm"}
                      />
                      {displayUnit && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {displayUnit}
                        </span>
                      )}
                    </div>
                  )}
                  {prop.inputType === "boolean" && (
                    <div className="flex items-center gap-2 h-9">
                      <Switch
                        checked={values[prop.key] === "Yes"}
                        onCheckedChange={(checked) => onChange(prop.key, checked ? "Yes" : "No")}
                      />
                      <span className="text-xs text-muted-foreground">
                        {values[prop.key] === "Yes" ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
