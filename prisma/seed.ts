import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_STATIONS = [
  { codigo: "0001", nombre: "Dock Sud", concesionario: "AUBASA" },
  { codigo: "0002", nombre: "Quilmes", concesionario: "AUBASA" },
  { codigo: "0003", nombre: "Berazategui", concesionario: "AUBASA" },
  { codigo: "0004", nombre: "Hudson", concesionario: "AUBASA" },
  { codigo: "0005", nombre: "Bernal", concesionario: "AUBASA" },
  { codigo: "0020", nombre: "Samborombon", concesionario: "AUBASA" },
  { codigo: "0024", nombre: "Mar Chiquita", concesionario: "AUBASA" },
  { codigo: "0091", nombre: "Riccheri", concesionario: "CORREDORES_VIALES" },
];

async function main() {
  for (const s of SEED_STATIONS) {
    await prisma.estacion.upsert({
      where: { codigo: s.codigo },
      update: {},
      create: s,
    });
  }
  console.log(`Seeded ${SEED_STATIONS.length} stations`);
}

main()
  .finally(() => prisma.$disconnect());
