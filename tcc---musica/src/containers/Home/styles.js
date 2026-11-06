import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

// Efeito base de Liquid Glass reutilizável
export const LiquidGlassContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(36, 36, 41, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    border-radius: 1.5rem;
    padding: auto;
    box-sizing: border-box;
`
export const ContainerCabecalho = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`
export const Cabecalho = styled.header`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin: auto;
    padding-right: 1rem;
    padding-left: 1rem;
    padding-bottom: 1rem;
    padding-top: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(18, 18, 22, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 1.5rem;
`

export const H1 = styled.h1`
    color: #8800FF;
    font-size: 1.5rem;
    gap: 2rem;
    display: flex;
    justify-content: center;
    margin: 0;
`

export const MenuLink = styled(NavLink)`
    color: #8b8b8b;
    font-size: 1.5rem;
    margin: 0;
    text-decoration: none;
    font-weight: 700;
    transition: color 0.2s ease, text-decoration-color 0.2s ease;

    &:hover {
        color: #8800FF;
        text-decoration: underline;
        text-underline-offset: 0.35rem;
    }

    &.active {
        color: #8800FF;
        text-decoration: underline;
        text-underline-offset: 0.35rem;
    }
`

export const Icone = styled.img`
    position: absolute;
    left: 1.5rem;
    top: 1.7rem;
    transform: translateY(-50%);
    width: 2rem;
`

export const Titulo = styled.h2`
    color: #8800FF;
    font-size: 1.3rem;
    display: flex;
    justify-content: center;
    margin-top: 2rem;
`

export const Titulo2 = styled.h2`
    color: #FFFFFF;
    font-size: 2.5rem;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    text-align: center;
`

export const Descricao = styled.p`
    color: #A1A1AA;
    font-size: 1.2rem;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    height: 3rem;
`

export const Destaque = styled(LiquidGlassContainer)`
    margin: 2rem auto;
    max-width: 50rem;
    height: 26rem;
`

export const Icone2 = styled.img`
    width: 85%;
    max-width: 100%;
    margin: 0;
`

export const Caixa = styled(LiquidGlassContainer)`
    width: calc(100% - 2rem);
    max-width: 25rem;
    margin: 1.5rem auto 0;
    text-align: center;

    & > p {
        height: auto;
        line-height: 1.6;
        margin: 0;
    }
`

export const IconeAssistente = styled.img`
    width: 2.5rem;
    height: auto;
    flex: 0 0 auto;
`

export const TituloAssistente = styled.h2`
    color: #FFFFFF;
    font-size: 1.5rem;
    display: flex;
    justify-content: center;
    bottom: 1.5rem;
`

export const CabecalhoBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: clamp(0.75rem, 4vw, 2rem);
    margin-bottom: 1rem;
    height: auto;
`

export const CaixaButton = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;
    height: auto;
`

export const IconeSeta = styled.img`
    width: auto;
    height: auto;
    margin-left: 1rem;
`

export const Link = styled(NavLink)`
    color: #030303;
    font-size: 1.5rem;
    margin: 0;
    text-decoration: none;
    font-weight: 700;
    transition: color 0.2s ease, text-decoration-color 0.2s ease;
`

export const Secao = styled(LiquidGlassContainer)`
    margin: 2rem auto;
    max-width: 60rem;
    width: 90%;
`