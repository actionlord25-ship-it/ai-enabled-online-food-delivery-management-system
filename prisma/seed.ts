import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type MenuSeed = {
  name: string;
  description: string;
  priceCents: number;
  category: string;
  tags: string;
};

type RestaurantSeed = {
  name: string;
  cuisine: string;
  description: string;
  imageEmoji: string;
  rating: number;
  prepMinutes: number;
  distanceKm: number;
  menu: MenuSeed[];
};

const restaurants: RestaurantSeed[] = [
  {
    name: "Nairobi Nyama Grill",
    cuisine: "Kenyan",
    description: "Charcoal grilled meats, ugali and kachumbari.",
    imageEmoji: "🔥",
    rating: 4.7,
    prepMinutes: 25,
    distanceKm: 2.4,
    menu: [
      { name: "Nyama Choma Platter", description: "Grilled goat with kachumbari", priceCents: 1450, category: "Mains", tags: "grill,protein" },
      { name: "Ugali & Sukuma", description: "Maize meal with collard greens", priceCents: 550, category: "Mains", tags: "vegetarian" },
      { name: "Mutura Skewers", description: "Spiced sausage skewers", priceCents: 700, category: "Starters", tags: "spicy" },
      { name: "Dawa Cocktail", description: "Honey, lime and ginger", priceCents: 480, category: "Drinks", tags: "sweet" },
    ],
  },
  {
    name: "Bella Napoli",
    cuisine: "Italian",
    description: "Wood fired pizza and fresh pasta.",
    imageEmoji: "🍕",
    rating: 4.5,
    prepMinutes: 18,
    distanceKm: 1.2,
    menu: [
      { name: "Margherita Pizza", description: "San Marzano, mozzarella, basil", priceCents: 1200, category: "Mains", tags: "vegetarian" },
      { name: "Diavola Pizza", description: "Spicy salami and chilli", priceCents: 1400, category: "Mains", tags: "spicy" },
      { name: "Carbonara", description: "Guanciale, pecorino, egg", priceCents: 1350, category: "Mains", tags: "creamy" },
      { name: "Tiramisu", description: "Espresso soaked ladyfingers", priceCents: 600, category: "Desserts", tags: "sweet" },
    ],
  },
  {
    name: "Sakura Sushi Bar",
    cuisine: "Japanese",
    description: "Daily cut sashimi and hand rolls.",
    imageEmoji: "🍣",
    rating: 4.8,
    prepMinutes: 15,
    distanceKm: 4.1,
    menu: [
      { name: "Salmon Nigiri (6)", description: "Fresh Atlantic salmon", priceCents: 1600, category: "Mains", tags: "raw,protein" },
      { name: "Spicy Tuna Roll", description: "Tuna, chilli mayo, cucumber", priceCents: 1250, category: "Mains", tags: "spicy" },
      { name: "Miso Soup", description: "Tofu, wakame, scallion", priceCents: 400, category: "Starters", tags: "vegetarian,light" },
      { name: "Matcha Ice Cream", description: "Stone ground matcha", priceCents: 520, category: "Desserts", tags: "sweet" },
    ],
  },
  {
    name: "Green Bowl",
    cuisine: "Healthy",
    description: "Grain bowls, salads and cold pressed juice.",
    imageEmoji: "🥗",
    rating: 4.3,
    prepMinutes: 12,
    distanceKm: 0.9,
    menu: [
      { name: "Quinoa Power Bowl", description: "Quinoa, avocado, chickpeas", priceCents: 1100, category: "Mains", tags: "vegan,healthy" },
      { name: "Chicken Caesar", description: "Grilled chicken, parmesan", priceCents: 1150, category: "Mains", tags: "protein" },
      { name: "Green Juice", description: "Kale, apple, ginger", priceCents: 550, category: "Drinks", tags: "vegan,healthy" },
    ],
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@fooddash.test", name: "Ada Admin", password, role: "ADMIN" },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@fooddash.test",
      name: "Chris Customer",
      password,
      role: "CUSTOMER",
      address: "12 Riverside Drive, Nairobi",
    },
  });

  for (let index = 0; index < restaurants.length; index += 1) {
    const seed = restaurants[index];
    const vendor = await prisma.user.create({
      data: {
        email: `vendor${index + 1}@fooddash.test`,
        name: `${seed.name} Owner`,
        password,
        role: "VENDOR",
      },
    });

    await prisma.restaurant.create({
      data: {
        name: seed.name,
        cuisine: seed.cuisine,
        description: seed.description,
        imageEmoji: seed.imageEmoji,
        rating: seed.rating,
        prepMinutes: seed.prepMinutes,
        distanceKm: seed.distanceKm,
        ownerId: vendor.id,
        menuItems: { create: seed.menu },
      },
    });
  }

  const pizzeria = await prisma.restaurant.findFirstOrThrow({
    where: { name: "Bella Napoli" },
    include: { menuItems: true },
  });

  const margherita = pizzeria.menuItems[0];
  await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: pizzeria.id,
      status: "PREPARING",
      totalCents: margherita.priceCents * 2,
      address: customer.address ?? "12 Riverside Drive, Nairobi",
      etaMinutes: 32,
      etaReason: "18m prep + 4m kitchen queue (2 active) + 4m travel (1.2km)",
      items: {
        create: [{ menuItemId: margherita.id, quantity: 2, priceCents: margherita.priceCents }],
      },
    },
  });

  console.log(`Seeded ${restaurants.length} restaurants, admin ${admin.email}, customer ${customer.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
