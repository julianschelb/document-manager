const tagColors: Record<string, { bg: string; text: string }> = {
  bills: { bg: "#fee2e2", text: "#dc2626" },
  utilities: { bg: "#fef3c7", text: "#d97706" },
  electricity: { bg: "#fef9c3", text: "#ca8a04" },
  insurance: { bg: "#dbeafe", text: "#2563eb" },
  health: { bg: "#dcfce7", text: "#16a34a" },
  important: { bg: "#fce7f3", text: "#db2777" },
  taxes: { bg: "#f3e8ff", text: "#9333ea" },
  finance: { bg: "#e0e7ff", text: "#4f46e5" },
  housing: { bg: "#ffedd5", text: "#ea580c" },
  contracts: { bg: "#cffafe", text: "#0891b2" },
  car: { bg: "#fed7aa", text: "#c2410c" },
  phone: { bg: "#d1fae5", text: "#059669" },
  bank: { bg: "#e0f2fe", text: "#0284c7" },
  medical: { bg: "#fae8ff", text: "#c026d3" },
  internet: { bg: "#ccfbf1", text: "#0d9488" },
  work: { bg: "#fef08a", text: "#a16207" },
  payslip: { bg: "#fbcfe8", text: "#be185d" },
};

const defaultColor = { bg: "#f3f4f6", text: "#4b5563" };

export function getTagColor(tag: string): { bg: string; text: string } {
  return tagColors[tag] || defaultColor;
}
