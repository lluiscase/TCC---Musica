import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Pause, Play } from "lucide-react";
import { BotaoTocar, Gatilho, Item, Lista, NomeItem, Seletor } from "./styles";

function SeletorReferencia({ referencias, selecionadaId, onSelecionar, disabled }) {
  const [aberto, setAberto] = useState(false);
  const [tocandoId, setTocandoId] = useState(null);
  const raiz = useRef(null);
  const audio = useRef(null);

  const selecionada = referencias.find((referencia) => referencia.id === selecionadaId);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;

    function cliqueFora(evento) {
      if (!raiz.current?.contains(evento.target)) setAberto(false);
    }
    function tecla(evento) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", cliqueFora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", cliqueFora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  useEffect(() => {
    const player = new Audio();
    player.onended = () => setTocandoId(null);
    audio.current = player;

    return () => {
      player.pause();
      player.onended = null;
    };
  }, []);

  async function alternarAudio(evento, referencia) {
    evento.stopPropagation();
    const player = audio.current;

    if (tocandoId === referencia.id) {
      player.pause();
      setTocandoId(null);
      return;
    }

    player.src = `/api/references/${referencia.id}/audio`;
    setTocandoId(referencia.id);
    try {
      await player.play();
    } catch (erro) {
      console.error(erro);
      setTocandoId(null);
    }
  }

  function selecionar(id) {
    onSelecionar(id);
    setAberto(false);
  }

  return (
    <Seletor ref={raiz}>
      <Gatilho
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span>{selecionada?.name ?? "Escolha uma referência"}</span>
        <ChevronDown size={18} />
      </Gatilho>

      {aberto && (
        <Lista role="listbox" aria-label="Referências">
          {referencias.map((referencia) => {
            const ativa = referencia.id === selecionadaId;
            const tocando = referencia.id === tocandoId;
            return (
              <Item key={referencia.id} role="option" aria-selected={ativa} $ativa={ativa}>
                <BotaoTocar
                  type="button"
                  onClick={(evento) => alternarAudio(evento, referencia)}
                  aria-label={`${tocando ? "Pausar" : "Tocar"} ${referencia.name}`}
                  $tocando={tocando}
                >
                  {tocando ? <Pause size={16} /> : <Play size={16} />}
                </BotaoTocar>
                <NomeItem type="button" onClick={() => selecionar(referencia.id)}>
                  {referencia.name}
                </NomeItem>
                {ativa && <Check size={16} />}
              </Item>
            );
          })}
        </Lista>
      )}
    </Seletor>
  );
}

export default SeletorReferencia;
