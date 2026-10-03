import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

export const Cabecalho = styled.header`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin: 1rem 0 0 0;
    padding-bottom: 2rem;
    border-bottom: 1px solid #242429;
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
export const Titulo2= styled.h2`
    color: #FFFFFF;
    font-size: 2.5rem;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
`
export const Descricao = styled.p`
    color: #A1A1AA;
    font-size: 1.2rem;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    height: 3rem;
`

export const Destaque = styled.section`
    margin: 2rem auto;
    max-width: 50rem;
    border-radius: 1.5rem;
    height: 26rem;
    background-color: #242429;
`

export const Icone2 = styled.img`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 85%;
    max-width: 100%;
    margin-top: 1.5rem;
`

export const Caixa = styled.div`
    width: calc(100% - 2rem);
    max-width:25rem;
    box-sizing: border-box;
    padding: clamp(1rem, 1.25rem, 1.4rem);
    margin: 2rem auto 0;
    background-color: #242429;
    border-radius: 1.5rem;
    text-align: center;

    & > p {
        height: auto;
        line-height: 1.6;
        margin: 0;
    }
`

export const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: auto;
    flex: 1;
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
    bottom: 1rem;
`
export const CabecalhoBox = styled.div`
    display: flex;
    justify-content: left;
    align-items: center;
    gap: clamp(0.75rem, 4vw, 2rem);
    margin-bottom: 1rem;
    height: auto;
`
export const CaixaButton = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
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