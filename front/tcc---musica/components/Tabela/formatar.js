const STATUS = {
    pending: 'Na fila',
    processing: 'Processando',
    completed: 'Concluída',
    failed: 'Falhou',
}

export function textoStatus(status) {
    return STATUS[status] ?? status
}

export function numero(valor, casas = 1) {
    return valor == null ? '—' : valor.toFixed(casas)
}

export function sinal(valor, casas = 1) {
    return valor == null ? '—' : `${valor > 0 ? '+' : ''}${valor.toFixed(casas)}`
}

export function porcentagem(valor) {
    return valor == null ? '—' : `${Math.round(valor * 100)}%`
}

export function trecho(inicio, fim) {
    if (inicio == null && fim == null) return 'Completo'
    return `${inicio ?? 0}s – ${fim == null ? 'fim' : `${fim}s`}`
}

export function dataHora(iso) {
    return new Date(iso).toLocaleString('pt-BR')
}
