// Category hierarchy data structure
// Format: Choice 1 -> Choice 2 -> Choice 3 (optional)

export interface CategoryLevel {
  name: string;
  children?: CategoryLevel[];
}

export const categoryTree: CategoryLevel[] = [
  {
    name: "Indoor Lights",
    children: [
      {
        name: "Ceiling Lights",
        children: [
          { name: "Ceiling Spotlights" },
          { name: "Downlights" },
          { name: "Panel Lights" },
          { name: "Chandeliers" },
          { name: "Pendant Lights" },
          { name: "Flush Mounts" },
        ],
      },
      {
        name: "Wall Lights",
        children: [
          { name: "Wall Sconces" },
          { name: "Picture Lights" },
          { name: "Up/Down Lights" },
        ],
      },
      {
        name: "Floor Lamps",
        children: [
          { name: "Standing Lamps" },
          { name: "Arc Lamps" },
          { name: "Tripod Lamps" },
        ],
      },
      {
        name: "Table Lamps",
        children: [
          { name: "Desk Lamps" },
          { name: "Bedside Lamps" },
          { name: "Accent Lamps" },
        ],
      },
      {
        name: "Track Lighting",
      },
      {
        name: "Recessed Lighting",
      },
    ],
  },
  {
    name: "Outdoor Lights",
    children: [
      {
        name: "Garden Lights",
        children: [
          { name: "Path Lights" },
          { name: "Bollard Lights" },
          { name: "Spike Lights" },
          { name: "In-Ground Lights" },
        ],
      },
      {
        name: "Wall Lights",
        children: [
          { name: "Security Lights" },
          { name: "Porch Lights" },
          { name: "Step Lights" },
        ],
      },
      {
        name: "Flood Lights",
      },
      {
        name: "Post Lights",
      },
      {
        name: "String Lights",
      },
    ],
  },
  {
    name: "Commercial Lights",
    children: [
      {
        name: "Office Lighting",
        children: [
          { name: "Troffer Panels" },
          { name: "Linear Lights" },
          { name: "Task Lights" },
        ],
      },
      {
        name: "Retail Lighting",
        children: [
          { name: "Track Spotlights" },
          { name: "Display Lights" },
          { name: "Accent Lighting" },
        ],
      },
      {
        name: "Industrial Lighting",
        children: [
          { name: "High Bay Lights" },
          { name: "Low Bay Lights" },
          { name: "Warehouse Lights" },
        ],
      },
      {
        name: "Emergency Lighting",
      },
      {
        name: "Exit Signs",
      },
    ],
  },
  {
    name: "Decorative Lights",
    children: [
      {
        name: "LED Strip Lights",
        children: [
          { name: "RGB Strips" },
          { name: "Single Color Strips" },
          { name: "Smart Strips" },
        ],
      },
      {
        name: "Neon Signs",
      },
      {
        name: "Fairy Lights",
      },
      {
        name: "Novelty Lights",
      },
    ],
  },
  {
    name: "Smart Lighting",
    children: [
      {
        name: "Smart Bulbs",
        children: [
          { name: "WiFi Bulbs" },
          { name: "Zigbee Bulbs" },
          { name: "Bluetooth Bulbs" },
        ],
      },
      {
        name: "Smart Switches",
      },
      {
        name: "Smart Dimmers",
      },
      {
        name: "Smart Controllers",
      },
    ],
  },
  {
    name: "Bulbs & Globes",
    children: [
      {
        name: "LED Bulbs",
        children: [
          { name: "A-Shape" },
          { name: "Globe" },
          { name: "Candle" },
          { name: "Tube" },
          { name: "Reflector" },
        ],
      },
      {
        name: "Specialty Bulbs",
        children: [
          { name: "Vintage/Edison" },
          { name: "Coloured" },
          { name: "Dimmable" },
        ],
      },
      {
        name: "Halogen",
      },
      {
        name: "CFL",
      },
    ],
  },
  {
    name: "Accessories",
    children: [
      {
        name: "Drivers & Transformers",
      },
      {
        name: "Mounting Hardware",
      },
      {
        name: "Cables & Connectors",
      },
      {
        name: "Dimmers & Controls",
      },
    ],
  },
];

// Helper function to get Choice 2 options based on Choice 1
export function getChoice2Options(choice1: string): CategoryLevel[] {
  const level1 = categoryTree.find((cat) => cat.name === choice1);
  return level1?.children || [];
}

// Helper function to get Choice 3 options based on Choice 1 and Choice 2
export function getChoice3Options(choice1: string, choice2: string): CategoryLevel[] {
  const level1 = categoryTree.find((cat) => cat.name === choice1);
  const level2 = level1?.children?.find((cat) => cat.name === choice2);
  return level2?.children || [];
}

// Helper function to check if Choice 3 is applicable
export function hasChoice3(choice1: string, choice2: string): boolean {
  return getChoice3Options(choice1, choice2).length > 0;
}

// Build the final category path
export function buildCategoryPath(choice1: string, choice2: string, choice3?: string): string {
  if (!choice1) return "";
  if (!choice2) return choice1;
  if (!choice3 || !hasChoice3(choice1, choice2)) return `${choice1}/${choice2}`;
  return `${choice1}/${choice2}/${choice3}`;
}
