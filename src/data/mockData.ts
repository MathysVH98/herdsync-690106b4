import { Animal, AnimalStatus } from "@/components/LivestockCard";
import { FeedingItem } from "@/components/FeedingSchedule";
import { InventoryItem } from "@/components/InventoryTable";
import { HealthRecord, HealthRecordType } from "@/components/HealthRecordCard";
import { AlertItem } from "@/components/AlertCard";

export const mockAnimals: Animal[] = [
  {
    id: "1",
    name: "Bessie",
    type: "Cattle",
    breed: "Holstein Friesian",
    tag: "C001",
    age: "4 years",
    weight: "620 kg",
    status: "Healthy",
    lastFed: "Today, 06:00",
    feedType: "Dairy Cattle Mix",
  },
  {
    id: "2",
    name: "Duke",
    type: "Cattle",
    breed: "Angus",
    tag: "C002",
    age: "3 years",
    weight: "580 kg",
    status: "Healthy",
    lastFed: "Today, 06:00",
    feedType: "Beef Cattle Feed",
  },
  {
    id: "3",
    name: "Dolly",
    type: "Sheep",
    breed: "Merino",
    tag: "S001",
    age: "2 years",
    weight: "65 kg",
    status: "Pregnant",
    lastFed: "Today, 07:00",
    feedType: "Sheep Pellets",
  },
  {
    id: "4",
    name: "Billy",
    type: "Goat",
    breed: "Boer",
    tag: "G001",
    age: "18 months",
    weight: "45 kg",
    status: "Healthy",
    lastFed: "Today, 07:00",
    feedType: "Goat Mix",
  },
  {
    id: "5",
    name: "Rosie",
    type: "Pig",
    breed: "Large White",
    tag: "P001",
    age: "1 year",
    weight: "120 kg",
    status: "Under Observation",
    lastFed: "Today, 06:30",
    feedType: "Pig Grower",
  },
  {
    id: "6",
    name: "Clucky",
    type: "Chicken",
    breed: "Rhode Island Red",
    tag: "CH001",
    age: "8 months",
    weight: "3.2 kg",
    status: "Healthy",
    lastFed: "Today, 05:30",
    feedType: "Layer Mash",
  },
  {
    id: "7",
    name: "Thunder",
    type: "Horse",
    breed: "Thoroughbred",
    tag: "H001",
    age: "6 years",
    weight: "520 kg",
    status: "Sick",
    lastFed: "Today, 06:00",
    feedType: "Horse Cubes",
  },
  {
    id: "8",
    name: "Daisy",
    type: "Cattle",
    breed: "Jersey",
    tag: "C003",
    age: "5 years",
    weight: "450 kg",
    status: "Pregnant",
    lastFed: "Today, 06:00",
    feedType: "Dairy Cattle Mix",
  },
];

export const mockFeedingSchedule: FeedingItem[] = [
  { id: "1", animalType: "Cattle", feedType: "Dairy Cattle Mix + Hay", time: "06:00", period: "morning", notes: "Add calcium supplement for pregnant cows" },
  { id: "2", animalType: "Chickens", feedType: "Layer Mash", time: "05:30", period: "morning" },
  { id: "3", animalType: "Pigs", feedType: "Pig Grower + Kitchen Scraps", time: "06:30", period: "morning" },
  { id: "4", animalType: "Sheep & Goats", feedType: "Mixed Pellets + Fresh Grass", time: "07:00", period: "morning" },
  { id: "5", animalType: "Horses", feedType: "Horse Cubes + Oats", time: "06:00", period: "morning", notes: "Thunder on restricted diet" },
  { id: "6", animalType: "Cattle", feedType: "Silage + Minerals", time: "17:00", period: "evening" },
  { id: "7", animalType: "Chickens", feedType: "Grain Mix", time: "16:30", period: "evening" },
  { id: "8", animalType: "Pigs", feedType: "Pig Finisher", time: "17:00", period: "evening" },
  { id: "9", animalType: "Sheep & Goats", feedType: "Hay + Mineral Block", time: "17:30", period: "evening" },
  { id: "10", animalType: "Horses", feedType: "Hay + Carrots", time: "18:00", period: "evening" },
];

