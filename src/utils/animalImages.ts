import cowImage from "@/assets/animals/cow.jpg";
import sheepImage from "@/assets/animals/sheep.jpg";
import goatImage from "@/assets/animals/goat.jpg";
import pigImage from "@/assets/animals/pig.jpg";
import chickenImage from "@/assets/animals/chicken.jpg";
import horseImage from "@/assets/animals/horse.jpg";
// Wild/Game animals
import springbokImage from "@/assets/animals/springbok.jpg";
import kuduImage from "@/assets/animals/kudu.jpg";
import impalaImage from "@/assets/animals/impala.jpg";
import elandImage from "@/assets/animals/eland.jpg";
import wildebeestImage from "@/assets/animals/wildebeest.jpg";
import gemsbokImage from "@/assets/animals/gemsbok.jpg";
import zebraImage from "@/assets/animals/zebra.jpg";
import buffaloImage from "@/assets/animals/buffalo.jpg";
import nyalaImage from "@/assets/animals/nyala.jpg";
import warthogImage from "@/assets/animals/warthog.jpg";
import ostrichImage from "@/assets/animals/ostrich.jpg";
// Big 5
import lionImage from "@/assets/animals/lion.jpg";
import leopardImage from "@/assets/animals/leopard.jpg";
import elephantImage from "@/assets/animals/elephant.jpg";
import rhinoImage from "@/assets/animals/rhino.jpg";
// Other iconic wildlife
import giraffeImage from "@/assets/animals/giraffe.jpg";

export const animalImages: Record<string, string> = {
  // Domestic livestock
  Cattle: cowImage,
  Sheep: sheepImage,
  Goat: goatImage,
  Pig: pigImage,
  Chicken: chickenImage,
  Horse: horseImage,
  // Wild/Game animals
  Springbok: springbokImage,
  Kudu: kuduImage,
  Impala: impalaImage,
  Eland: elandImage,
  Wildebeest: wildebeestImage,
  Gemsbok: gemsbokImage,
  Zebra: zebraImage,
  Buffalo: buffaloImage,
  Nyala: nyalaImage,
  Warthog: warthogImage,
  Ostrich: ostrichImage,
  // Big 5
  Lion: lionImage,
  Leopard: leopardImage,
  Elephant: elephantImage,
  Rhino: rhinoImage,
  Giraffe: giraffeImage,
};

export function getAnimalImage(type: string): string {
  return animalImages[type] || cowImage;
}

// Organized animal type options for UI
export const domesticAnimalTypes = ["Cattle", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Horse"];
export const wildGameAnimalTypes = [
  // Big 5 first
  "Lion", "Leopard", "Elephant", "Rhino", "Buffalo",
  // Other game
  "Giraffe", "Springbok", "Kudu", "Impala", "Eland", "Wildebeest", "Gemsbok", "Zebra", "Nyala", "Warthog", "Ostrich"
];
export const allAnimalTypes = [...domesticAnimalTypes, ...wildGameAnimalTypes];
