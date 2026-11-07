import styled from 'styled-components'

export const Lista = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    list-style: none;
`
export const Cartao = styled.li`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid #242429;
    border-radius: 0.8rem;
    color: #A1A1AA;

    h4 {
        color: #FFFFFF;
        font-size: 1.1rem;
    }
`
export const Erros = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    list-style: none;

    strong {
        color: #FFFFFF;
    }
`
export const Positivo = styled.p`
    color: #22C55E;
`
