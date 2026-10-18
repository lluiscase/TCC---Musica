import { Rolagem, Tabela } from '../Tabela/styles'
import { porcentagem, dataHora } from '../Tabela/formatar'
import { Cartao } from '../Referencia/styles'

function Modelo({ modelo, mensagem }) {
    if (!modelo) return <Cartao>{mensagem || 'Carregando modelo...'}</Cartao>

    const treinado = modelo.model

    return (
        <Cartao>
            <p>
                {treinado
                    ? `Treinado automaticamente em ${dataHora(treinado.trainedAt)} com ${treinado.samples} execuções de todos os usuários.`
                    : `Ainda não há execuções suficientes para treinar (${modelo.completedExecutions} concluídas). Enquanto isso, o feedback vem só da lógica fuzzy.`}
            </p>
            {treinado && (
                <Rolagem>
                    <Tabela>
                        <thead>
                            <tr>
                                <th>Erro</th>
                                <th>Execuções com o erro</th>
                                <th>Precisão</th>
                                <th>Revocação</th>
                                <th>F1</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modelo.errorTypes.map((tipo) => {
                                const metricas = treinado.metrics[tipo.type]
                                return (
                                    <tr key={tipo.type}>
                                        <td>{tipo.label}</td>
                                        {metricas
                                            ? (
                                                <>
                                                    <td>{metricas.positives}</td>
                                                    <td>{porcentagem(metricas.precision)}</td>
                                                    <td>{porcentagem(metricas.recall)}</td>
                                                    <td>{porcentagem(metricas.f1)}</td>
                                                </>
                                            )
                                            : <td colSpan={4}>Usando só a lógica fuzzy: {treinado.skipped[tipo.type]}</td>}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </Tabela>
                </Rolagem>
            )}
        </Cartao>
    )
}

export default Modelo
