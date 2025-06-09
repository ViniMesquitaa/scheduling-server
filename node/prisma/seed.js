// const { PrismaClient } = require('@prisma/client');
// const { faker } = require('@faker-js/faker');
// const prisma = new PrismaClient();

// async function main() {
//   console.log(" Inserindo dados...");

//   // Criar zonas
//   const zonas = [];
//   for (let i = 0; i < 5; i++) {
//     const zona = await prisma.zona.create({
//       data: {
//         nome_da_zona: `Zona ${i + 1}`,
//         qtd_coletas_esperadas: faker.number.int({ min: 5, max: 20 }),
//         dias: JSON.stringify(["segunda", "quarta", "sexta"]),
//         cor: faker.color.rgb()
//       }
//     });
//     zonas.push(zona);
//   }

//   // Criar endereços
//   const enderecos = [];
//   for (let i = 0; i < 20; i++) {
//     const endereco = await prisma.endereco.create({
//       data: {
//         nome_rua: faker.location.street(),
//         numero: faker.string.numeric({ length: 3 }),
//         bairro: faker.location.city(),
//         id_zona: zonas[i % zonas.length].id
//       }
//     });
//     enderecos.push(endereco);
//   }

//   // Criar usuários
//   const usuarios = [];
//   for (let i = 0; i < 5; i++) {
//     const usuario = await prisma.usuario.create({
//       data: {
//         nome: faker.person.fullName(),
//         email: faker.internet.email(),
//         senha: faker.internet.password(),
//         tipo_usuario: "coletor"
//       }
//     });
//     usuarios.push(usuario);
//   }

//   // Criar clientes
//   const clientes = [];
//   for (let i = 0; i < 20; i++) {
//     const cliente = await prisma.cliente.create({
//       data: {
//         nome_cliente: faker.person.fullName(),
//         telefone_cliente: faker.phone.number(),
//         qr_code: faker.string.uuid(),
//         id_endereco: enderecos[i % enderecos.length].id_endereco
//       }
//     });
//     clientes.push(cliente);
//   }

//   // Criar agendamentos
//   for (let i = 0; i < 20; i++) {
//     await prisma.agendamento.create({
//       data: {
//         dia_agendado: faker.date.future(),
//         turno_agendado: ["manhã", "tarde", "noite"][i % 3],
//         observacoes: faker.lorem.sentence(),
//         id_cliente: clientes[i % clientes.length].id_cliente,
//         id_usuario: usuarios[i % usuarios.length].id_usuario,
//         id_zona: zonas[i % zonas.length].id
//       }
//     });
//   }

//   // Criar coletas
//   for (let i = 0; i < 20; i++) {
//     await prisma.coleta.create({
//       data: {
//         dia_realizado: faker.date.recent(),
//         horario_realizado: faker.date.anytime(),
//         id_cliente: clientes[i % clientes.length].id_cliente,
//         id_usuario: usuarios[i % usuarios.length].id_usuario
//       }
//     });
//   }

//   console.log("✅ Dados inseridos com sucesso!");
// }

// main()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
