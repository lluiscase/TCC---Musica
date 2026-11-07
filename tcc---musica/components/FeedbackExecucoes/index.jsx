import { porcentagem } from "../Tabela/formatar";
import { Lista, Cartao, Erros, Positivo, Overlay, Caixa } from "./styles";
import { createPortal } from "react-dom";

function Feedback({ feedback }) {
  if (!feedback)
    return <p>Não foi possível gerar o feedback desta execução.</p>;
  if (feedback.errors.length === 0)
    return <Positivo>{feedback.message}</Positivo>;

  return (
    <Erros>
      {feedback.errors.map((erro) => (
        <li key={erro.type}>
          <strong>
            {erro.label} · {erro.severityLabel}
          </strong>
          {erro.probability != null &&
            ` (${porcentagem(erro.probability)} de certeza)`}
          : {erro.message}
        </li>
      ))}
    </Erros>
  );
}

function FeedbackExecucoes({ execucoes, onFechar }) {
  const concluidas = execucoes.filter(
    (execucao) => execucao.status === "completed",
  );
  if (concluidas.length === 0) return null;

  return createPortal(
    <Overlay onClick={onFechar}>
      <Caixa onClick={(e)=> e.stopPropagation()}>
        <Lista>
          {concluidas.map((execucao) => (
            <Cartao key={execucao.id}>
              <h4>Execução {execucao.number}</h4>
              <Feedback feedback={execucao.feedback} />
            </Cartao>
          ))}
        </Lista>
      </Caixa>
    </Overlay>,
    document.body
  );
}

export default FeedbackExecucoes;
