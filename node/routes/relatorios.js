const express = require("express");
const router = express.Router();
const { montarFiltros, agruparPorCliente } = require("../utils/utilsRelatorios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Rota 1: Agendamentos Cancelados
router.get("/agendamentos-cancelados", async (req, res) => {
  const { startDate, endDate, nomeCliente } = req.query;

  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        status: "CANCELADO",
        dia_agendado: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        cliente: {
          nome_cliente: {
            contains: nomeCliente || "",
            mode: "insensitive",
          },
        },
      },
      include: {
        cliente: {
          include: {
            endereco: true,
          },
        },
        zona: true,
      },
    });

    const resultado = agendamentos.map((a) => ({
      id: a.id_agendamento,
      cliente: a.cliente.nome_cliente,
      data_agendada: a.dia_agendado,
      turno: a.turno_agendado,
      status: a.status,
      endereco: `${a.cliente.endereco.nome_rua}, ${a.cliente.endereco.numero}, ${a.cliente.endereco.bairro}`,
      zona: a.zona?.nome_da_zona || "Não atribuída",
      observacoes: a.observacoes || "",
    }));

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos cancelados" });
  }
});

// Rota 2: Coletas por Cliente
router.get("/coletas-por-cliente", async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const dados = await prisma.agendamento.groupBy({
      by: ["id_cliente"],
      where: {
        status: "REALIZADO",
        dia_agendado: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        _all: true,
      },
    });

    const resultado = await Promise.all(
      dados.map(async (item) => {
        const cliente = await prisma.cliente.findUnique({
          where: { id_cliente: item.id_cliente },
        });

        return {
          nome_cliente: cliente?.nome_cliente || "Cliente não encontrado",
          quantidade_de_coletas: item._count._all,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar coletas por cliente" });
  }
});

// Rota 3: Endpoint para coletas e agendamentos realizados por cliente
router.get('/coletas-realizadas', async (req, res) => {
  const { nomeCliente, nomeZona, startDate, endDate } = req.query;

  if (!nomeCliente && !nomeZona && !(startDate && endDate)) {
    return res.status(400).json({
      error: "Informe pelo menos um filtro: nomeCliente, nomeZona ou período (startDate e endDate)."
    });
  }

  try {
    // Monta filtros dinâmicos usando a função utilitária
    let zonaId = null;
    if (nomeZona) {
      const zona = await prisma.zona.findUnique({
        where: { nome_da_zona: nomeZona }
      });
      if (!zona) {
        return res.status(404).json({ error: 'Zona não encontrada' });
      }
      zonaId = zona.id;
    }

    const { filtroColeta, filtroAgendamento } = montarFiltros({
      nomeCliente,
      startDate,
      endDate,
      zonaId
    });

    // Busca coletas e agendamentos conforme os filtros
    const coletas = await prisma.coleta.findMany({
      where: filtroColeta,
      select: {
        id_coleta: true,
        dia_realizado: true,
        cliente: {
          select: {
            id_cliente: true,
            nome_cliente: true,
            endereco: {
              select: {
                zona: { select: { nome_da_zona: true } }
              }
            }
          }
        }
      }
    });

    const agendamentos = await prisma.agendamento.findMany({
      where: filtroAgendamento,
      select: {
        id_agendamento: true,
        dia_realizado: true,
        cliente: {
          select: {
            id_cliente: true,
            nome_cliente: true,
            endereco: {
              select: {
                zona: { select: { nome_da_zona: true } }
              }
            }
          }
        }
      }
    });

    // Usa a função utilitária para agrupar por cliente e montar o resultado final
    const resultado = agruparPorCliente(coletas, agendamentos);

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar coletas realizadas" });
  }
});

router.get('/coletas-previstas', async (req, res) => {
  const { nomeCliente, nomeZona, startDate, endDate } = req.query;

  // Validação do período obrigatório
  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Informe o período (startDate e endDate)." });
  }
  const dataInicio = new Date(startDate);
  const dataFim = new Date(endDate);
  const diffEmMs = dataFim - dataInicio;
  const diffEmDias = diffEmMs / (1000 * 60 * 60 * 24);

  if (diffEmDias > 31) {
    return res.status(400).json({ error: "O intervalo entre as datas não pode ultrapassar 31 dias." });
  }

  try {
    // 1. Buscar clientes conforme os filtros
    let clientesWhere = {};
    let zonas = [];

    if (nomeCliente) {
      clientesWhere.nome_cliente = { contains: nomeCliente, mode: "insensitive" };
    }
    if (nomeZona) {
      // Busca a zona pelo nome
      const zona = await prisma.zona.findUnique({ where: { nome_da_zona: nomeZona } });
      if (!zona) {
        return res.status(404).json({ error: "Zona não encontrada" });
      }
      zonas = [zona];
      clientesWhere.endereco = { zona: { id_zona: zona.id } };
    } else {
      // Se não filtrar por zona, busca todas as zonas
      zonas = await prisma.zona.findMany();
    }

    // Busca todos os clientes conforme os filtros
    const clientes = await prisma.cliente.findMany({
      where: clientesWhere,
      select: {
        id_cliente: true,
        nome_cliente: true,
        endereco: {
          select: {
            zona: { select: { id_zona: true, nome_da_zona: true, dias: true } }
          }
        }
      }
    });

    // 2. Buscar agendamentos previstos (status PENDENTE) para esses clientes
    let filtroAgendamento = {
      status: "PENDENTE",
      dia_agendado: {
        gte: dataInicio,
        lte: dataFim
      }
    };
    if (clientes.length > 0) {
      filtroAgendamento.id_cliente = { in: clientes.map(c => c.id_cliente) };
    } else if (nomeCliente || nomeZona) {
      // Se filtrou por cliente ou zona e não achou clientes, retorna vazio
      return res.status(200).json([]);
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: filtroAgendamento,
      select: {
        id_agendamento: true,
        dia_agendado: true,
        cliente: {
          select: {
            id_cliente: true,
            nome_cliente: true,
            endereco: {
              select: {
                zona: { select: { id_zona: true, nome_da_zona: true, dias: true } }
              }
            }
          }
        }
      }
    });

    // 3. Montar o resultado por cliente
    const resultado = clientes.map(cliente => {
      const zona = cliente.endereco?.zona;
      // Extrai os dias da semana da zona
      let diasSemana = [];
      if (zona && zona.dias) {
        if (typeof zona.dias === "string") {
          diasSemana = zona.dias.split(",").map(d => d.trim());
        } else if (zona.dias && zona.dias.dias) {
          diasSemana = zona.dias.dias.split(",").map(d => d.trim());
        }
      }
      // Gera as datas previstas de coleta para o cliente
      let datasColetasPrevistas = [];
      if (diasSemana.length > 0) {
        datasColetasPrevistas = gerarDatasPrevistas(diasSemana, dataInicio, dataFim)
          .map(dt => dt.toISOString().split('T')[0]);
      }
      // Dias de agendamentos previstos para o cliente
      const agendamentosCliente = agendamentos.filter(a => a.cliente.id_cliente === cliente.id_cliente);
      const datasAgendamentosPrevistos = agendamentosCliente.map(a => a.dia_agendado.toISOString().split('T')[0]);

      // Junta e remove duplicados das datas previstas (coleta + agendamento)
      const datasPrevistasUnicas = Array.from(new Set([...datasColetasPrevistas, ...datasAgendamentosPrevistos]));

      return {
        nome_cliente: cliente.nome_cliente,
        zona: zona?.nome_da_zona || "Não definida",
        total_previstos: datasPrevistasUnicas.length,
        datas_previstas: datasPrevistasUnicas.sort(), // ordena as datas
      };
    });

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar coletas e agendamentos previstos' });
  }
});

