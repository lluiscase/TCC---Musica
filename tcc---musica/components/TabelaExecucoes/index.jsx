import { Rolagem, Tabela, Status } from '../Tabela/styles'
import { textoStatus, numero, sinal, porcentagem } from '../Tabela/formatar'

function TabelaExecucoes({ execucoes }) {
    return (
        <Rolagem>
            <Tabela>
                <thead>
                    <tr>
                        <th>Execução</th>
                        <th>Status</th>
                        <th>Duração</th>
                        <th>BPM</th>
                        <th>Δ BPM</th>
                        <th>Ataques (você / ref.)</th>
                        <th>Confiança média</th>
                        <th>Similaridade</th>
                        <th>Distância</th>
                        <th>Uniformidade (você / ref.)</th>
                        <th>Áudio com cliques</th>
                    </tr>
                </thead>
                <tbody>
                    {execucoes.map((execucao) => {
                        const comparacao = execucao.comparison
                        return (
                            <tr key={execucao.id}>
                                <td>{execucao.number}</td>
                                <td>
                                    <Status $status={execucao.status} title={execucao.error ?? undefined}>
                                        {textoStatus(execucao.status)}
                                    </Status>
                                </td>
                                <td>{execucao.audio ? `${numero(execucao.audio.duration)}s` : '—'}</td>
                                <td>{numero(execucao.BPM)}</td>
                                <td>{sinal(comparacao?.BPMDifference)}</td>
                                <td>{execucao.metrics ? `${execucao.metrics.onsetCount} / ${comparacao.referenceOnsetCount}` : '—'}</td>
                                <td>{porcentagem(execucao.metrics?.averageOnsetConfidence)}</td>
                                <td>{porcentagem(comparacao?.similarity)}</td>
                                <td>{numero(comparacao?.euclideanDistance, 2)}</td>
                                <td>{comparacao ? `${porcentagem(comparacao.evenness.user)} / ${porcentagem(comparacao.evenness.reference)}` : '—'}</td>
                                <td>
                                    {execucao.clicksAudio
                                        ? <audio controls preload="none" src={execucao.clicksAudio} />
                                        : execucao.error ?? '—'}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Tabela>
        </Rolagem>
    )
}

export default TabelaExecucoes
