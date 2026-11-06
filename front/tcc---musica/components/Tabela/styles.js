import styled from 'styled-components'

export const Rolagem = styled.div`
    width: 100%;
    overflow-x: auto;
    border: 1px solid #242429;
    border-radius: 0.8rem;
`
export const Tabela = styled.table`
    width: 100%;
    border-collapse: collapse;
    color: #A1A1AA;
    font-size: 0.95rem;
    white-space: nowrap;

    th, td {
        padding: 0.7rem 1rem;
        text-align: left;
        border-bottom: 1px solid #242429;
    }

    th {
        color: #FFFFFF;
        font-weight: 600;
        background-color: #111114;
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    a {
        color: #8800FF;
    }
`
export const Linha = styled.tr`
    cursor: ${({ $clicavel }) => ($clicavel ? 'pointer' : 'default')};
    background-color: ${({ $selecionada }) => ($selecionada ? '#1a0f26' : 'transparent')};

    &:hover {
        background-color: ${({ $clicavel, $selecionada }) => ($clicavel || $selecionada ? '#1a0f26' : 'transparent')};
    }
`
export const Status = styled.span`
    color: ${({ $status }) => ({ completed: '#22C55E', failed: '#EF4444', processing: '#EAB308' }[$status] ?? '#A1A1AA')};
    font-weight: 600;
`
export const Vazio = styled.p`
    color: #A1A1AA;
    padding: 1rem;
`
