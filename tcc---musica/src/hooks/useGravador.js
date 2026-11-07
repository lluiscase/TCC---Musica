import { useEffect, useRef, useState } from 'react'

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

export function nomeWav(prefixo) {
    return `${prefixo}-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`
}

/**
 * Grava o microfone em WAV.
 * iniciar() pede a permissão e começa a gravar, lança Error com a mensagem para o usuário.
 * parar() termina e devolve o Blob .wav, ou null se nada foi capturado.
 */
export function useGravador() {
    const [gravando, setGravando] = useState(false)
    const [solicitando, setSolicitando] = useState(false)
    const fluxo = useRef(null)
    const gravacao = useRef(null)
    const ativo = useRef(true)

    useEffect(() => {
        ativo.current = true

        return () => {
            ativo.current = false
            gravacao.current?.contexto.close()
            gravacao.current = null
            fluxo.current?.getTracks().forEach((faixa) => faixa.stop())
        }
    }, [])

    async function iniciar() {
        if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.AudioWorkletNode) {
            throw new Error('Este navegador não oferece suporte para gravar o áudio.')
        }

        setSolicitando(true)
        let contexto
        try {
            // Sem os filtros de voz do navegador, que cortam e distorcem o som do instrumento
            fluxo.current = await navigator.mediaDevices.getUserMedia({
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

            const fonte = contexto.createMediaStreamSource(fluxo.current)
            const processador = new AudioWorkletNode(contexto, 'gravador')
            const blocos = []
            processador.port.onmessage = (evento) => blocos.push(evento.data)
            fonte.connect(processador)
            // A saída é silenciosa, a conexão só mantém o processador rodando
            processador.connect(contexto.destination)

            if (!ativo.current) {
                contexto.close()
                fluxo.current.getTracks().forEach((faixa) => faixa.stop())
                return
            }

            gravacao.current = { contexto, fonte, processador, blocos }
            setGravando(true)
        } catch (erro) {
            console.error(erro)
            contexto?.close()
            fluxo.current?.getTracks().forEach((faixa) => faixa.stop())
            fluxo.current = null
            throw new Error('Não foi possível gravar o áudio. Verifique a permissão do microfone.', { cause: erro })
        } finally {
            if (ativo.current) setSolicitando(false)
        }
    }

    async function parar() {
        if (!gravacao.current) return null

        const { contexto, fonte, processador, blocos } = gravacao.current
        gravacao.current = null
        fonte.disconnect()
        processador.disconnect()
        processador.port.onmessage = null
        fluxo.current.getTracks().forEach((faixa) => faixa.stop())
        fluxo.current = null
        setGravando(false)

        try {
            await contexto.close()
            if (blocos.length === 0) return null
            return converterParaWav(juntarBlocos(blocos), contexto.sampleRate)
        } catch (erro) {
            console.error(erro)
            throw new Error('Não foi possível gerar o arquivo WAV.', { cause: erro })
        }
    }

    return { gravando, solicitando, iniciar, parar }
}
