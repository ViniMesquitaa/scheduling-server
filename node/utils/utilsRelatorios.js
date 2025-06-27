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
          nome_da_zona: item.cliente.endereco?.zona?.nome_da_zona || "Não definida",
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
  const mapaDias = {
    dom: 0,
    seg: 1,
    ter: 2,
    qua: 3,
    qui: 4,
    sex: 5,
    sab: 6,
  };

  const normalizar = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const diasNumeros = diasSemana
    .map((dia) => {
      const chave = normalizar(dia);
      return mapaDias[chave];
    })
    .filter((v) => v !== undefined);

  const datasPrevistas = [];
  let atual = new Date(dataInicio);

  while (atual <= dataFim) {
    const diaDaSemana = atual.getDay();
    if (diasNumeros.includes(diaDaSemana)) {
      const dataClone = new Date(atual);
      dataClone.setHours(0, 0, 0, 0);
      datasPrevistas.push(dataClone);
    }
    atual.setDate(atual.getDate() + 1);
  }

  return datasPrevistas;
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
function agruparPrevisoesPorCliente(clientes, agendamentos, dataInicio, dataFim) {
  return clientes.map((cliente) => {
    const zona = cliente.endereco?.zona;
    const diasSemana = parseDias(zona?.dias?.dias || zona?.dias || []);
    const agendamentosCliente = agendamentos.filter(
      (a) => a.cliente.id_cliente === cliente.id_cliente
    );

    // Separar os tipos
    const datasRealizadas = agendamentosCliente
      .filter((a) => a.status === "REALIZADO" && a.dia_realizado)
      .map((a) => a.dia_realizado.toISOString().split("T")[0]);

    const datasCanceladas = agendamentosCliente
      .filter((a) => a.status === "CANCELADO" && a.dia_agendado)
      .map((a) => a.dia_agendado.toISOString().split("T")[0]);

    const datasPendentes = agendamentosCliente
      .filter((a) => a.status === "PENDENTE" && a.dia_agendado)
      .map((a) => a.dia_agendado.toISOString().split("T")[0]);

    const datasPrevistas = gerarDatasPrevistas(diasSemana, dataInicio, dataFim)
      .map((d) => d.toISOString().split("T")[0]);

    return {
      nome_cliente: cliente.nome_cliente,
      zona: zona?.nome_da_zona || "Não definida",
      cor: zona?.cor || "default",
      datas_previstas: datasPrevistas,
      datas_realizadas: datasRealizadas,
      datas_canceladas: datasCanceladas,
      datas_pendentes: datasPendentes,
    };
  });
}

module.exports = {
  montarFiltros,
  agruparPorCliente,
  agruparPrevisoesPorCliente,
};
