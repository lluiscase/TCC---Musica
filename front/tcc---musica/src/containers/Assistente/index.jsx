import Meuicone from '../../assets/Vector.png'
import Iconerobo from '../../assets/Robo.png'
import Meumicrogone from '../../assets/Microfone.png'
import { useEffect, useRef, useState } from 'react'
import { MyButton } from '/components/Button/styles'
import { Icone, Cabecalho, H1, MenuLink, Container, Titulo, Titulo2, Texto, Robo, ContainerRobo, CaixaButton, Microfone, StatusMicrofone, LinkDownload } from './styles'

function converterParaWav(audioBuffer) {
    const canais = audioBuffer.numberOfChannels
    const bytesPorAmostra = 2
    const alinhamentoBloco = canais * bytesPorAmostra
    const tamanhoDados = audioBuffer.length * alinhamentoBloco
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
    view.setUint32(24, audioBuffer.sampleRate, true)
    view.setUint32(28, audioBuffer.sampleRate * alinhamentoBloco, true)
    view.setUint16(32, alinhamentoBloco, true)
    view.setUint16(34, 16, true)
    escreverTexto(36, 'data')
    view.setUint32(40, tamanhoDados, true)

    const dadosCanais = Array.from({ length: canais }, (_, canal) => audioBuffer.getChannelData(canal))
    let offset = 44

    for (let amostra = 0; amostra < audioBuffer.length; amostra += 1) {
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
    const [arquivoWav, setArquivoWav] = useState(null)
    const fluxoMicrofone = useRef(null)
    const gravadorAudio = useRef(null)
    const partesAudio = useRef([])
    const componenteAtivo = useRef(true)

    useEffect(() => {
        componenteAtivo.current = true

        return () => {
            componenteAtivo.current = false
            if (gravadorAudio.current?.state === 'recording') {
                gravadorAudio.current.stop()
            }
            fluxoMicrofone.current?.getTracks().forEach((faixa) => faixa.stop())
        }
    }, [])

    useEffect(() => () => {
        if (arquivoWav) {
            URL.revokeObjectURL(arquivoWav.url)
        }
    }, [arquivoWav])

    async function alternarMicrofone() {
        if (fluxoMicrofone.current) {
            if (gravadorAudio.current?.state === 'recording') {
                gravadorAudio.current.stop()
            }
            gravadorAudio.current = null
            fluxoMicrofone.current.getTracks().forEach((faixa) => faixa.stop())
            fluxoMicrofone.current = null
            setMicrofoneAtivo(false)
            setMensagemMicrofone('Microfone desativado. Gerando o arquivo WAV...')
            return
        }

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder || !window.AudioContext) {
            setMensagemMicrofone('Este navegador não oferece suporte para gravar e converter o áudio.')
            return
        }

        setSolicitandoPermissao(true)
        setMensagemMicrofone('Aguardando permissão para acessar o microfone...')

        try {
            fluxoMicrofone.current = await navigator.mediaDevices.getUserMedia({ audio: true })
            const gravador = new MediaRecorder(fluxoMicrofone.current)
            partesAudio.current = []

            gravador.ondataavailable = (evento) => {
                if (evento.data.size > 0) {
                    partesAudio.current.push(evento.data)
                }
            }

            gravador.onstop = async () => {
                if (!componenteAtivo.current) return

                try {
                    const audioGravado = new Blob(partesAudio.current, { type: gravador.mimeType })
                    const contextoAudio = new AudioContext()
                    let audioWav

                    try {
                        const bufferAudio = await contextoAudio.decodeAudioData(await audioGravado.arrayBuffer())
                        audioWav = converterParaWav(bufferAudio)
                    } finally {
                        await contextoAudio.close()
                    }

                    if (!componenteAtivo.current) return

                    const nomeArquivo = `gravacao-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`
                    setArquivoWav({ url: URL.createObjectURL(audioWav), nome: nomeArquivo })
                    setMensagemMicrofone('Arquivo WAV pronto para baixar.')
                } catch {
                    if (componenteAtivo.current) {
                        setMensagemMicrofone('Não foi possível converter a gravação para WAV.')
                    }
                }
            }

            gravadorAudio.current = gravador
            gravador.start()
            setMicrofoneAtivo(true)
            setMensagemMicrofone('Gravando. Desative o microfone para gerar o arquivo WAV.')
        } catch {
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
                <Titulo2>Aprenda notas e técnicas com dicas em tempo real.</Titulo2>
                <Texto>O assistente escuta sua execução, sugere alternativas mais fáceis e ajuda a construir um caminho mais suave para cada nova peça.</Texto>
            </Container>
            <ContainerRobo>
                <Robo src={Iconerobo} alt="Ícone" />
            </ContainerRobo>
            <CaixaButton>
                <MyButton type="button" onClick={alternarMicrofone} disabled={solicitandoPermissao} aria-pressed={microfoneAtivo}>
                {solicitandoPermissao ? 'Solicitando acesso...' : microfoneAtivo ? 'Desativar microfone' : 'Ativar microfone'}
                <Microfone src={Meumicrogone} alt="Ícone" />
                </MyButton>
                <StatusMicrofone role="status" aria-live="polite">{mensagemMicrofone}</StatusMicrofone>
                {arquivoWav && <LinkDownload href={arquivoWav.url} download={arquivoWav.nome}>Baixar gravação .wav</LinkDownload>}
            </CaixaButton>
        </main>
    )
}

export default Assistente