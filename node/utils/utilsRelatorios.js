function montarFiltros({ nomeCliente, startDate, endDate, zonaId, status }) {
  let filtroColeta = {};
  let filtroAgendamento = {};

  if (status) {
    filtroAgendamento.status = status;
  }

  if(filtroAgendamento.status === "REALIZADO") {
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

  if(filtroAgendamento.status === "PENDENTE") {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T03:00:00Z`);
      const end = new Date(`${endDate}T02:59:59Z`);

      filtroAgendamento.dia_agendado = {
        gte: start,
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
    "dom": 0,
    "seg": 1,
    "ter": 2,
    "qua": 3,
    "qui": 4,
    "sex": 5,
    "sab": 6,
  };

  const normalizar = (str) => str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .toLowerCase();

  const diasNumeros = diasSemana.map(dia => {
    const chave = normalizar(dia);
    return mapaDias[chave];
  }).filter(v => v !== undefined);

  console.log("Dias da semana originais:", diasSemana);
  console.log("Dias da semana normalizados (números):", diasNumeros);

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

  console.log("Datas previstas geradas:", datasPrevistas.map(d => d.toISOString().split("T")[0]));

  return datasPrevistas;
}

function parseDias(dias) {
  if (!dias) return [];

  // Caso seja um array real:
  if (Array.isArray(dias)) return dias;

  // Caso seja uma string JSON serializada:
  if (typeof dias === "string") {
    try {
      const parsed = JSON.parse(dias);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      console.warn("Falha ao parsear zona.dias:", dias);
    }
  }

  // Caso não seja reconhecido:
  return [];
}

function agruparPrevisoesPorCliente(clientes, agendamentos, dataInicio, dataFim) {
  return clientes
    .map(cliente => {
      const zona = cliente.endereco?.zona;
      const diasSemana = parseDias(zona?.dias?.dias || zona?.dias);

      const datasColetasPrevistas = diasSemana.length > 0
        ? gerarDatasPrevistas(diasSemana, dataInicio, dataFim)
        : [];

      const agendamentosCliente = agendamentos.filter(a => a.cliente.id_cliente === cliente.id_cliente);

      console.log(`Cliente: ${cliente.nome_cliente}`);
      console.log(`  Zona: ${zona?.nome_da_zona}`);
      console.log(`  Dias da semana corrigidos:`, diasSemana);
      console.log(`  Coletas previstas (${datasColetasPrevistas.length}):`, datasColetasPrevistas.map(d => d.toISOString().split("T")[0]));
      console.log(`  Agendamentos (${agendamentosCliente.length}):`, agendamentosCliente.map(a => a.dia_agendado.toISOString().split("T")[0]));

      const total_previstos = datasColetasPrevistas.length + agendamentosCliente.length;

      const datasUnificadasSet = new Set([
        ...datasColetasPrevistas.map(d => d.toISOString().split("T")[0]),
        ...agendamentosCliente.map(a => a.dia_agendado.toISOString().split("T")[0])
      ]);

      if (total_previstos === 0) return null;

      return {
        nome_cliente: cliente.nome_cliente,
        zona: zona?.nome_da_zona || "Não definida",
        total_previstos,
        datas_previstas: Array.from(datasUnificadasSet).sort()
      };
    })
    .filter(Boolean);
}

module.exports = {
  montarFiltros,
  agruparPorCliente,
  agruparPrevisoesPorCliente
};