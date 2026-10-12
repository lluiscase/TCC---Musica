import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function enviarAnalise(gravacoes, { inicio, fim } = {}) {
    const formData = new FormData()
    gravacoes.forEach((gravacao) => formData.append('audio', gravacao.blob, gravacao.nome))
    formData.append('executions', gravacoes.length)
    if (inicio !== '' && inicio != null) formData.append('startSecond', inicio)
    if (fim !== '' && fim != null) formData.append('endSecond', fim)

    const { data } = await api.post('/execute-analyse', formData)
    return data.content
}

export async function buscarAnalise(id) {
    const { data } = await api.get(`/result-analyse/${id}`)
    return data.content
}

export async function listarAnalises() {
    const { data } = await api.get('/analyses')
    return data.content
}

export function mensagemErro(erro) {
    return erro.response?.data?.error ?? 'Não foi possível conectar ao servidor.'
}

export async function buscarReferencia() {
    const { data } = await api.get('/reference')
    return data.content
}
