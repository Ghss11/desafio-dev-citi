const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const plantas = [
  { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 7 },
  { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 4590, estoque: 8, luminosidade: "SOMBRA", petFriendly: true, regaACadaDias: 2 },
  { nome: "Cacto", especie: "Cereus jamacaru", preco: 2500, estoque: 20, luminosidade: "SOL_PLENO", petFriendly: true, regaACadaDias: 15 },
  { nome: "Jiboia", especie: "Epipremnum aureum", preco: 3990, estoque: 5, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 5 },
  { nome: "Espada-de-são-jorge", especie: "Dracaena trifasciata", preco: 5990, estoque: 0, luminosidade: "SOL_PLENO", petFriendly: false, regaACadaDias: 10 },
  { nome: "Calathea", especie: "Goeppertia makoyana", preco: 6490, estoque: 3, luminosidade: "SOMBRA", petFriendly: true, regaACadaDias: 3 },
];

async function main() {
  const quantidade = await prisma.planta.count();

  if (quantidade > 0) {
    console.log(`O banco já tem ${quantidade} plantas. O seed não foi executado, para não duplicar dados.`);
    return;
  }

  await prisma.planta.createMany({ data: plantas });
  console.log(`${plantas.length} plantas de exemplo cadastradas.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
