import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function enviarAnalise(gravacoes, { referenciaId, inicio, fim } = {}) {
    const formData = new FormData()
    gravacoes.forEach((gravacao) => formData.append('audio', gravacao.blob, gravacao.nome))
    formData.append('executions', gravacoes.length)
    if (referenciaId != null) formData.append('referenceId', referenciaId)
    if (inicio !== '' && inicio != null) formData.append('startSecond', inicio)
    if (fim !== '' && fim != null) formData.append('endSecond', fim)

    const { data } = await api.post('/execute-analyse', formData)
    return data.content
}

export async function buscarAnalise(id) {
    const { data } = await api.get(`/result-analyse/${id}`)
    return data.content
}

export async function listarAnalises(referenciaId) {
    const { data } = await api.get('/analyses', { params: { referenceId: referenciaId ?? undefined } })
    return data.content
}

export function mensagemErro(erro) {
    return erro.response?.data?.error ?? 'Não foi possível conectar ao servidor.'
}

export async function listarReferencias() {
    const { data } = await api.get('/references')
    return data.content
}

export async function buscarReferencia(id) {
    const { data } = await api.get(`/references/${id}`)
    return data.content
}

export async function criarReferencia(audio, nomeArquivo, nome) {
    const formData = new FormData()
    formData.append('audio', audio, nomeArquivo)
    formData.append('name', nome)

    const { data } = await api.post('/references', formData)
    return data.content
}

export async function buscarModelo() {
    const { data } = await api.get('/model')
    return data.content
}