//Rota 4: Agendamentos e Coletas Previstos para determinado período
// router.get('/coletas-previstas', async (req, res) => {
//   const { startDate, endDate, idZona} = req.query;

//   const dataInicio = new Date(startDate);
//   const dataFim = new Date(endDate);
//   const diffEmMs = dataFim - dataInicio;
//   const diffEmDias = diffEmMs / (1000 * 60 * 60 * 24);
  
//   if (diffEmDias > 31) {
//     return res.status(400).json({ error: "O intervalo entre as datas não pode ultrapassar 31 dias." });
//   }

//   try {
//     const agendamentos = await prisma.agendamento.findMany({
//       where: {
//         status: "PENDENTE",
//         dia_agendado: {
//           gte: new Date(startDate),
//           lte: new Date(endDate),
//         },
//         cliente: {
//           endereco: {
//             zona: {
//               id_zona: Number(idZona)
//             }
//           }
//         }
//       },
//       include: {
//         id_agendamento: true,
//         dia_agendado: true,
//         turno_agendado: true,
//         status: true,
//         usuario: {
//           select: {
//             nome: true,
//           },
//         },
//         cliente: {
//           include: {
//             endereco: true,
//           },
//         },
//         zona: {
//           select: {
//             nome_da_zona: true,
//           },
//         },
//       },
//     });

