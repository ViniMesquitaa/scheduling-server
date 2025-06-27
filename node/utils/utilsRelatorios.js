function montarFiltros({ nomeCliente, startDate, endDate, zonaId, status }) {
  let filtroColeta = {};
  let filtroAgendamento = {};

  if (status) {
    filtroAgendamento.status = status;
  }

  const start = startDate ? new Date(`${startDate}T03:00:00Z`) : undefined;
  const end = endDate ? new Date(`${endDate}T02:59:59Z`) : undefined;

  if (Array.isArray(status) && status.includes("REALIZADO")) {
    if (start && end) {
      filtroColeta.dia_realizado = { gte: start, lte: end };
      filtroAgendamento.dia_realizado = { gte: start, lte: end };
    }
  }

  if (Array.isArray(status) && status.includes("PENDENTE")) {
    if (end) {
      filtroAgendamento.dia_agendado = { lte: end };
    }
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
    const nomeFiltro = {
      contains: nomeCliente,
    };

    filtroColeta.cliente = {
      is: { nome_cliente: nomeFiltro },
    };

    filtroAgendamento.cliente = {
      is: { nome_cliente: nomeFiltro },
    };
  }

  return { filtroColeta, filtroAgendamento };
}

function agruparPorCliente(coletas, agendamentos) {
  const clientesMap = {};

  const adicionarCliente = (item) => {
    const id = item.cliente.id_cliente;
    if (!clientesMap[id]) {
      clientesMap[id] = {
        nome_cliente: item.cliente.nome_cliente,
        zona: {
          nome_da_zona:
            item.cliente.endereco?.zona?.nome_da_zona || "Não definida",
          cor: item.cliente.endereco?.zona?.cor || "cinza",
        },
        realizadas: 0,
        dias_realizados: new Set(),
      };
    }
    clientesMap[id].realizadas += 1;
    if (item.dia_realizado)
      clientesMap[id].dias_realizados.add(
        item.dia_realizado.toISOString().split("T")[0]
      );
  };

  coletas.forEach(adicionarCliente);
  agendamentos.forEach(adicionarCliente);

  return Object.values(clientesMap).map((cliente) => ({
    nome_cliente: cliente.nome_cliente,
    zona: cliente.zona,
    realizadas: cliente.realizadas,
    dias_realizados: Array.from(cliente.dias_realizados),
  }));
}

function gerarDatasPrevistas(diasSemana, dataInicio, dataFim) {
  const datas = [];
  const data = new Date(dataInicio);

  while (data <= dataFim) {
    const diaSemana = data.getDay(); 
    if (diasSemana.includes(diaSemana)) {
      datas.push(new Date(data));
    }
    data.setDate(data.getDate() + 1);
  }

  return datas;
}

function parseDias(dias) {
  if (!dias) return [];

  if (Array.isArray(dias)) return dias;

  if (typeof dias === "string") {
    try {
      const parsed = JSON.parse(dias);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      console.warn("Falha ao parsear zona.dias:", dias);
    }
  }

  return [];
}

function agruparPrevisoesPorCliente(
  clientes,
  agendamentos,
  dataInicio,
  dataFim
) {
  return clientes.map((cliente) => {
    const zona = cliente.endereco?.zona;
    const diasSemana = parseDias(zona?.dias?.dias || zona?.dias);

    const agendamentosCliente = agendamentos.filter(
      (a) => a.cliente?.id_cliente === cliente.id_cliente
    );

    const realizadas = new Set();
    const canceladas = new Set();
    const pendentes = new Set();

    agendamentosCliente.forEach((ag) => {
      const data = ag.dia_agendado || ag.dia_realizado;
      if (!data) return;

      const dataStr = new Date(data).toISOString().split("T")[0];

      if (ag.status === "REALIZADO") realizadas.add(dataStr);
      else if (ag.status === "CANCELADO") canceladas.add(dataStr);
      else if (ag.status === "PENDENTE") pendentes.add(dataStr);
    });

    const datasPrevistas =
      diasSemana.length > 0
        ? gerarDatasPrevistas(diasSemana, dataInicio, dataFim)
        : [];

    const datasPrevistasStr = datasPrevistas.map(
      (d) => d.toISOString().split("T")[0]
    );

    const datasCompletas = new Set([
      ...datasPrevistasStr,
      ...realizadas,
      ...canceladas,
      ...pendentes,
    ]);

    return {
      nome_cliente: cliente.nome_cliente,
      zona: zona?.nome_da_zona || "Não definida",
      cor: zona?.cor || "cinza",
      datas_previstas: Array.from(datasCompletas).sort(),
      datas_realizadas: Array.from(realizadas),
      datas_canceladas: Array.from(canceladas),
      datas_pendentes: Array.from(pendentes),
      total_previstos: datasCompletas.size,
    };
  });
}

module.exports = {
  montarFiltros,
  agruparPorCliente,
  agruparPrevisoesPorCliente,
};
