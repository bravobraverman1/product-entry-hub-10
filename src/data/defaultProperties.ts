// Default property definitions - will be overridden when Google Sheets is connected

export type PropertyInputType = "dropdown" | "text" | "number" | "boolean";

export interface PropertyDefinition {
  name: string;
  key: string; // camelCase key for form data
  inputType: PropertyInputType;
  section: string;
  unitSuffix?: string;
  required?: boolean;
}

export interface LegalValue {
  propertyName: string;
  allowedValue: string;
}

export const defaultProperties: PropertyDefinition[] = [
  // Colours section
  { name: "Colour #1", key: "colour1", inputType: "dropdown", section: "Colours" },
  { name: "Colour #2", key: "colour2", inputType: "dropdown", section: "Colours" },

  // Optical section
  { name: "Beam Angle", key: "beamAngle", inputType: "dropdown", section: "Optical" },
  { name: "Colour Temp", key: "colourTemp", inputType: "dropdown", section: "Optical" },

  // Dimensions section
  { name: "Diameter (mm)", key: "diameter", inputType: "number", section: "Dimensions" },
  { name: "Height (mm)", key: "height", inputType: "number", section: "Dimensions" },
  { name: "Width (mm)", key: "width", inputType: "number", section: "Dimensions" },
  { name: "Depth (mm)", key: "depth", inputType: "number", section: "Dimensions" },
  { name: "Cutout Size (mm)", key: "cutoutSize", inputType: "number", section: "Dimensions" },

  // Materials section
  { name: "Material #1", key: "material1", inputType: "dropdown", section: "Materials" },
  { name: "Material #2", key: "material2", inputType: "dropdown", section: "Materials" },

  // Technical section
  { name: "Mounting", key: "mounting", inputType: "dropdown", section: "Technical" },
  { name: "IP Rating", key: "ipRating", inputType: "dropdown", section: "Technical" },
  { name: "Globe Type", key: "globeType", inputType: "dropdown", section: "Technical" },
  { name: "Dimmable", key: "dimmable", inputType: "dropdown", section: "Technical" },
  { name: "Low Voltage Options", key: "lowVoltageOptions", inputType: "text", section: "Technical" },
];

