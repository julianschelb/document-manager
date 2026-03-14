import { Document, Binder } from "../types";

// Placeholder colors for dummy thumbnails
const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];

function placeholderThumb(index: number): string {
  const color = colors[index % colors.length].replace("#", "");
  return `https://placehold.co/200x280/${color}/ffffff?text=Doc+${index + 1}`;
}

export const mockDocuments: Document[] = [
  {
    id: "r1",
    title: "Electricity Bill January 2024",
    dateAdded: "2024-01-15",
    tags: ["bills", "utilities", "electricity"],
    thumbnailUrl: "/sample-docs/electricity-bill-jan-2024-thumb.jpg",
    fileType: "pdf",
    fileSizeKb: 245,
  },
  {
    id: "r2",
    title: "Bank Statement Q1 2024",
    dateAdded: "2024-04-05",
    tags: ["finance", "bank"],
    thumbnailUrl: "/sample-docs/bank-statement-q1-2024-thumb.jpg",
    fileType: "pdf",
    fileSizeKb: 387,
  },
  {
    id: "r3",
    title: "Health Insurance Policy",
    dateAdded: "2024-01-10",
    tags: ["insurance", "health", "important"],
    thumbnailUrl: "/sample-docs/health-insurance-policy-thumb.jpg",
    fileType: "pdf",
    fileSizeKb: 1240,
  },
  {
    id: "r4",
    title: "Payslip March 2024",
    dateAdded: "2024-03-28",
    tags: ["finance", "work", "payslip"],
    thumbnailUrl: "/sample-docs/payslip-march-2024-thumb.jpg",
    fileType: "pdf",
    fileSizeKb: 198,
  },
  {
    id: "1",
    title: "Electricity Bill January 2024",
    dateAdded: "2024-01-15",
    tags: ["bills", "utilities", "electricity"],
    thumbnailUrl: placeholderThumb(0),
    fileType: "pdf",
    fileSizeKb: 245,
  },
  {
    id: "2",
    title: "Health Insurance Policy",
    dateAdded: "2024-01-10",
    tags: ["insurance", "health", "important"],
    thumbnailUrl: placeholderThumb(1),
    fileType: "pdf",
    fileSizeKb: 1240,
  },
  {
    id: "3",
    title: "Tax Return 2023",
    dateAdded: "2024-02-20",
    tags: ["taxes", "finance", "important"],
    thumbnailUrl: placeholderThumb(2),
    fileType: "xlsx",
    fileSizeKb: 890,
  },
  {
    id: "4",
    title: "Apartment Lease Agreement",
    dateAdded: "2023-06-01",
    tags: ["housing", "contracts", "important"],
    thumbnailUrl: placeholderThumb(3),
    fileType: "docx",
    fileSizeKb: 2100,
  },
  {
    id: "5",
    title: "Car Insurance Certificate",
    dateAdded: "2024-03-01",
    tags: ["insurance", "car", "important"],
    thumbnailUrl: placeholderThumb(4),
    fileType: "jpg",
    fileSizeKb: 3400,
  },
  {
    id: "6",
    title: "Phone Bill February 2024",
    dateAdded: "2024-02-18",
    tags: ["bills", "utilities", "phone"],
    thumbnailUrl: placeholderThumb(5),
    fileType: "pdf",
    fileSizeKb: 156,
  },
  {
    id: "7",
    title: "Bank Statement Q1 2024",
    dateAdded: "2024-04-05",
    tags: ["finance", "bank"],
    thumbnailUrl: placeholderThumb(0),
    fileType: "pdf",
    fileSizeKb: 387,
  },
  {
    id: "8",
    title: "Vaccination Certificate",
    dateAdded: "2023-08-12",
    tags: ["health", "medical"],
    thumbnailUrl: placeholderThumb(1),
    fileType: "jpg",
    fileSizeKb: 4200,
  },
  {
    id: "9",
    title: "Internet Contract",
    dateAdded: "2023-09-20",
    tags: ["contracts", "utilities", "internet"],
    thumbnailUrl: placeholderThumb(2),
    fileType: "docx",
    fileSizeKb: 1800,
  },
  {
    id: "10",
    title: "Payslip March 2024",
    dateAdded: "2024-03-28",
    tags: ["finance", "work", "payslip"],
    thumbnailUrl: placeholderThumb(3),
    fileType: "pdf",
    fileSizeKb: 198,
  },
];

export function getAllTags(documents: Document[]): string[] {
  const tagSet = new Set<string>();
  documents.forEach((doc) => doc.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

export const mockBinders: Binder[] = [
  {
    id: "b1",
    name: "Insurance",
    color: "#2d6a9f",
    filterTags: ["insurance"],
  },
  {
    id: "b2",
    name: "Bills & Utilities",
    color: "#c0392b",
    filterTags: ["bills", "utilities"],
  },
  {
    id: "b3",
    name: "Finance",
    color: "#27ae60",
    filterTags: ["finance", "taxes", "bank"],
  },
  {
    id: "b4",
    name: "Health",
    color: "#8e44ad",
    filterTags: ["health", "medical"],
  },
  {
    id: "b5",
    name: "Housing & Contracts",
    color: "#d35400",
    filterTags: ["housing", "contracts"],
  },
];

export function getBinderDocuments(
  binder: Binder,
  documents: Document[]
): Document[] {
  return documents.filter((doc) =>
    doc.tags.some((tag) => binder.filterTags.includes(tag))
  );
}