//     const zona = await prisma.zona.findUnique({
//       where: { id: Number(idZona) }
//     });

//     if (!zona) {
//       return res.status(404).json({ error: "Zona não encontrada" });
//     }

//     const diasJson = zona.dias;
//     let diasSemana = [];
//     if (typeof diasJson === "string") {
//       diasSemana = diasJson.split(",").map(d => d.trim());
//     } else if (diasJson.dias) {
//       diasSemana = diasJson.dias.split(",").map(d => d.trim());
//     }

//     const datasPrevistas = gerarDatasPrevistas(diasSemana, dataInicio, dataFim);

//     const datasColetasPrevistas = datasPrevistas.map(dt => dt.toISOString().split('T')[0])

//     res.status(200).json({
//       datas_coletas_previstas: datasColetasPrevistas,
//       agendamentos_previstos: agendamentos
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Erro ao buscar coletas e agendamentos previstos' });
//   }
// });

function gerarDatasPrevistas(diasSemana, dataInicio, dataFim) {
  const mapaDias = {
    "Domingo": 0,
    "Segunda": 1,
    "Terça": 2,
    "Quarta": 3,
    "Quinta": 4,
    "Sexta": 5,
    "Sábado": 6
  };
  const diasNumeros = diasSemana.map(dia => mapaDias[dia]);
  let datasPrevistas = [];

  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    if (diasNumeros.includes(d.getDay())) {
      datasPrevistas.push(new Date(d));
    }
  }
  return datasPrevistas;
}

module.exports = router;ona: true,
//           },
//         },
//       },
//     });

//     const zona = await prisma.zona.findUnique({
//       where: { id: Number(idZona) }
//     });

//     if (!zona) {
//       return res.status(404).json({ error: "Zona não encontrada" });
//     }

//     const diasJson = zona.dias;
//     let diasSemana = [];
//     if (typeof diasJson === "string") {
//       diasSemana = diasJson.split(",").map(d => d.trim());
//     } else if (diasJson.dias) {
//       diasSemana = diasJson.dias.split(",").map(d => d.trim());
//     }

//     const datasPrevistas = gerarDatasPrevistas(diasSemana, dataInicio, dataFim);

//     const datasColetasPrevistas = datasPrevistas.map(dt => dt.toISOString().split('T')[0])

//     res.status(200).json({
//       datas_coletas_previstas: datasColetasPrevistas,
//       agendamentos_previstos: agendamentos
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Erro ao buscar coletas e agendamentos previstos' });
//   }
// });

function gerarDatasPrevistas(diasSemana, dataInicio, dataFim) {
  const mapaDias = {
    "Domingo": 0,
    "Segunda": 1,
    "Terça": 2,
    "Quarta": 3,
    "Quinta": 4,
    "Sexta": 5,
    "Sábado": 6
  };
  const diasNumeros = diasSemana.map(dia => mapaDias[dia]);
  let datasPrevistas = [];

  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    if (diasNumeros.includes(d.getDay())) {
      datasPrevistas.push(new Date(d));
    }
  }
  return datasPrevistas;
}

module.exports = router;