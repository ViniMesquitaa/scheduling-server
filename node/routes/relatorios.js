const express = require("express");
const router = express.Router();
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
router.get('/coletas-realizadas/:id', async (req, res) => {
 const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: Number(id) },
      include: {
        coletas: {
          where: {
            dia_realizado: { not: null },
            hora_realizado: { not: null }
          },
          select: {
            id_coleta: true,
            dia_realizado: true,
            horario_realizado: true,
            usuario: {
              select: {
                nome: true
              }
            }
          }
        },
        agendamentos: {
          where: {
            status: "REALIZADO"
          },
          select: {
            id_agendamento: true,
            dia_realizado: true,
            horario_realizado: true,
            status: true,
            usuario: {
              select: {
                nome: true
              }
            }
          }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.status(200).json({
      nome_cliente: cliente.nome_cliente,
      coletas_realizadas: cliente.coletas,
      agendamentos_realizados: cliente.agendamentos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar coletas realizadas' });
  }
});

//Rota 4: Agendamentos e Coletas Previstos para determinado período
router.get('/coletas-previstas', async (req, res) => {
  const { startDate, endDate, idZona} = req.query;

  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        status: "PENDENTE",
        dia_agendado: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        cliente: {
          endereco: {
            zona: {
              id_zona: Number(idZona)
            }
          }
        }
      },
      include: {
        id_agendamento: true,
        dia_agendado: true,
        turno_agendado: true,
        status: true,
        usuario: {
          select: {
            nome: true,
          },
        },
        cliente: {
          include: {
            endereco: true,
          },
        },
        zona: {
          select: {
            nome_da_zona: true,
          },
        },
      },
    });

    const zona = await prisma.zona.findUnique({
      where: { id: Number(idZona) }
    });

    if (!zona) {
      return res.status(404).json({ error: "Zona não encontrada" });
    }

    const diasJson = zona.dias;
    let diasSemana = [];
    if (typeof diasJson === "string") {
      diasSemana = diasJson.split(",").map(d => d.trim());
    } else if (diasJson.dias) {
      diasSemana = diasJson.dias.split(",").map(d => d.trim());
    }

    const datasPrevistas = gerarDatasPrevistas(diasSemana, dataInicio, dataFim);

    const datasColetasPrevistas = datasPrevistas.map(dt => dt.toISOString().split('T')[0])

    res.status(200).json({
      datas_coletas_previstas: datasColetasPrevistas,
      agendamentos_previstos: agendamentos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar coletas e agendamentos previstos' });
  }
});

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
