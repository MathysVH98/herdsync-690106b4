import { useState } from "react";
import { Layout } from "@/components/Layout";
import { LivestockCard, Animal, AnimalStatus } from "@/components/LivestockCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { mockAnimals } from "@/data/mockData";
import { Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusOptions: AnimalStatus[] = ["Healthy", "Under Observation", "Sick", "Pregnant"];
const typeOptions = ["Cattle", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Horse"];

export default function Livestock() {
  const [animals, setAnimals] = useState<Animal[]>(mockAnimals);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newAnimal, setNewAnimal] = useState({
    name: "",
    type: "",
    breed: "",
    tag: "",
    age: "",
    weight: "",
    status: "Healthy" as AnimalStatus,
    feedType: "",
  });

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch = 
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || animal.status === filterStatus;
    const matchesType = filterType === "all" || animal.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddAnimal = () => {
    if (!newAnimal.name || !newAnimal.type || !newAnimal.tag) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least name, type, and tag.",
        variant: "destructive",
      });
      return;
    }

    const animal: Animal = {
      id: Date.now().toString(),
      ...newAnimal,
      lastFed: "Not yet fed",
    };

    setAnimals([animal, ...animals]);
    setNewAnimal({
      name: "",
      type: "",
      breed: "",
      tag: "",
      age: "",
      weight: "",
      status: "Healthy",
      feedType: "",
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Animal Added",
      description: `${animal.name} has been added to your livestock.`,
    });
  };

  const handleFeed = (id: string) => {
    const animal = animals.find((a) => a.id === id);
    toast({
      title: "Feeding Recorded",
      description: `${animal?.name} has been fed.`,
    });
  };

  const handleRemove = (id: string) => {
    const animal = animals.find((a) => a.id === id);
    setAnimals(animals.filter((a) => a.id !== id));
    toast({
      title: "Animal Removed",
      description: `${animal?.name} has been removed from your livestock.`,
    });
  };

  const statusCounts = {
    all: animals.length,
    Healthy: animals.filter((a) => a.status === "Healthy").length,
    "Under Observation": animals.filter((a) => a.status === "Under Observation").length,
    Sick: animals.filter((a) => a.status === "Sick").length,
    Pregnant: animals.filter((a) => a.status === "Pregnant").length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              Livestock Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all your farm animals in one place
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground glow-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add Animal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Animal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newAnimal.name}
                      onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                      placeholder="e.g., Bessie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag">Tag Number</Label>
                    <Input
                      id="tag"
                      value={newAnimal.tag}
                      onChange={(e) => setNewAnimal({ ...newAnimal, tag: e.target.value })}
                      placeholder="e.g., C001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Animal Type</Label>
                    <Select value={newAnimal.type} onValueChange={(v) => setNewAnimal({ ...newAnimal, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="breed">Breed</Label>
                    <Input
                      id="breed"
                      value={newAnimal.breed}
                      onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                      placeholder="e.g., Holstein"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      value={newAnimal.age}
                      onChange={(e) => setNewAnimal({ ...newAnimal, age: e.target.value })}
                      placeholder="e.g., 2 years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      value={newAnimal.weight}
                      onChange={(e) => setNewAnimal({ ...newAnimal, weight: e.target.value })}
                      placeholder="e.g., 500 kg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newAnimal.status} onValueChange={(v) => setNewAnimal({ ...newAnimal, status: v as AnimalStatus })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="feedType">Feed Type</Label>
                    <Input
                      id="feedType"
                      value={newAnimal.feedType}
                      onChange={(e) => setNewAnimal({ ...newAnimal, feedType: e.target.value })}
                      placeholder="e.g., Dairy Mix"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleAddAnimal} className="w-full bg-gradient-primary text-primary-foreground">
                Add Animal
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="card-elevated p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, tag, or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge 
              variant={filterStatus === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterStatus("all")}
            >
              All ({statusCounts.all})
            </Badge>
            <Badge 
              variant={filterStatus === "Healthy" ? "default" : "outline"}
              className="cursor-pointer badge-healthy"
              onClick={() => setFilterStatus("Healthy")}
            >
              Healthy ({statusCounts.Healthy})
            </Badge>
            <Badge 
              variant={filterStatus === "Under Observation" ? "default" : "outline"}
              className="cursor-pointer badge-observation"
              onClick={() => setFilterStatus("Under Observation")}
            >
              Under Observation ({statusCounts["Under Observation"]})
            </Badge>
            <Badge 
              variant={filterStatus === "Sick" ? "default" : "outline"}
              className="cursor-pointer badge-sick"
              onClick={() => setFilterStatus("Sick")}
            >
              Sick ({statusCounts.Sick})
            </Badge>
            <Badge 
              variant={filterStatus === "Pregnant" ? "default" : "outline"}
              className="cursor-pointer badge-pregnant"
              onClick={() => setFilterStatus("Pregnant")}
            >
              Pregnant ({statusCounts.Pregnant})
            </Badge>
          </div>
        </div>

        {/* Animal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAnimals.map((animal) => (
            <LivestockCard
              key={animal.id}
              animal={animal}
              onFeed={handleFeed}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {filteredAnimals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No animals found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
