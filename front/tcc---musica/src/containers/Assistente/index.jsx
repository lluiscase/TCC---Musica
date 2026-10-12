import Meuicone from '../../assets/Vector.png'
import Iconerobo from '../../assets/Robo.png'
import Meumicrogone from '../../assets/Microfone.png'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MyButton } from '/components/Button/styles'
import TabelaExecucoes from '/components/TabelaExecucoes'
import TabelaAnalises from '/components/TabelaAnalises'
import Referencia from '/components/Referencia'
import { enviarAnalise, buscarAnalise, listarAnalises, mensagemErro } from '../../services/api'
import { Icone, Cabecalho, H1, MenuLink, Container, Titulo, Titulo2, Texto, Robo, ContainerRobo, CaixaButton, Microfone, StatusMicrofone, LinkDownload, Secao, TituloSecao, DescricaoSecao, ListaGravacoes, ItemGravacao, BotaoRemover, Trecho, CampoTrecho } from './styles'

const INTERVALO_CONSULTA = 2000
const STATUS_FINALIZADOS = ['completed', 'failed']

// Roda na thread de áudio e repassa as amostras PCM cruas do microfone,
// assim o WAV é montado direto, sem comprimir e decodificar (decodeAudioData)
const PROCESSADOR_GRAVACAO = `
class Gravador extends AudioWorkletProcessor {
    process(entradas) {
        const canais = entradas[0]
        if (canais.length > 0) this.port.postMessage(canais.map((canal) => canal.slice()))
        return true
    }
}
registerProcessor('gravador', Gravador)
`

function juntarBlocos(blocos) {
    const totalCanais = blocos[0]?.length ?? 0
    const tamanho = blocos.reduce((soma, bloco) => soma + bloco[0].length, 0)

    return Array.from({ length: totalCanais }, (_, canal) => {
        const dados = new Float32Array(tamanho)
        let offset = 0
        for (const bloco of blocos) {
            dados.set(bloco[canal], offset)
            offset += bloco[canal].length
        }
        return dados
    })
}

function converterParaWav(dadosCanais, sampleRate) {
    const canais = dadosCanais.length
    const totalAmostras = dadosCanais[0].length
    const bytesPorAmostra = 2
    const alinhamentoBloco = canais * bytesPorAmostra
    const tamanhoDados = totalAmostras * alinhamentoBloco
    const buffer = new ArrayBuffer(44 + tamanhoDados)
    const view = new DataView(buffer)
    const escreverTexto = (offset, texto) => {
        for (let indice = 0; indice < texto.length; indice += 1) {
            view.setUint8(offset + indice, texto.charCodeAt(indice))
        }
    }

    escreverTexto(0, 'RIFF')
    view.setUint32(4, 36 + tamanhoDados, true)
    escreverTexto(8, 'WAVE')
    escreverTexto(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, canais, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * alinhamentoBloco, true)
    view.setUint16(32, alinhamentoBloco, true)
    view.setUint16(34, 16, true)
    escreverTexto(36, 'data')
    view.setUint32(40, tamanhoDados, true)

    let offset = 44

    for (let amostra = 0; amostra < totalAmostras; amostra += 1) {
        for (let canal = 0; canal < canais; canal += 1) {
            const valor = Math.max(-1, Math.min(1, dadosCanais[canal][amostra]))
            view.setInt16(offset, valor < 0 ? valor * 0x8000 : valor * 0x7fff, true)
            offset += bytesPorAmostra
        }
    }

    return new Blob([buffer], { type: 'audio/wav' })
}

