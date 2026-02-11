import { useMemo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { PropertyDefinition, LegalValue } from "@/data/defaultProperties";

interface DynamicSpecificationsProps {
  properties: PropertyDefinition[];
  legalValues: LegalValue[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onOtherValue?: (propertyName: string, value: string) => void;
}

export function DynamicSpecifications({
  properties,
  legalValues,
  values,
  onChange,
  onOtherValue,
}: DynamicSpecificationsProps) {
  const sections = useMemo(() => {
    const map = new Map<string, PropertyDefinition[]>();
    for (const prop of properties) {
      const group = map.get(prop.section) || [];
      group.push(prop);
      map.set(prop.section, group);
    }
    return Array.from(map.entries());
  }, [properties]);

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
            {props.map((prop) => (
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
                {prop.inputType === "text" && (
                  <div className="relative">
                    <Input
                      value={values[prop.key] || ""}
                      onChange={(e) => onChange(prop.key, e.target.value)}
                      placeholder={`Enter ${prop.name.toLowerCase()}`}
                      className={prop.unitSuffix ? "h-9 text-sm pr-10" : "h-9 text-sm"}
                    />
                    {prop.unitSuffix && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {prop.unitSuffix}
                      </span>
                    )}
                  </div>
                )}
                {prop.inputType === "number" && (
                  <div className="relative">
                    <Input
                      type="number"
                      value={values[prop.key] || ""}
                      onChange={(e) => onChange(prop.key, e.target.value)}
                      placeholder="0 (mm, no units)"
                      className={prop.unitSuffix ? "h-9 text-sm pr-10" : "h-9 text-sm"}
                    />
                    {prop.unitSuffix && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {prop.unitSuffix}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
