import { Rolagem, Tabela, Linha, Status, Vazio } from '../Tabela/styles'
import { textoStatus, numero, porcentagem, trecho, dataHora } from '../Tabela/formatar'

function TabelaAnalises({ analises, selecionada, onSelecionar }) {
    if (analises.length === 0) {
        return <Rolagem><Vazio>Nenhuma análise enviada ainda.</Vazio></Rolagem>
    }

    return (
        <Rolagem>
            <Tabela>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Execuções</th>
                        <th>Trecho</th>
                        <th>BPM médio</th>
                        <th>Similaridade média</th>
                    </tr>
                </thead>
                <tbody>
                    {analises.map((analise) => (
                        <Linha
                            key={analise.id}
                            $clicavel
                            $selecionada={analise.id === selecionada}
                            onClick={() => onSelecionar(analise.id)}
                            title="Ver execuções"
                        >
                            <td>{analise.id}</td>
                            <td>{dataHora(analise.createdAt)}</td>
                            <td>
                                <Status $status={analise.status}>
                                    {textoStatus(analise.status)}
                                    {analise.status === 'processing' && ` (${analise.progress}%)`}
                                </Status>
                            </td>
                            <td>{analise.completedExecutions} / {analise.totalExecutions}</td>
                            <td>{trecho(analise.startSecond, analise.endSecond)}</td>
                            <td>{numero(analise.averageBPM)}</td>
                            <td>{porcentagem(analise.averageSimilarity)}</td>
                        </Linha>
                    ))}
                </tbody>
            </Tabela>
        </Rolagem>
    )
}

export default TabelaAnalises
