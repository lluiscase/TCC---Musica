import styled from 'styled-components'

export const Cartao = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
    border: 1px solid #242429;
    border-radius: 0.8rem;
    color: #A1A1AA;

    audio {
        width: 100%;
        max-width: 32rem;
    }
`
export const Metricas = styled.dl`
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem 2.5rem;

    dt {
        font-size: 0.85rem;
    }

    dd {
        color: #FFFFFF;
        font-size: 1.3rem;
        font-weight: 600;
    }
`
export const Legenda = styled.p`
    font-size: 0.9rem;
`
export const Compassos = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-x: auto;
`
export const Compasso = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.85rem;
    white-space: nowrap;

    > span {
        width: 5.5rem;
        flex-shrink: 0;
    }
`
export const Grade = styled.div`
    display: flex;
    gap: 0.2rem;
    flex-shrink: 0;
`
export const Passo = styled.span`
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 0.25rem;
    /* Separa os tempos (4 semicolcheias) */
    margin-left: ${({ $inicioTempo, $primeiro }) => ($inicioTempo && !$primeiro ? '0.5rem' : '0')};
    background-color: ${({ $ataque }) => ($ataque ? '#8800FF' : '#1A1A1F')};
`
