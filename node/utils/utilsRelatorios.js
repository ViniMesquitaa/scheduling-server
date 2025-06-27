function montarFiltros({ nomeCliente, startDate, endDate, zonaId, status }) {
  let filtroColeta = {};
  let filtroAgendamento = {};

  if (status) {
    // Se for string simples (ex: "PENDENTE" ou "REALIZADO")
    if (typeof status === "string") {
      filtroAgendamento.status = status;
    }
    // Se for objeto (ex: { not: "CANCELADO" } ou { in: ["PENDENTE", "REALIZADO"] })
    else if (typeof status === "object") {
      filtroAgendamento.status = status;
    }
  }

  if (filtroAgendamento.status === "REALIZADO" || 
      (filtroAgendamento.status?.in && filtroAgendamento.status.in.includes("REALIZADO")) || 
      (filtroAgendamento.status?.not)) {
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
  }

  if (filtroAgendamento.status === "PENDENTE" || 
      (filtroAgendamento.status?.in && filtroAgendamento.status.in.includes("PENDENTE")) || 
      (filtroAgendamento.status?.not)) {
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59Z`);
      filtroAgendamento.dia_agendado = {
        lte: end,
      };
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
    filtroColeta.cliente = {
      is: {
        nome_cliente: {
          contains: nomeCliente,
        },
      },
    };
    if (filtroAgendamento.status === "REALIZADO") {
      filtroAgendamento.cliente = {
        is: {
          nome_cliente: {
            contains: nomeCliente,
          },
        },
      };
    } else {
      filtroAgendamento.cliente = {
        nome_cliente: {
          contains: nomeCliente,
        },
      };
    }
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
  return clientes
    .map((cliente) => {
      const zona = cliente.endereco?.zona;
      const diasSemana = parseDias(zona?.dias?.dias || zona?.dias);

      // Pega o agendamento mais recente do cliente até o fim do mês selecionado
      const agendamentosCliente = agendamentos.filter(
        (a) => a.cliente.id_cliente === cliente.id_cliente
      );

      if (agendamentosCliente.length === 0) return null;

      // Para cada cliente, pega o agendamento mais recente (o maior dia_agendado) antes ou igual ao fim do mês
      const dataAgendamentoMaisRecente = agendamentosCliente
        .map((a) => a.dia_agendado)
        .sort((a, b) => b - a)[0];

      // Gerar datas previstas a partir da data do agendamento mais recente até o fim do mês selecionado
      const datasColetasPrevistas =
        diasSemana.length > 0
          ? gerarDatasPrevistas(diasSemana, dataAgendamentoMaisRecente, dataFim)
          : [];

      // Unifica as datas das coletas previstas + agendamentos (que sejam >= data do agendamento)
      const datasUnificadasSet = new Set([
        ...datasColetasPrevistas.map((d) => d.toISOString().split("T")[0]),
        ...agendamentosCliente
          .map((a) => a.dia_agendado.toISOString().split("T")[0])
          .filter((d) => {
            return new Date(d) >= dataAgendamentoMaisRecente;
          }),
      ]);

      const total_previstos = datasUnificadasSet.size;

      if (total_previstos === 0) return null;

      return {
        nome_cliente: cliente.nome_cliente,
        zona: zona?.nome_da_zona || "Não definida",
        total_previstos,
        datas_previstas: Array.from(datasUnificadasSet).sort(),
      };
    })
    .filter(Boolean);
}

module.exports = {
  montarFiltros,
  agruparPorCliente,
  agruparPrevisoesPorCliente,
};
