import { useEffect, useState } from 'react'
import { buscarReferencia, mensagemErro } from '../../src/services/api'
import { numero, porcentagem } from '../Tabela/formatar'
import { Cartao, Metricas } from './styles'

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
        </Cartao>
    )
}

export default Referencia
