import { useEffect, useState } from 'react'
import { buscarReferencia, mensagemErro } from '../../src/services/api'
import { numero, porcentagem } from '../Tabela/formatar'
import { Cartao, Metricas, Legenda, Compassos, Compasso, Grade, Passo } from './styles'

function Referencia() {
    const [referencia, setReferencia] = useState(null)
    const [erro, setErro] = useState('')

    useEffect(() => {
        buscarReferencia()
            .then(setReferencia)
            .catch((falha) => setErro(mensagemErro(falha)))
    }, [])

    if (erro) return <Cartao>{erro}</Cartao>
    if (!referencia) return <Cartao>Carregando referência...</Cartao>

    return (
        <Cartao>
            <audio controls preload="metadata" src={referencia.audio.url} />
            <Metricas>
                <div><dt>Duração</dt><dd>{numero(referencia.audio.duration)}s</dd></div>
                <div><dt>BPM</dt><dd>{numero(referencia.BPM)}</dd></div>
                <div><dt>Ataques</dt><dd>{referencia.onsetCount}</dd></div>
                <div><dt>Uniformidade</dt><dd>{porcentagem(referencia.evenness)}</dd></div>
                <div><dt>Compassos (4/4)</dt><dd>{referencia.bars.length}</dd></div>
            </Metricas>
            <Legenda>Padrão rítmico: cada quadrado é uma semicolcheia, roxo = ataque (batida) naquele ponto do tempo.</Legenda>
            <Compassos>
                {referencia.bars.map((compasso, indice) => (
                    <Compasso key={indice}>
                        <span>Compasso {indice + 1}</span>
                        <Grade>
                            {[...compasso.pattern].map((passo, posicao) => (
                                <Passo key={posicao} $ataque={passo === 'x'} $inicioTempo={posicao % 4 === 0} $primeiro={posicao === 0} />
                            ))}
                        </Grade>
                        <span>{compasso.k} {compasso.k === 1 ? 'ataque' : 'ataques'}</span>
                    </Compasso>
                ))}
            </Compassos>
        </Cartao>
    )
}

export default Referencia