export const defaultLegalValues: LegalValue[] = [
  // Colour #1 / Colour #2
  { propertyName: "Colour #1", allowedValue: "White" },
  { propertyName: "Colour #1", allowedValue: "Black" },
  { propertyName: "Colour #1", allowedValue: "Silver" },
  { propertyName: "Colour #1", allowedValue: "Gold" },
  { propertyName: "Colour #1", allowedValue: "Bronze" },
  { propertyName: "Colour #1", allowedValue: "Copper" },
  { propertyName: "Colour #1", allowedValue: "Chrome" },
  { propertyName: "Colour #1", allowedValue: "Nickel" },
  { propertyName: "Colour #1", allowedValue: "Brass" },
  { propertyName: "Colour #1", allowedValue: "Natural" },
  { propertyName: "Colour #1", allowedValue: "Clear" },
  { propertyName: "Colour #1", allowedValue: "Frosted" },
  { propertyName: "Colour #2", allowedValue: "White" },
  { propertyName: "Colour #2", allowedValue: "Black" },
  { propertyName: "Colour #2", allowedValue: "Silver" },
  { propertyName: "Colour #2", allowedValue: "Gold" },
  { propertyName: "Colour #2", allowedValue: "Bronze" },
  { propertyName: "Colour #2", allowedValue: "Copper" },
  { propertyName: "Colour #2", allowedValue: "Chrome" },
  { propertyName: "Colour #2", allowedValue: "Nickel" },
  { propertyName: "Colour #2", allowedValue: "Brass" },
  { propertyName: "Colour #2", allowedValue: "Natural" },
  { propertyName: "Colour #2", allowedValue: "Clear" },
  { propertyName: "Colour #2", allowedValue: "Frosted" },

  // Beam Angle
  { propertyName: "Beam Angle", allowedValue: "15°" },
  { propertyName: "Beam Angle", allowedValue: "24°" },
  { propertyName: "Beam Angle", allowedValue: "36°" },
  { propertyName: "Beam Angle", allowedValue: "45°" },
  { propertyName: "Beam Angle", allowedValue: "60°" },
  { propertyName: "Beam Angle", allowedValue: "90°" },
  { propertyName: "Beam Angle", allowedValue: "120°" },
  { propertyName: "Beam Angle", allowedValue: "360°" },

  // Colour Temp
  { propertyName: "Colour Temp", allowedValue: "2700K" },
  { propertyName: "Colour Temp", allowedValue: "3000K" },
  { propertyName: "Colour Temp", allowedValue: "4000K" },
  { propertyName: "Colour Temp", allowedValue: "5000K" },
  { propertyName: "Colour Temp", allowedValue: "6000K" },
  { propertyName: "Colour Temp", allowedValue: "RGB" },
  { propertyName: "Colour Temp", allowedValue: "Tunable White" },

  // Material
  { propertyName: "Material #1", allowedValue: "Aluminium" },
  { propertyName: "Material #1", allowedValue: "Steel" },
  { propertyName: "Material #1", allowedValue: "Stainless Steel" },
  { propertyName: "Material #1", allowedValue: "Plastic" },
  { propertyName: "Material #1", allowedValue: "Glass" },
  { propertyName: "Material #1", allowedValue: "Acrylic" },
  { propertyName: "Material #1", allowedValue: "Wood" },
  { propertyName: "Material #1", allowedValue: "Fabric" },
  { propertyName: "Material #1", allowedValue: "Ceramic" },
  { propertyName: "Material #1", allowedValue: "Concrete" },
  { propertyName: "Material #2", allowedValue: "Aluminium" },
  { propertyName: "Material #2", allowedValue: "Steel" },
  { propertyName: "Material #2", allowedValue: "Stainless Steel" },
  { propertyName: "Material #2", allowedValue: "Plastic" },
  { propertyName: "Material #2", allowedValue: "Glass" },
  { propertyName: "Material #2", allowedValue: "Acrylic" },
  { propertyName: "Material #2", allowedValue: "Wood" },
  { propertyName: "Material #2", allowedValue: "Fabric" },
  { propertyName: "Material #2", allowedValue: "Ceramic" },
  { propertyName: "Material #2", allowedValue: "Concrete" },

  // Mounting
  { propertyName: "Mounting", allowedValue: "Surface Mount" },
  { propertyName: "Mounting", allowedValue: "Recessed" },
  { propertyName: "Mounting", allowedValue: "Pendant" },
  { propertyName: "Mounting", allowedValue: "Track" },
  { propertyName: "Mounting", allowedValue: "Wall Mount" },
  { propertyName: "Mounting", allowedValue: "Pole Mount" },
  { propertyName: "Mounting", allowedValue: "Ground Spike" },
  { propertyName: "Mounting", allowedValue: "Flush Mount" },

  // IP Rating
  { propertyName: "IP Rating", allowedValue: "IP20" },
  { propertyName: "IP Rating", allowedValue: "IP44" },
  { propertyName: "IP Rating", allowedValue: "IP54" },
  { propertyName: "IP Rating", allowedValue: "IP65" },
  { propertyName: "IP Rating", allowedValue: "IP66" },
  { propertyName: "IP Rating", allowedValue: "IP67" },
  { propertyName: "IP Rating", allowedValue: "IP68" },

  // Globe Type
  { propertyName: "Globe Type", allowedValue: "E27" },
  { propertyName: "Globe Type", allowedValue: "E14" },
  { propertyName: "Globe Type", allowedValue: "GU10" },
  { propertyName: "Globe Type", allowedValue: "GU5.3" },
  { propertyName: "Globe Type", allowedValue: "G9" },
  { propertyName: "Globe Type", allowedValue: "G4" },
  { propertyName: "Globe Type", allowedValue: "B22" },
  { propertyName: "Globe Type", allowedValue: "Integrated LED" },

  // Dimmable
  { propertyName: "Dimmable", allowedValue: "Yes" },
  { propertyName: "Dimmable", allowedValue: "No" },
  { propertyName: "Dimmable", allowedValue: "Trailing Edge" },
  { propertyName: "Dimmable", allowedValue: "Leading Edge" },
  { propertyName: "Dimmable", allowedValue: "0-10V" },
  { propertyName: "Dimmable", allowedValue: "DALI" },
];