export const mockInventory: InventoryItem[] = [
  { id: "1", name: "Dairy Cattle Mix", type: "Cattle Feed", quantity: 450, unit: "kg", reorderLevel: 200, costPerUnit: 8.50, lastRestocked: "2024-01-15" },
  { id: "2", name: "Beef Cattle Feed", type: "Cattle Feed", quantity: 320, unit: "kg", reorderLevel: 150, costPerUnit: 7.80, lastRestocked: "2024-01-10" },
  { id: "3", name: "Layer Mash", type: "Poultry Feed", quantity: 80, unit: "kg", reorderLevel: 50, costPerUnit: 12.00, lastRestocked: "2024-01-18" },
  { id: "4", name: "Sheep Pellets", type: "Sheep Feed", quantity: 45, unit: "kg", reorderLevel: 60, costPerUnit: 9.20, lastRestocked: "2024-01-05" },
  { id: "5", name: "Goat Mix", type: "Goat Feed", quantity: 55, unit: "kg", reorderLevel: 40, costPerUnit: 10.50, lastRestocked: "2024-01-12" },
  { id: "6", name: "Pig Grower", type: "Pig Feed", quantity: 180, unit: "kg", reorderLevel: 100, costPerUnit: 11.00, lastRestocked: "2024-01-08" },
  { id: "7", name: "Horse Cubes", type: "Horse Feed", quantity: 25, unit: "kg", reorderLevel: 80, costPerUnit: 15.50, lastRestocked: "2024-01-02" },
  { id: "8", name: "Hay Bales", type: "Roughage", quantity: 120, unit: "bales", reorderLevel: 50, costPerUnit: 85.00, lastRestocked: "2024-01-20" },
  { id: "9", name: "Silage", type: "Roughage", quantity: 2000, unit: "kg", reorderLevel: 500, costPerUnit: 2.50, lastRestocked: "2024-01-01" },
  { id: "10", name: "Mineral Blocks", type: "Supplements", quantity: 8, unit: "blocks", reorderLevel: 10, costPerUnit: 120.00, lastRestocked: "2023-12-28" },
];

export const mockHealthRecords: HealthRecord[] = [
  { id: "1", animalId: "1", animalName: "Bessie", type: "Vaccination", date: "2024-01-15", provider: "Dr. Smith", notes: "Annual vaccination - Foot & Mouth", nextDue: "2025-01-15" },
  { id: "2", animalId: "3", animalName: "Dolly", type: "Pregnancy Check", date: "2024-01-18", provider: "Dr. van der Berg", notes: "Confirmed pregnant - 3 months along", nextDue: "2024-02-15" },
  { id: "3", animalId: "7", animalName: "Thunder", type: "Treatment", date: "2024-01-19", provider: "Dr. Smith", notes: "Treating for mild colic, on restricted diet" },
  { id: "4", animalId: "5", animalName: "Rosie", type: "Checkup", date: "2024-01-17", provider: "Dr. Nkosi", notes: "Slight lameness in front leg, monitoring" },
  { id: "5", animalId: "7", animalName: "Thunder", type: "Farrier Visit", date: "2024-01-10", provider: "Jake's Farrier Services", notes: "Full shoeing and hoof trim", nextDue: "2024-03-10" },
  { id: "6", animalId: "8", animalName: "Daisy", type: "Pregnancy Check", date: "2024-01-16", provider: "Dr. van der Berg", notes: "Confirmed pregnant - 5 months along" },
  { id: "7", animalId: "2", animalName: "Duke", type: "Vaccination", date: "2024-01-12", provider: "Dr. Smith", notes: "Blackleg vaccination", nextDue: "2025-01-12" },
  { id: "8", animalId: "6", animalName: "Clucky", type: "Checkup", date: "2024-01-14", provider: "Dr. Nkosi", notes: "Flock health check - all birds healthy" },
];

export const mockAlerts: AlertItem[] = [
  { id: "1", type: "danger", title: "Low Stock Alert", message: "Horse Cubes inventory critically low (25 kg remaining)", time: "2 hours ago" },
  { id: "2", type: "warning", title: "Reorder Required", message: "Sheep Pellets below reorder level (45/60 kg)", time: "4 hours ago" },
  { id: "3", type: "warning", title: "Mineral Blocks Low", message: "Only 8 blocks remaining, reorder level is 10", time: "6 hours ago" },
  { id: "4", type: "info", title: "Animal Under Observation", message: "Rosie (Pig) showing signs of lameness - daily monitoring required", time: "1 day ago" },
  { id: "5", type: "info", title: "Pregnant Animals", message: "2 animals due for pregnancy checkups this week", time: "1 day ago" },
  { id: "6", type: "danger", title: "Sick Animal", message: "Thunder (Horse) under treatment for colic", time: "2 days ago" },
];

export const getLivestockStats = () => {
  const total = mockAnimals.length;
  const healthy = mockAnimals.filter(a => a.status === "Healthy").length;
  const needsAttention = mockAnimals.filter(a => a.status === "Under Observation" || a.status === "Sick").length;
  const pregnant = mockAnimals.filter(a => a.status === "Pregnant").length;
  
  const byType = mockAnimals.reduce((acc, animal) => {
    acc[animal.type] = (acc[animal.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { total, healthy, needsAttention, pregnant, byType };
};

export const getLowStockItems = () => {
  return mockInventory.filter(item => item.quantity <= item.reorderLevel);
};
