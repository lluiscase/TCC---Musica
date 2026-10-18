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
