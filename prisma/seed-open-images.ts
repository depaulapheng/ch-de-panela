import { PrismaClient } from "@prisma/client";
import { giftFallbackBathroom, giftFallbackCleaning, giftFallbackHome, giftFallbackKitchen } from "../lib/generated-images";

const prisma = new PrismaClient();


const manualImages: Record<string, {
  imageUrl: string;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string;
}> = {
  "Jogo de colheres de silicone": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Silicone%20ladles.jpeg?width=960",
    imageCredit: null,
    imageLicense: "Public domain",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Silicone_ladles.jpeg"
  },
  "Espátula": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kitchen-spatula.jpg?width=960",
    imageCredit: "Evan-Amos",
    imageLicense: "Public domain",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Kitchen-spatula.jpg"
  },
  "Concha": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Soup%20Ladle%20by%20James%20Walker%20-%20James%20Walker%20-%20ABDAG001389.jpg?width=960",
    imageCredit: null,
    imageLicense: "Public domain",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Soup_Ladle_by_James_Walker_-_James_Walker_-_ABDAG001389.jpg"
  },
  "Pegador de macarrão": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Goodcook_Grey_Spaghetti_Spoon_%2853504577283%29.jpg/960px-Goodcook_Grey_Spaghetti_Spoon_%2853504577283%29.jpg",
    imageCredit: null,
    imageLicense: null,
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Goodcook_Grey_Spaghetti_Spoon_(53504577283).jpg"
  },
  "Abridor de latas": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kitchen-Classic-Can-Opener.jpg?width=960",
    imageCredit: "Evan-Amos",
    imageLicense: "Public domain",
        imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Kitchen-Classic-Can-Opener.jpg"