function Assistente(){
    const [microfoneAtivo, setMicrofoneAtivo] = useState(false)
    const [solicitandoPermissao, setSolicitandoPermissao] = useState(false)
    const [mensagemMicrofone, setMensagemMicrofone] = useState('')
    const [gravacoes, setGravacoes] = useState([])
    const [inicio, setInicio] = useState('')
    const [fim, setFim] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [mensagemAnalise, setMensagemAnalise] = useState('')
    const [analiseId, setAnaliseId] = useState(null)
    const [analise, setAnalise] = useState(null)
    const [historico, setHistorico] = useState([])
    const fluxoMicrofone = useRef(null)
    const gravacaoAtual = useRef(null)
    const componenteAtivo = useRef(true)
    const urlsGravacoes = useRef([])

    useEffect(() => {
        componenteAtivo.current = true

        return () => {
            componenteAtivo.current = false
            gravacaoAtual.current?.contexto.close()
            gravacaoAtual.current = null
            fluxoMicrofone.current?.getTracks().forEach((faixa) => faixa.stop())
            urlsGravacoes.current.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [])

    const carregarHistorico = useCallback(async () => {
        try {
            const analises = await listarAnalises()
            if (componenteAtivo.current) setHistorico(analises)
        } catch (erro) {
            if (componenteAtivo.current) setMensagemAnalise(mensagemErro(erro))
        }
    }, [])

    useEffect(() => {
        listarAnalises()
            .then(setHistorico)
            .catch((erro) => setMensagemAnalise(mensagemErro(erro)))
    }, [])

    // Consulta o back até o worker terminar todas as execuções
    useEffect(() => {
        if (analiseId == null) return

        let ativo = true
        let temporizador

        async function consultar() {
            try {
                const resultado = await buscarAnalise(analiseId)
                if (!ativo) return
                setAnalise(resultado)
                carregarHistorico()
                if (STATUS_FINALIZADOS.includes(resultado.status)) return
                temporizador = setTimeout(consultar, INTERVALO_CONSULTA)
            } catch (erro) {
                if (ativo) setMensagemAnalise(mensagemErro(erro))
            }
        }

        consultar()

        return () => {
            ativo = false
            clearTimeout(temporizador)
        }
    }, [analiseId, carregarHistorico])

    function removerGravacao(id) {
        const gravacao = gravacoes.find((item) => item.id === id)
        URL.revokeObjectURL(gravacao.url)
        urlsGravacoes.current = urlsGravacoes.current.filter((url) => url !== gravacao.url)
        setGravacoes((atuais) => atuais.filter((item) => item.id !== id))
    }

    async function enviarGravacoes() {
        setEnviando(true)
        setMensagemAnalise('Enviando gravações para análise...')

        try {
            const { analysisId } = await enviarAnalise(gravacoes, { inicio, fim })
            if (!componenteAtivo.current) return
            setAnalise(null)
            setAnaliseId(analysisId)
            setMensagemAnalise(`Análise #${analysisId} enviada com ${gravacoes.length} ${gravacoes.length === 1 ? 'execução' : 'execuções'}. O resultado aparece na tabela abaixo.`)
            // Já estão no servidor, a lista volta vazia para a próxima análise
            gravacoes.forEach((gravacao) => URL.revokeObjectURL(gravacao.url))
            urlsGravacoes.current = []
            setGravacoes([])
            carregarHistorico()
        } catch (erro) {
            if (componenteAtivo.current) setMensagemAnalise(mensagemErro(erro))
        } finally {
            if (componenteAtivo.current) setEnviando(false)
        }
    }

    async function finalizarGravacao() {
        const { contexto, fonte, processador, blocos } = gravacaoAtual.current
        gravacaoAtual.current = null
        fonte.disconnect()
        processador.disconnect()
        processador.port.onmessage = null
        fluxoMicrofone.current.getTracks().forEach((faixa) => faixa.stop())
        fluxoMicrofone.current = null
        setMicrofoneAtivo(false)

        try {
            await contexto.close()
            if (blocos.length === 0) {
                setMensagemMicrofone('Nenhum áudio foi capturado. Verifique o microfone e grave novamente.')
                return
            }

            const audioWav = converterParaWav(juntarBlocos(blocos), contexto.sampleRate)
            const nomeArquivo = `gravacao-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`
            const url = URL.createObjectURL(audioWav)
            urlsGravacoes.current.push(url)
            setGravacoes((atuais) => [...atuais, { id: url, url, nome: nomeArquivo, blob: audioWav }])
            setMensagemMicrofone('Execução adicionada. Grave a próxima execução ou envie todas para análise.')
        } catch (erro) {
            console.error(erro)
            setMensagemMicrofone('Não foi possível gerar o arquivo WAV.')
        }
    }

    async function alternarMicrofone() {
        if (gravacaoAtual.current) {
            finalizarGravacao()
            return
        }

        if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode) {
            setMensagemMicrofone('Este navegador não oferece suporte para gravar o áudio.')
            return
        }

        setSolicitandoPermissao(true)
        setMensagemMicrofone('Aguardando permissão para acessar o microfone...')

        let contexto
        try {
            // Sem os filtros de voz do navegador, que cortam e distorcem o som do instrumento
            fluxoMicrofone.current = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
            })

            contexto = new AudioContext()
            const urlModulo = URL.createObjectURL(new Blob([PROCESSADOR_GRAVACAO], { type: 'text/javascript' }))
            try {
                await contexto.audioWorklet.addModule(urlModulo)
            } finally {
                URL.revokeObjectURL(urlModulo)
            }
            await contexto.resume()

            const fonte = contexto.createMediaStreamSource(fluxoMicrofone.current)
            const processador = new AudioWorkletNode(contexto, 'gravador')
            const blocos = []
            processador.port.onmessage = (evento) => blocos.push(evento.data)
            fonte.connect(processador)
            // A saída é silenciosa, a conexão só mantém o processador rodando
            processador.connect(contexto.destination)

            if (!componenteAtivo.current) {
                contexto.close()
                fluxoMicrofone.current.getTracks().forEach((faixa) => faixa.stop())
                return
            }

            gravacaoAtual.current = { contexto, fonte, processador, blocos }
            setMicrofoneAtivo(true)
            setMensagemMicrofone('Gravando. Desative o microfone para finalizar esta execução.')
        } catch (erro) {
            console.error(erro)
            contexto?.close()
            fluxoMicrofone.current?.getTracks().forEach((faixa) => faixa.stop())
            fluxoMicrofone.current = null
            setMensagemMicrofone('Não foi possível gravar o áudio. Verifique a permissão do microfone.')
        } finally {
            setSolicitandoPermissao(false)
        }
    }

    return(
        <main>
        <header>
            <Icone src={Meuicone} alt="Ícone" />
            <Cabecalho>
                <H1>
                    <MenuLink to="/" end>Home</MenuLink>
                    <MenuLink to="/assistente">Assistente</MenuLink>
                </H1>
            </Cabecalho>
        </header>
            <Container>
                <Titulo>Assistente</Titulo>
                <Titulo2>Aprenda ritmo e técnicas com dicas em tempo real.</Titulo2>
                <Texto>O assistente escuta sua execução, sugere alternativas mais fáceis e ajuda a construir um caminho mais suave para cada nova peça.</Texto>
            </Container>
            <ContainerRobo>
                <Robo src={Iconerobo} alt="Ícone" />
            </ContainerRobo>
            <Secao>
                <TituloSecao>Referência</TituloSecao>
                <DescricaoSecao>Esta é a execução usada como base: suas gravações são comparadas com ela.</DescricaoSecao>
                <Referencia />
            </Secao>
            <CaixaButton>
                <MyButton type="button" onClick={alternarMicrofone} disabled={solicitandoPermissao} aria-pressed={microfoneAtivo}>
                {solicitandoPermissao
                    ? 'Solicitando acesso...'
                    : microfoneAtivo
                        ? `Parar execução ${gravacoes.length + 1}`
                        : `Gravar execução ${gravacoes.length + 1}`}
                <Microfone src={Meumicrogone} alt="Ícone" />
                </MyButton>
                <StatusMicrofone role="status" aria-live="polite">{mensagemMicrofone}</StatusMicrofone>
            </CaixaButton>

            {gravacoes.length > 0 && (
                <Secao>
                    <TituloSecao>Execuções gravadas ({gravacoes.length})</TituloSecao>
                    <ListaGravacoes>
                        {gravacoes.map((gravacao, indice) => (
                            <ItemGravacao key={gravacao.id}>
                                <span>Execução {indice + 1}</span>
                                <audio controls src={gravacao.url} />
                                <LinkDownload href={gravacao.url} download={gravacao.nome}>Baixar .wav</LinkDownload>
                                <BotaoRemover type="button" onClick={() => removerGravacao(gravacao.id)} disabled={enviando}>Remover</BotaoRemover>
                            </ItemGravacao>
                        ))}
                    </ListaGravacoes>
                    <Trecho>
                        <CampoTrecho>
                            Início (s)
                            <input type="number" min="0" step="0.1" value={inicio} onChange={(evento) => setInicio(evento.target.value)} placeholder="Completo" />
                        </CampoTrecho>
                        <CampoTrecho>
                            Fim (s)
                            <input type="number" min="0" step="0.1" value={fim} onChange={(evento) => setFim(evento.target.value)} placeholder="Completo" />
                        </CampoTrecho>
                    </Trecho>
                    <MyButton type="button" onClick={enviarGravacoes} disabled={enviando || microfoneAtivo}>
                        {enviando ? 'Enviando...' : `Enviar ${gravacoes.length} ${gravacoes.length === 1 ? 'execução' : 'execuções'} para análise`}
                    </MyButton>
                </Secao>
            )}

            <StatusMicrofone role="status" aria-live="polite">{mensagemAnalise}</StatusMicrofone>

            {analise && (
                <Secao>
                    <TituloSecao>Análise #{analise.id} — {analise.progress}%</TituloSecao>
                    <TabelaExecucoes execucoes={analise.executions} />
                </Secao>
            )}

            <Secao>
                <TituloSecao>Histórico de análises</TituloSecao>
                <TabelaAnalises analises={historico} selecionada={analiseId} onSelecionar={setAnaliseId} />
            </Secao>
        </main>
    )
}

export default Assistente