import Meumicrogone from "../../../assets/Microfone.png";
import { MyButton } from "/components/Button/styles";
import Referencia from "/components/Referencia";
import TabelaExecucoes from "/components/TabelaExecucoes";
import {
  CaixaButton,
  Microfone,
  StatusMicrofone,
  LinkDownload,
  Secao,
  TituloSecao,
  DescricaoSecao,
  ListaGravacoes,
  ItemGravacao,
  BotaoRemover,
  Trecho,
  CampoTrecho,
  CabecalhoSecao,
  BotaoSecundario,
} from "../styles";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import FeedbackExecucoes from "../../../../components/FeedbackExecucoes";

/** Escolha da referência, gravação das execuções, envio e tabela de execuções */
export default function StepOne({
  referencias,
  referenciaId,
  referenciaSelecionada,
  mensagemReferencia,
  selecionarReferencia,
  referenciaCriada,
  setGravandoReferencia,
  gravandoReferencia,
  alternarMicrofone,
  microfoneAtivo,
  solicitandoPermissao,
  mensagemMicrofone,
  gravacoes,
  removerGravacao,
  inicio,
  setInicio,
  fim,
  setFim,
  enviando,
  enviarGravacoes,
  mensagemAnalise,
  analise,
}) {
  const [modal, setModal] = useState(false);
  return (
    <>
      {modal && analise && (
        <FeedbackExecucoes
          execucoes={analise.executions}
          onFechar={() => setModal(false)}
        />
      )}
      <Secao>
        <TituloSecao>Referência</TituloSecao>
        <DescricaoSecao>
          Escolha a execução usada como base, ou grave/envie uma nova. Suas
          gravações são comparadas com ela.
        </DescricaoSecao>
        {mensagemReferencia && (
          <StatusMicrofone role="status">{mensagemReferencia}</StatusMicrofone>
        )}
        <Referencia
          referencias={referencias}
          selecionadaId={referenciaId}
          onSelecionar={selecionarReferencia}
          onCriada={referenciaCriada}
          bloqueado={microfoneAtivo || solicitandoPermissao}
          onGravandoChange={setGravandoReferencia}
        />
      </Secao>

      {referenciaSelecionada && (
        <>
          <CaixaButton>
            <TituloSecao>
              Execuções comparadas com: {referenciaSelecionada.name}
            </TituloSecao>
            <MyButton
              type="button"
              onClick={alternarMicrofone}
              disabled={solicitandoPermissao || gravandoReferencia}
              aria-pressed={microfoneAtivo}
            >
              {solicitandoPermissao
                ? "Solicitando acesso..."
                : microfoneAtivo
                  ? `Parar execução ${gravacoes.length + 1}`
                  : `Gravar execução ${gravacoes.length + 1}`}
              <Microfone src={Meumicrogone} alt="Ícone" />
            </MyButton>
            <StatusMicrofone role="status" aria-live="polite">
              {mensagemMicrofone}
            </StatusMicrofone>
          </CaixaButton>

          {gravacoes.length > 0 && (
            <Secao>
              <TituloSecao>Execuções gravadas ({gravacoes.length})</TituloSecao>
              <ListaGravacoes>
                {gravacoes.map((gravacao, indice) => (
                  <ItemGravacao key={gravacao.id}>
                    <span>Execução {indice + 1}</span>
                    <audio controls src={gravacao.url} />
                    <LinkDownload href={gravacao.url} download={gravacao.nome}>
                      Baixar .wav
                    </LinkDownload>
                    <BotaoRemover
                      type="button"
                      onClick={() => removerGravacao(gravacao.id)}
                      disabled={enviando}
                    >
                      Remover
                    </BotaoRemover>
                  </ItemGravacao>
                ))}
              </ListaGravacoes>
              <Trecho>
                <CampoTrecho>
                  Início (s)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={inicio}
                    onChange={(evento) => setInicio(evento.target.value)}
                    placeholder="Completo"
                  />
                </CampoTrecho>
                <CampoTrecho>
                  Fim (s)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={fim}
                    onChange={(evento) => setFim(evento.target.value)}
                    placeholder="Completo"
                  />
                </CampoTrecho>
              </Trecho>
              <MyButton
                type="button"
                onClick={enviarGravacoes}
                disabled={enviando || microfoneAtivo}
              >
                {enviando
                  ? "Enviando..."
                  : `Enviar ${gravacoes.length} ${gravacoes.length === 1 ? "execução" : "execuções"} para análise`}
              </MyButton>
            </Secao>
          )}

          <StatusMicrofone role="status" aria-live="polite">
            {mensagemAnalise}
          </StatusMicrofone>

          {analise && (
            <Secao>
              <CabecalhoSecao>
                <TituloSecao>
                  Análise #{analise.id} — {analise.progress}%
                </TituloSecao>
                <BotaoSecundario
                  type="button"
                  onClick={() => setModal(true)}
                  disabled={analise.status !== "completed"}
                >
                  <MessageSquare size={18} />
                  {analise.status === "completed"
                    ? "Ver feedback"
                    : "Feedback (aguardando...)"}
                </BotaoSecundario>
              </CabecalhoSecao>
              <TabelaExecucoes execucoes={analise.executions} />
            </Secao>
          )}
        </>
      )}
    </>
  );
}
