import cowImage from "@/assets/animals/cow.jpg";
import sheepImage from "@/assets/animals/sheep.jpg";
import goatImage from "@/assets/animals/goat.jpg";
import pigImage from "@/assets/animals/pig.jpg";
import chickenImage from "@/assets/animals/chicken.jpg";
import horseImage from "@/assets/animals/horse.jpg";

export const animalImages: Record<string, string> = {
  Cattle: cowImage,
  Sheep: sheepImage,
  Goat: goatImage,
  Pig: pigImage,
  Chicken: chickenImage,
  Horse: horseImage,
};

export function getAnimalImage(type: string): string {
  return animalImages[type] || cowImage;
}
