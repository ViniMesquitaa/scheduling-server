function montarFiltros({ nomeCliente, startDate, endDate, zonaId }) {
  let filtroColeta = {};
  let filtroAgendamento = { status: "REALIZADO" };

  if (startDate && endDate) {
    const start = new Date(`${startDate}T03:00:00Z`);
    const end = new Date(`${endDate}T02:59:59Z`);

    filtroColeta.dia_realizado = {
      gte: start,
      lte: end,
    };
    filtroAgendamento.dia_realizado = {
      gte: start,
      lte: end,
    };
  }

  if (zonaId) {
    filtroColeta.cliente = {
      ...(filtroColeta.cliente || {}),
      endereco: { zona: { id: zonaId } }, 
    };
    filtroAgendamento.cliente = {
      ...(filtroAgendamento.cliente || {}),
      endereco: { zona: { id: zonaId } },
    };
  }

  if (nomeCliente) {
    filtroColeta.cliente = {
      is: {
        nome_cliente: {
          contains: nomeCliente,
        },
      },
    };
    filtroAgendamento.cliente = {
      is: {
        nome_cliente: {
          contains: nomeCliente,
        },
      },
    };
  }

  return { filtroColeta, filtroAgendamento };
}

function agruparPorCliente(coletas, agendamentos) {
  const clientesMap = {};
  coletas.forEach((coleta) => {
    const id = coleta.cliente.id_cliente;
    if (!clientesMap[id]) {
      clientesMap[id] = {
        nome_cliente: coleta.cliente.nome_cliente,
        zona: coleta.cliente.endereco?.zona?.nome_da_zona || "Não definida",
        realizadas: 0,
        dias_realizados: new Set(),
      };
    }
    clientesMap[id].realizadas += 1;
    if (coleta.dia_realizado)
      clientesMap[id].dias_realizados.add(
        coleta.dia_realizado.toISOString().split("T")[0]
      );
  });
  agendamentos.forEach((agendamento) => {
    const id = agendamento.cliente.id_cliente;
    if (!clientesMap[id]) {
      clientesMap[id] = {
        nome_cliente: agendamento.cliente.nome_cliente,
        zona:
          agendamento.cliente.endereco?.zona?.nome_da_zona || "Não definida",
        realizadas: 0,
        dias_realizados: new Set(),
      };
    }
    clientesMap[id].realizadas += 1;
    if (agendamento.dia_realizado)
      clientesMap[id].dias_realizados.add(
        agendamento.dia_realizado.toISOString().split("T")[0]
      );
  });
  return Object.values(clientesMap).map((cliente) => ({
    nome_cliente: cliente.nome_cliente,
    zona: cliente.zona,
    realizadas: cliente.realizadas,
    dias_realizados: Array.from(cliente.dias_realizados),
  }));
}

module.exports = {
  montarFiltros,
  agruparPorCliente,
};