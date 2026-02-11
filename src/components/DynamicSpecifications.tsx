import { useMemo, useState, useCallback } from "react";
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

// Properties that require numeric values only
const NUMERIC_PROPERTIES = new Set([
  "Beam Angle",
  "Air Movement",
  "Fan Cutout",
  ...Object.keys(UNIT_OVERRIDES),
]);

// Unit suffixes that indicate numeric values
const NUMERIC_UNIT_SUFFIXES = new Set(["mm", "cm", "°", "m³/h", "°C", "lm", "K", "W", "cd"]);

// Helper to validate if property should be numeric based on name or unit
const isNumericProperty = (propertyName: string, unitSuffix?: string): boolean => {
  // Check explicit numeric properties
  if (NUMERIC_PROPERTIES.has(propertyName)) return true;
  
  // Check if it has a numeric unit suffix
  if (unitSuffix && NUMERIC_UNIT_SUFFIXES.has(unitSuffix)) return true;
  
  return false;
};

// Helper to sanitize numeric input - only allows digits and decimals
const sanitizeNumericInput = (input: string): string => {
  return input.replace(/[^\d.]/g, "");
};

function FanCutoutInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Determine which mode we're in based on presence of X
  const hasPairMode = value.includes("X") || value.includes("x");
  
  // Extract pair values if in pair mode
  const pairMatch = value.match(/^(\d*)X(\d*)$/i);
  const pairValue1 = pairMatch ? pairMatch[1] : "";
  const pairValue2 = pairMatch ? pairMatch[2] : "";
  
  // Extract diameter value only if not in pair mode
  const diameterValue = !hasPairMode ? value : "";
  
  // Check if each mode has any value started (grey diameter as soon as either W or H has value)
  const hasPairValue = !!(pairValue1 || pairValue2);
  const hasDiameterValue = diameterValue && diameterValue.length > 0;

  const handlePairChange = (num1: string, num2: string) => {
    // Sanitize both values and format as NUM1XNUM2
    const sanitized1 = sanitizeNumericInput(num1);
    const sanitized2 = sanitizeNumericInput(num2);
    onChange(`${sanitized1}X${sanitized2}`);
  };

  const handleDiameterChange = (num: string) => {
    const sanitized = sanitizeNumericInput(num);
    onChange(sanitized);
  };

  return (
    <div className="space-y-1.5">
      {/* W×H Mode - greyed out only if diameter has a complete value */}
      <div className={`flex gap-0.5 items-center ${hasDiameterValue ? "opacity-50 pointer-events-none" : ""}`}>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="W"
          value={pairValue1}
          onChange={(e) => handlePairChange(e.target.value, pairValue2)}
          onKeyPress={(e) => {
            if (!/[\d.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            const sanitized = sanitizeNumericInput(pastedText);
            handlePairChange(sanitized, pairValue2);
          }}
          className="h-6 text-xs flex-1 min-w-8"
          disabled={hasDiameterValue}
        />
        <span className="text-xs font-semibold">×</span>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="H"
          value={pairValue2}
          onChange={(e) => handlePairChange(pairValue1, e.target.value)}
          onKeyPress={(e) => {
            if (!/[\d.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            const sanitized = sanitizeNumericInput(pastedText);
            handlePairChange(pairValue1, sanitized);
          }}
          className="h-6 text-xs flex-1 min-w-8"
          disabled={hasDiameterValue}
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">cm</span>
      </div>

      {/* Diameter Mode - greyed out as soon as either W or H has any value */}
      <div className={`relative ${hasPairValue ? "opacity-50 pointer-events-none" : ""}`}>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="Diameter"
          value={diameterValue}
          onChange={(e) => handleDiameterChange(e.target.value)}
          onKeyPress={(e) => {
            if (!/[\d.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            const sanitized = sanitizeNumericInput(pastedText);
            handleDiameterChange(sanitized);
          }}
          className="h-6 text-xs pr-7"
          disabled={hasPairValue}
        />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          cm
        </span>
      </div>
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

  const handleOtherSubmit = useCallback((propertyName: string, key: string, value: string, unitSuffix?: string) => {
    // Sanitize numeric properties based on name or unit
    const sanitizedValue = isNumericProperty(propertyName, unitSuffix) ? sanitizeNumericInput(value) : value;
    onChange(key, sanitizedValue);
    onOtherValue?.(propertyName, sanitizedValue);
  }, [onChange, onOtherValue]);

  return (
    <div className="space-y-5">
      {sections.map(([sectionName, props]) => (
        <div key={sectionName}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {sectionName}
          </p>
          {sectionName.toLowerCase() === "filters" && (
            <>
              <p className="text-xs text-destructive mb-2">
                Please avoid "Other." Exhaust all existing options first and use it only when no listed value applies.
              </p>
              <p className="text-xs text-destructive mb-3">
                ⚠️ Ensure all entered values match the stated units (e.g., mm, °, cm, m³/h).
              </p>
            </>
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
                      propertyName={prop.name}
                      onOtherSubmit={(v) => handleOtherSubmit(prop.name, prop.key, v, displayUnit)}
                    />
                  )}
                  {prop.inputType === "text" && !isFanCutout && (
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={values[prop.key] || ""}
                        onChange={(e) => {
                          if (isNumericProperty(prop.name, displayUnit)) {
                            const newValue = sanitizeNumericInput(e.target.value);
                            onChange(prop.key, newValue);
                          } else {
                            onChange(prop.key, e.target.value);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (isNumericProperty(prop.name, displayUnit)) {
                            const char = e.key;
                            if (!/[\d.]/.test(char)) {
                              e.preventDefault();
                            }
                          }
                        }}
                        onPaste={(e) => {
                          if (isNumericProperty(prop.name, displayUnit)) {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData("text");
                            const sanitized = sanitizeNumericInput(pastedText);
                            onChange(prop.key, sanitized);
                          }
                        }}
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
                        type="text"
                        inputMode="decimal"
                        value={values[prop.key] || ""}
                        onChange={(e) => {
                          const sanitized = sanitizeNumericInput(e.target.value);
                          onChange(prop.key, sanitized);
                        }}
                        onKeyPress={(e) => {
                          if (!/[\d.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData("text");
                          const sanitized = sanitizeNumericInput(pastedText);
                          onChange(prop.key, sanitized);
                        }}
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
