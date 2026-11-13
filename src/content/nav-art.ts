import type { ArtImage } from "@/content/landing-art";

/**
 * The menu pictures, copied from src/content/models-manifest.json. The navbar is a client component on every public page,
 * so it must not import the whole manifest. tests/unit/models-manifest.test.ts fails if these drift from it.
 */
export const NAV_ART_SLUGS = {
  "text": "baby-dragon",
  "image": "black-hoodie",
  "images": "kitchen-units",
  "review": "robot-dog",
  "store": "blue-puffer-jacket",
  "game": "purple-dragon",
  "design": "geometry-only-gadget",
  "resources": "fantasy-tower"
} as const;

export const NAV_ART: Record<keyof typeof NAV_ART_SLUGS, ArtImage> = {
  text: {"src":"/models/baby-dragon/beauty-1600.webp","srcSmall":"/models/baby-dragon/beauty-800.webp","thumb":"/models/baby-dragon/beauty-240.webp","width":1325,"height":1105},
  image: {"src":"/models/black-hoodie/beauty-1600.webp","srcSmall":"/models/black-hoodie/beauty-800.webp","thumb":"/models/black-hoodie/beauty-240.webp","width":1503,"height":1400},
  images: {"src":"/models/kitchen-units/beauty-1600.webp","srcSmall":"/models/kitchen-units/beauty-800.webp","thumb":"/models/kitchen-units/beauty-240.webp","width":1487,"height":1357},
  review: {"src":"/models/robot-dog/beauty-1600.webp","srcSmall":"/models/robot-dog/beauty-800.webp","thumb":"/models/robot-dog/beauty-240.webp","width":1377,"height":1166},
  store: {"src":"/models/blue-puffer-jacket/beauty-1600.webp","srcSmall":"/models/blue-puffer-jacket/beauty-800.webp","thumb":"/models/blue-puffer-jacket/beauty-240.webp","width":1343,"height":1285},
  game: {"src":"/models/purple-dragon/beauty-1600.webp","srcSmall":"/models/purple-dragon/beauty-800.webp","thumb":"/models/purple-dragon/beauty-240.webp","width":1348,"height":1013},
  design: {"src":"/models/geometry-only-gadget/beauty-1600.webp","srcSmall":"/models/geometry-only-gadget/beauty-800.webp","thumb":"/models/geometry-only-gadget/beauty-240.webp","width":1131,"height":815},
  resources: {"src":"/models/fantasy-tower/beauty-1600.webp","srcSmall":"/models/fantasy-tower/beauty-800.webp","thumb":"/models/fantasy-tower/beauty-240.webp","width":1457,"height":1544},
};
