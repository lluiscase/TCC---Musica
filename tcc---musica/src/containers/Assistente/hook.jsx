import { useCallback, useEffect, useRef, useState } from "react";
import { useGravador, nomeWav } from "../../hooks/useGravador";
import {
  enviarAnalise,
  buscarAnalise,
  listarAnalises,
  listarReferencias,
  buscarModelo,
  mensagemErro,
} from "../../services/api";

const INTERVALO_CONSULTA = 2000;
const STATUS_FINALIZADOS = ["completed", "failed"];

/**
 * Estado do Assistente compartilhado entre os steps: referências, gravações das
 * execuções, envio para análise, resultado, histórico e modelo.
 * Fica no Assistente (uma vez só), assim nada se perde quando o step muda.
 */
export default function useHook() {
  const gravador = useGravador();
  const microfoneAtivo = gravador.gravando;
  const solicitandoPermissao = gravador.solicitando;
  const [gravandoReferencia, setGravandoReferencia] = useState(false);
  const [mensagemMicrofone, setMensagemMicrofone] = useState("");
  const [gravacoes, setGravacoes] = useState([]);

  const [referencias, setReferencias] = useState([]);
  const [referenciaId, setReferenciaId] = useState(null);
  const [mensagemReferencia, setMensagemReferencia] = useState("");

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagemAnalise, setMensagemAnalise] = useState("");
  const [analiseId, setAnaliseId] = useState(null);
  const [analise, setAnalise] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [modelo, setModelo] = useState(null);
  const [mensagemModelo, setMensagemModelo] = useState("");

  const componenteAtivo = useRef(true);
  const urlsGravacoes = useRef([]);
  const referenciaAtual = useRef(null);

  useEffect(() => {
    componenteAtivo.current = true;

    return () => {
      componenteAtivo.current = false;
      urlsGravacoes.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /* Referências */

  useEffect(() => {
    listarReferencias()
      .then((lista) => {
        setReferencias(lista);
        const padrao = lista.find((referencia) => referencia.isDefault) ?? lista[0];
        if (padrao) setReferenciaId(padrao.id);
        else setMensagemReferencia("Nenhuma referência cadastrada. Grave ou envie uma para começar.");
      })
      .catch((erro) => setMensagemReferencia(mensagemErro(erro)));
  }, []);

  // A análise aberta e o histórico são sempre da referência selecionada
  const carregarHistorico = useCallback(async () => {
    const id = referenciaAtual.current;
    if (id == null) return;
    try {
      const analises = await listarAnalises(id);
      // Ignora a resposta se a referência mudou enquanto a lista carregava
      if (componenteAtivo.current && referenciaAtual.current === id) setHistorico(analises);
    } catch (erro) {
      if (componenteAtivo.current) setMensagemAnalise(mensagemErro(erro));
    }
  }, []);

  useEffect(() => {
    referenciaAtual.current = referenciaId;
    carregarHistorico();
  }, [referenciaId, carregarHistorico]);

  function selecionarReferencia(id) {
    if (id === referenciaId) return;
    setReferenciaId(id);
    setAnaliseId(null);
    setAnalise(null);
    setMensagemAnalise("");
    setHistorico([]);
  }

  function referenciaCriada(referencia) {
    setReferencias((atuais) => [...atuais, referencia]);
    selecionarReferencia(referencia.id);
  }

  const referenciaSelecionada = referencias.find((referencia) => referencia.id === referenciaId);

  /* Modelo */

  const carregarModelo = useCallback(async () => {
    try {
      const status = await buscarModelo();
      if (componenteAtivo.current) setModelo(status);
    } catch (erro) {
      if (componenteAtivo.current) setMensagemModelo(mensagemErro(erro));
    }
  }, []);

  useEffect(() => {
    buscarModelo()
      .then(setModelo)
      .catch((erro) => setMensagemModelo(mensagemErro(erro)));
  }, []);

  /* Análise */

  // Consulta o back até o worker terminar todas as execuções
  useEffect(() => {
    if (analiseId == null) return;

    let ativo = true;
    let temporizador;

    async function consultar() {
      try {
        const resultado = await buscarAnalise(analiseId);
        if (!ativo) return;
        setAnalise(resultado);
        carregarHistorico();
        if (STATUS_FINALIZADOS.includes(resultado.status)) {
          // O worker treina o modelo de novo ao terminar a análise
          carregarModelo();
          return;
        }
        temporizador = setTimeout(consultar, INTERVALO_CONSULTA);
      } catch (erro) {
        if (ativo) setMensagemAnalise(mensagemErro(erro));
      }
    }

    consultar();

    return () => {
      ativo = false;
      clearTimeout(temporizador);
    };
  }, [analiseId, carregarHistorico, carregarModelo]);

  /* Gravações das execuções */

  async function alternarMicrofone() {
    try {
      if (gravador.gravando) {
        const audioWav = await gravador.parar();
        if (!audioWav) {
          setMensagemMicrofone("Nenhum áudio foi capturado. Verifique o microfone e grave novamente.");
          return;
        }
        const url = URL.createObjectURL(audioWav);
        urlsGravacoes.current.push(url);
        setGravacoes((atuais) => [...atuais, { id: url, url, nome: nomeWav("gravacao"), blob: audioWav }]);
        setMensagemMicrofone("Execução adicionada. Grave a próxima execução ou envie todas para análise.");
        return;
      }

      setMensagemMicrofone("Aguardando permissão para acessar o microfone...");
      await gravador.iniciar();
      setMensagemMicrofone("Gravando. Desative o microfone para finalizar esta execução.");
    } catch (erro) {
      setMensagemMicrofone(erro.message);
    }
  }

  function removerGravacao(id) {
    const gravacao = gravacoes.find((item) => item.id === id);
    URL.revokeObjectURL(gravacao.url);
    urlsGravacoes.current = urlsGravacoes.current.filter((url) => url !== gravacao.url);
    setGravacoes((atuais) => atuais.filter((item) => item.id !== id));
  }

  async function enviarGravacoes() {
    setEnviando(true);
    setMensagemAnalise("Enviando gravações para análise...");

    try {
      const { analysisId } = await enviarAnalise(gravacoes, { referenciaId, inicio, fim });
      if (!componenteAtivo.current) return;
      setAnalise(null);
      setAnaliseId(analysisId);
      setMensagemAnalise(
        `Análise #${analysisId} enviada com ${gravacoes.length} ${gravacoes.length === 1 ? "execução" : "execuções"}.`,
      );
      // Já estão no servidor, a lista volta vazia para a próxima análise
      gravacoes.forEach((gravacao) => URL.revokeObjectURL(gravacao.url));
      urlsGravacoes.current = [];
      setGravacoes([]);
      carregarHistorico();
    } catch (erro) {
      if (componenteAtivo.current) setMensagemAnalise(mensagemErro(erro));
    } finally {
      if (componenteAtivo.current) setEnviando(false);
    }
  }

  return {
    // gravação
    alternarMicrofone,
    microfoneAtivo,
    solicitandoPermissao,
    mensagemMicrofone,
    gravandoReferencia,
    setGravandoReferencia,
    gravacoes,
    removerGravacao,
    // referências
    referencias,
    referenciaId,
    referenciaSelecionada,
    mensagemReferencia,
    selecionarReferencia,
    referenciaCriada,
    // análise
    inicio,
    setInicio,
    fim,
    setFim,
    enviando,
    enviarGravacoes,
    mensagemAnalise,
    analise,
    analiseId,
    setAnaliseId,
    historico,
    // modelo
    modelo,
    mensagemModelo,
  };
}
