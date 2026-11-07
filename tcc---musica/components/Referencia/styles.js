import styled, { css } from 'styled-components'

// Mesmo vidro do LiquidGlassContainer do Assistente
const vidro = css`
    background: rgba(36, 36, 41, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
`

export const Cartao = styled.div`
    ${vidro}
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
    border-radius: 1.5rem;
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
export const Barra = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.75rem;
`
export const Campo = styled.label`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    color: #A1A1AA;
    flex: 1 1 16rem;
    max-width: 28rem;

    select,
    input {
        width: 100%;
        padding: 0.6rem 0.75rem;
        color: #FFFFFF;
        background: rgba(18, 18, 22, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0.8rem;
        font-size: 1rem;
    }

    option {
        background-color: #121216;
    }
`
export const Botao = styled.button`
    padding: 0.6rem 1.1rem;
    font-size: 1rem;
    border-radius: 1.2rem;
    cursor: pointer;
    color: ${({ $principal }) => ($principal ? '#070709' : '#A1A1AA')};
    background: ${({ $principal }) => ($principal ? '#8800FF' : 'rgba(18, 18, 22, 0.6)')};
    border: 1px solid ${({ $principal }) => ($principal ? '#8800FF' : 'rgba(255, 255, 255, 0.08)')};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

    &:hover:not(:disabled) {
        color: ${({ $principal }) => ($principal ? '#070709' : '#FFFFFF')};
        background: ${({ $principal }) => ($principal ? '#6a00cc' : 'rgba(18, 18, 22, 0.6)')};
        border-color: ${({ $principal }) => ($principal ? '#6a00cc' : '#8800FF')};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`
export const Nova = styled.div`
    ${vidro}
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px dashed rgba(136, 0, 255, 0.6);
    border-radius: 1.5rem;
    color: #A1A1AA;

    strong {
        color: #FFFFFF;
    }

    audio {
        width: 100%;
        max-width: 32rem;
    }
`
/* Seletor de referência com play em cada item */

export const Seletor = styled.div`
    position: relative;
    flex: 1 1 16rem;
    max-width: 28rem;
`
export const Gatilho = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0.6rem 0.75rem;
    color: #FFFFFF;
    font-size: 1rem;
    text-align: left;
    background: rgba(18, 18, 22, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.8rem;
    cursor: pointer;

    &[aria-expanded='true'],
    &:hover:not(:disabled) {
        border-color: #8800FF;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`
export const Lista = styled.ul`
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    max-height: 16rem;
    overflow-y: auto;
    padding: 0.4rem;
    list-style: none;
    background: rgba(18, 18, 22, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.8rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
`
export const Item = styled.li`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    border-radius: 0.6rem;
    color: ${({ $ativa }) => ($ativa ? '#FFFFFF' : '#A1A1AA')};
    background: ${({ $ativa }) => ($ativa ? 'rgba(136, 0, 255, 0.18)' : 'transparent')};

    &:hover {
        background: rgba(136, 0, 255, 0.12);
        color: #FFFFFF;
    }

    svg {
        flex-shrink: 0;
    }
`
export const NomeItem = styled.button`
    flex: 1;
    padding: 0.4rem 0;
    color: inherit;
    font-size: 1rem;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
`
export const BotaoTocar = styled.button`
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    color: ${({ $tocando }) => ($tocando ? '#070709' : '#FFFFFF')};
    background: ${({ $tocando }) => ($tocando ? '#8800FF' : 'rgba(255, 255, 255, 0.06)')};
    border: 1px solid ${({ $tocando }) => ($tocando ? '#8800FF' : 'rgba(255, 255, 255, 0.08)')};
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover {
        border-color: #8800FF;
    }
`

export const Aviso = styled.p`
    color: #A1A1AA;
    font-size: 1rem;
`
