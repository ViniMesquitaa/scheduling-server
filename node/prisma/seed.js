const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const nome = faker.person.fullName();
  const email = "admin@exemplo.com";
  const senhaPlana = "123456";
  const senhaHash = await bcrypt.hash(senhaPlana, 10);

  const adminExistente = await prisma.admin.findUnique({
    where: { email }
  });

  if (!adminExistente) {
    await prisma.admin.create({
      data: {
        nome,
        email,
        senha: senhaHash,
      }
    });
    console.log("Usuário admin criado com sucesso!");
  } else {
    console.log("Usuário admin já existe.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
