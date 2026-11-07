import { useEffect, useRef, useState } from "react";
import {
  buscarReferencia,
  criarReferencia,
  mensagemErro,
} from "../../src/services/api";
import { useGravador, nomeWav } from "../../src/hooks/useGravador";
import { numero, porcentagem } from "../Tabela/formatar";
import { Aviso, Barra, Botao, Cartao, Metricas, Nova } from "./styles";
import SeletorReferencia from "./Seletor";
function Referencia({
  referencias,
  selecionadaId,
  onSelecionar,
  onCriada,
  bloqueado,
  onGravandoChange,
}) {
  const [carregada, setCarregada] = useState(null);
  const [nova, setNova] = useState(null);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const entradaArquivo = useRef(null);
  const urlNova = useRef(null);
  const gravador = useGravador();

  useEffect(() => {
    if (selecionadaId == null) return;

    let ativo = true;
    buscarReferencia(selecionadaId)
      .then(
        (referencia) =>
          ativo && setCarregada({ id: selecionadaId, referencia }),
      )
      .catch(
        (falha) =>
          ativo &&
          setCarregada({ id: selecionadaId, erro: mensagemErro(falha) }),
      );

    return () => {
      ativo = false;
    };
  }, [selecionadaId]);

  useEffect(() => {
    onGravandoChange?.(gravador.gravando);
  }, [gravador.gravando, onGravandoChange]);

  useEffect(
    () => () => urlNova.current && URL.revokeObjectURL(urlNova.current),
    [],
  );

  function prepararNova(blob, nomeArquivo, nomeSugerido) {
    if (urlNova.current) URL.revokeObjectURL(urlNova.current);
    urlNova.current = URL.createObjectURL(blob);
    setNova({ blob, nomeArquivo, url: urlNova.current });
    setNome(nomeSugerido);
  }

  function descartarNova() {
    if (urlNova.current) URL.revokeObjectURL(urlNova.current);
    urlNova.current = null;
    setNova(null);
    setNome("");
    setMensagem("");
  }

  async function alternarGravacao() {
    try {
      if (gravador.gravando) {
        const blob = await gravador.parar();
        if (!blob) {
          setMensagem(
            "Nenhum áudio foi capturado. Verifique o microfone e grave novamente.",
          );
          return;
        }
        prepararNova(
          blob,
          nomeWav("referencia"),
          `Referência ${referencias.length + 1}`,
        );
        setMensagem("Ouça a gravação, dê um nome e salve a referência.");
        return;
      }

      setMensagem("Aguardando permissão para acessar o microfone...");
      await gravador.iniciar();
      setMensagem(
        'Gravando a referência. Clique em "Parar gravação" para finalizar.',
      );
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  function escolherArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    if (!arquivo.name.toLowerCase().endsWith(".wav")) {
      setMensagem("Escolha um arquivo .wav.");
      return;
    }
    prepararNova(arquivo, arquivo.name, arquivo.name.replace(/\.wav$/i, ""));
    setMensagem("Ouça o arquivo, confira o nome e salve a referência.");
  }

  async function salvar() {
    setSalvando(true);
    setMensagem("Detectando os ataques da referência...");
    try {
      const criada = await criarReferencia(
        nova.blob,
        nova.nomeArquivo,
        nome.trim(),
      );
      descartarNova();
      setMensagem(`Referência "${criada.name}" criada e selecionada.`);
      onCriada(criada);
    } catch (erro) {
      setMensagem(mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  const ocupado = salvando || bloqueado || gravador.solicitando;
  const atual = carregada?.id === selecionadaId ? carregada : null;
  const detalhe = atual?.referencia;

  return (
    <>
      <Barra>
        <Botao
          type="button"
          onClick={alternarGravacao}
          disabled={ocupado}
          aria-pressed={gravador.gravando}
        >
          {gravador.solicitando
            ? "Solicitando acesso..."
            : gravador.gravando
              ? "Parar gravação"
              : "Gravar nova referência"}
        </Botao>
        <Botao
          type="button"
          onClick={() => entradaArquivo.current.click()}
          disabled={ocupado || gravador.gravando}
        >
          Enviar arquivo .wav
        </Botao>
        <input
          ref={entradaArquivo}
          type="file"
          accept=".wav,audio/wav"
          hidden
          onChange={escolherArquivo}
        />
      </Barra>

      {mensagem && (
        <Aviso role="status" aria-live="polite">
          {mensagem}
        </Aviso>
      )}

      {nova && (
        <Nova>
          <strong>Nova referência</strong>
          <audio controls src={nova.url} />
          <Barra>
            <Botao
              type="button"
              $principal
              onClick={salvar}
              disabled={salvando || !nome.trim()}
            >
              {salvando ? "Salvando..." : "Salvar referência"}
            </Botao>
            <Botao type="button" onClick={descartarNova} disabled={salvando}>
              Descartar
            </Botao>
          </Barra>
        </Nova>
      )}

      {selecionadaId != null &&
        (atual?.erro ? (
          <Cartao>{atual.erro}</Cartao>
        ) : !detalhe ? (
          <Cartao>Carregando referência...</Cartao>
        ) : (
          <Cartao>
            <Metricas>
              <SeletorReferencia
                referencias={referencias}
                selecionadaId={selecionadaId}
                onSelecionar={onSelecionar}
                disabled={gravador.gravando || salvando}
              />
              <div>
                <dt>Duração</dt>
                <dd>{numero(detalhe.audio.duration)}s</dd>
              </div>
              <div>
                <dt>BPM</dt>
                <dd>{numero(detalhe.BPM)}</dd>
              </div>
              <div>
                <dt>Ataques</dt>
                <dd>{detalhe.onsetCount}</dd>
              </div>
              <div>
                <dt>Uniformidade</dt>
                <dd>{porcentagem(detalhe.evenness)}</dd>
              </div>
              <div>
                <dt>Compassos (4/4)</dt>
                <dd>{detalhe.bars.length}</dd>
              </div>
            </Metricas>
          </Cartao>
        ))}
    </>
  );
}

export default Referencia;
