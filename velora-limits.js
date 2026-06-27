// ═══════════════════════════════════════════════
//  VELORA IA — Sistema de Limites e Planos
// ═══════════════════════════════════════════════

const VELORA_LIMITS = {

  // Verificar plano do utilizador
  getPlano: () => {
    try { return localStorage.getItem('vp_plano') || 'free'; } catch(e) { return 'free'; }
  },

  // Verificar se é Premium
  isPremium: () => VELORA_LIMITS.getPlano() === 'premium',

  // Verificar se é Standard
  isStandard: () => VELORA_LIMITS.getPlano() === 'standard',

  // Verificar se é pago (qualquer plano pago)
  isPago: () => ['standard', 'premium'].includes(VELORA_LIMITS.getPlano()),

  // Data de registo do utilizador
  getDataRegisto: (uid) => {
    const key = 'vp_registo_' + uid;
    let data = localStorage.getItem(key);
    if (!data) {
      data = new Date().toISOString();
      localStorage.setItem(key, data);
    }
    return new Date(data);
  },

  // Dias desde o registo
  diasDesdeRegisto: (uid) => {
    const registo = VELORA_LIMITS.getDataRegisto(uid);
    const agora = new Date();
    const diff = agora - registo;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  // Verificar se ainda está no período livre (primeiros 6 dias)
  emPeriodoLivre: (uid) => {
    return VELORA_LIMITS.diasDesdeRegisto(uid) < 6;
  },

  // Chave para contagem do dia
  chaveHoje: (uid, tipo) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return `vp_uso_${uid}_${tipo}_${hoje}`;
  },

  // Chave para histórico de usos (para calcular espera)
  chaveHistorico: (uid, tipo) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return `vp_hist_${uid}_${tipo}_${hoje}`;
  },

  // Obter contagem de usos hoje
  getUsosHoje: (uid, tipo) => {
    try {
      return parseInt(localStorage.getItem(VELORA_LIMITS.chaveHoje(uid, tipo)) || '0');
    } catch(e) { return 0; }
  },

  // Obter histórico de timestamps de hoje
  getHistorico: (uid, tipo) => {
    try {
      return JSON.parse(localStorage.getItem(VELORA_LIMITS.chaveHistorico(uid, tipo)) || '[]');
    } catch(e) { return []; }
  },

  // Calcular espera progressiva baseada no número de usos
  calcularEspera: (numUso) => {
    // numUso = quantos usos já foram feitos hoje (1-based)
    const esperas = {
      1: 2 * 60,      // após 1º uso: espera 2 horas
      2: 3 * 60,      // após 2º uso: espera 3 horas
      3: 4 * 60,      // após 3º uso: espera 4 horas
      4: 5 * 60,      // após 4º uso: espera 5 horas
      5: 'midnight'   // após 5º uso: espera até meia-noite
    };
    return esperas[numUso] || 'midnight';
  },

  // Calcular minutos até meia-noite
  minutosAteMeiaNoite: () => {
    const agora = new Date();
    const meiaNoPite = new Date();
    meiaNoPite.setHours(24, 0, 0, 0);
    return Math.ceil((meiaNoPite - agora) / (1000 * 60));
  },

  // Verificar próximo uso disponível
  proximoUsoDisponivel: (uid, tipo) => {
    const historico = VELORA_LIMITS.getHistorico(uid, tipo);
    const usos = VELORA_LIMITS.getUsosHoje(uid, tipo);

    if (usos === 0) return null; // Pode usar agora

    const ultimoUso = historico[historico.length - 1];
    if (!ultimoUso) return null;

    const esperaMinutos = VELORA_LIMITS.calcularEspera(usos);

    if (esperaMinutos === 'midnight') {
      const agora = new Date();
      const meiaNoPite = new Date();
      meiaNoPite.setHours(24, 0, 0, 0);
      return meiaNoPite;
    }

    const proximoUso = new Date(ultimoUso);
    proximoUso.setMinutes(proximoUso.getMinutes() + esperaMinutos);
    return proximoUso;
  },

  // FUNÇÃO PRINCIPAL: Verificar se pode usar
  podeUsar: (uid, tipo) => {
    // Planos pagos: sempre podem usar
    if (VELORA_LIMITS.isPago()) {
      return { pode: true };
    }

    // Período livre (primeiros 6 dias): 5 usos sem espera
    if (VELORA_LIMITS.emPeriodoLivre(uid)) {
      const usos = VELORA_LIMITS.getUsosHoje(uid, tipo);
      if (usos >= 5) {
        return {
          pode: false,
          motivo: 'limite_dia',
          resetEm: 'midnight',
          usos: usos,
          limite: 5
        };
      }
      return { pode: true, usos: usos, limite: 5 };
    }

    // Após 6 dias: espera progressiva
    const usos = VELORA_LIMITS.getUsosHoje(uid, tipo);
    if (usos >= 5) {
      return {
        pode: false,
        motivo: 'limite_dia',
        resetEm: 'midnight',
        usos: usos,
        limite: 5
      };
    }

    const proximo = VELORA_LIMITS.proximoUsoDisponivel(uid, tipo);
    if (proximo && new Date() < proximo) {
      return {
        pode: false,
        motivo: 'espera',
        disponivel: proximo,
        usos: usos,
        limite: 5
      };
    }

    return { pode: true, usos: usos, limite: 5 };
  },

  // Registar uso
  registarUso: (uid, tipo) => {
    const chave = VELORA_LIMITS.chaveHoje(uid, tipo);
    const chaveH = VELORA_LIMITS.chaveHistorico(uid, tipo);
    const usos = VELORA_LIMITS.getUsosHoje(uid, tipo);
    const historico = VELORA_LIMITS.getHistorico(uid, tipo);

    localStorage.setItem(chave, (usos + 1).toString());
    historico.push(new Date().toISOString());
    localStorage.setItem(chaveH, JSON.stringify(historico));
  },

  // Formatar tempo de espera
  formatarEspera: (disponivel, lang) => {
    const agora = new Date();
    const diff = disponivel - agora;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const msgs = {
      pt: horas > 0 ? `${horas}h ${minutos}min` : `${minutos} minutos`,
      en: horas > 0 ? `${horas}h ${minutos}min` : `${minutos} minutes`,
      es: horas > 0 ? `${horas}h ${minutos}min` : `${minutos} minutos`
    };
    return msgs[lang] || msgs.pt;
  },

  // Mensagem de bloqueio
  getMensagemBloqueio: (resultado, lang) => {
    const msgs = {
      pt: {
        espera: (t) => `⏳ Próximo uso disponível em ${t}. Faz upgrade para acesso ilimitado!`,
        limite: `✋ Chegaste ao limite diário. Volta amanhã ou faz upgrade para continuar!`,
        upgrade: `👑 Faz upgrade para Standard ou Premium e usa sem limites!`
      },
      en: {
        espera: (t) => `⏳ Next use available in ${t}. Upgrade for unlimited access!`,
        limite: `✋ You've reached your daily limit. Come back tomorrow or upgrade!`,
        upgrade: `👑 Upgrade to Standard or Premium for unlimited use!`
      },
      es: {
        espera: (t) => `⏳ Próximo uso disponible en ${t}. ¡Mejora para acceso ilimitado!`,
        limite: `✋ Alcanzaste el límite diario. ¡Vuelve mañana o mejora tu plan!`,
        upgrade: `👑 ¡Mejora a Standard o Premium para uso sin límites!`
      }
    };

    const l = lang || 'pt';
    const m = msgs[l] || msgs.pt;

    if (resultado.motivo === 'espera') {
      const tempo = VELORA_LIMITS.formatarEspera(resultado.disponivel, l);
      return m.espera(tempo);
    }
    return m.limite;
  }
};

// Exportar globalmente
window.VELORA_LIMITS = VELORA_LIMITS;
