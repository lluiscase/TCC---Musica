import styled from 'styled-components'
import { LiquidGlassContainer } from '../../src/containers/Home/styles'

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

export const Overlay = styled.div`
    position:fixed;
    inset:0;
    z-index:100;
    display:grid;
    place-items:center;
    background:rgba(0,0,0,0.5);
    backdrop-filter:blur(8px);
`

export const Caixa = styled(LiquidGlassContainer)`
    width: min(40rem, calc(100% - 2rem));
    max-height: 85vh;
    overflow-y: auto;

`
