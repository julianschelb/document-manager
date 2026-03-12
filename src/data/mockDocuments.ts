import { Document } from "../types";

// Placeholder colors for dummy thumbnails
const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];

function placeholderThumb(index: number): string {
  const color = colors[index % colors.length].replace("#", "");
  return `https://placehold.co/200x280/${color}/ffffff?text=Doc+${index + 1}`;
}

export const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Electricity Bill January 2024",
    dateAdded: "2024-01-15",
    tags: ["bills", "utilities", "electricity"],
    thumbnailUrl: placeholderThumb(0),
  },
  {
    id: "2",
    title: "Health Insurance Policy",
    dateAdded: "2024-01-10",
    tags: ["insurance", "health", "important"],
    thumbnailUrl: placeholderThumb(1),
  },
  {
    id: "3",
    title: "Tax Return 2023",
    dateAdded: "2024-02-20",
    tags: ["taxes", "finance", "important"],
    thumbnailUrl: placeholderThumb(2),
  },
  {
    id: "4",
    title: "Apartment Lease Agreement",
    dateAdded: "2023-06-01",
    tags: ["housing", "contracts", "important"],
    thumbnailUrl: placeholderThumb(3),
  },
  {
    id: "5",
    title: "Car Insurance Certificate",
    dateAdded: "2024-03-01",
    tags: ["insurance", "car", "important"],
    thumbnailUrl: placeholderThumb(4),
  },
  {
    id: "6",
    title: "Phone Bill February 2024",
    dateAdded: "2024-02-18",
    tags: ["bills", "utilities", "phone"],
    thumbnailUrl: placeholderThumb(5),
  },
  {
    id: "7",
    title: "Bank Statement Q1 2024",
    dateAdded: "2024-04-05",
    tags: ["finance", "bank"],
    thumbnailUrl: placeholderThumb(0),
  },
  {
    id: "8",
    title: "Vaccination Certificate",
    dateAdded: "2023-08-12",
    tags: ["health", "medical"],
    thumbnailUrl: placeholderThumb(1),
  },
  {
    id: "9",
    title: "Internet Contract",
    dateAdded: "2023-09-20",
    tags: ["contracts", "utilities", "internet"],
    thumbnailUrl: placeholderThumb(2),
  },
  {
    id: "10",
    title: "Payslip March 2024",
    dateAdded: "2024-03-28",
    tags: ["finance", "work", "payslip"],
    thumbnailUrl: placeholderThumb(3),
  },
];

export function getAllTags(documents: Document[]): string[] {
  const tagSet = new Set<string>();
  documents.forEach((doc) => doc.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
