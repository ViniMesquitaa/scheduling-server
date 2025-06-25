const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const nome = faker.person.fullName();
  const email = "adminaccess25@exemplo.com";
  const senhaPlana = "Xy3$9!qRw#Zt7pVm";
  const senhaHash = await bcrypt.hash(senhaPlana, 10);
  const precisaRedefinir = true;

  const adminExistente = await prisma.admin.findUnique({
    where: { email }
  });

  if (!adminExistente) {
    await prisma.admin.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        precisa_redefinir: precisaRedefinir 
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
