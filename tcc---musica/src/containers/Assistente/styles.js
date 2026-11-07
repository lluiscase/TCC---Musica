import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

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
export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: left;
    justify-content: left;
    margin-top: 2rem;
`
export const Titulo = styled.h2`
    color: #8800FF;
    font-size: 2.5rem;
    display: flex;
    justify-content: left;
    margin-top: 2rem;
    margin-left: 1.2rem;
`
export const Titulo2 = styled.h2`
    color: #FFFFFF;
    font-size: 2rem;
    display: flex;
    justify-content: center;
    margin-left: 1rem;
    margin-top: 1rem;
`
export const Texto = styled.p`
    color: #A1A1AA;
    font-size: 1.2rem;
    display: flex;
    justify-content: center;
    margin-left: 1.2rem;
`
export const ContainerRobo = styled.div`
    display: flex;
    flex-direction: center;
    align-items: center;
    justify-content: center;
    margin-top: 2rem;
`
export const Robo = styled.img`
    position: flex;
    right: 1.5rem;
    top: 1.7rem;
    transform: translateY(-50%);
    width: 20rem;
    margin-top: 15rem;
`
export const CaixaButton = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    height: auto;
`
export const Microfone = styled.img`
    item-align: left;
    width: auto;
    height: auto;
    margin-left: 1rem;
`
export const StatusMicrofone = styled.p`
    color: #A1A1AA;
    font-size: 1rem;
    margin: 0 1rem 2rem;
    text-align: center;
`
export const Secao = styled.section`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0 1.2rem 3rem;
`
export const TituloSecao = styled.h3`
    margin-top: 1.5em;
    color: #FFFFFF;
    font-size: 1.4rem;
`
// Título à esquerda e ação à direita, na mesma linha
export const CabecalhoSecao = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    h3 {
        margin: 0;
    }
`
export const BotaoSecundario = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.1rem;
    font-size: 1rem;
    color: #FFFFFF;
    background: rgba(18, 18, 22, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1.2rem;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover:not(:disabled) {
        border-color: #8800FF;
    }

    &:disabled {
        color: #A1A1AA;
        opacity: 0.6;
        cursor: not-allowed;
    }
`
export const ListaGravacoes = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    list-style: none;
`
export const ItemGravacao = styled.li`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid #242429;
    border-radius: 0.8rem;
    color: #A1A1AA;

    a {
        margin: 0;
    }
`
export const BotaoRemover = styled.button`
    color: #A1A1AA;
    background: none;
    border: 1px solid #242429;
    border-radius: 1rem;
    padding: 0.4rem 0.9rem;
    cursor: pointer;

    &:hover:not(:disabled) {
        color: #FFFFFF;
        border-color: #8800FF;
    }
`
export const Trecho = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
`
export const CampoTrecho = styled.label`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    color: #A1A1AA;

    input {
        width: 9rem;
        padding: 0.5rem 0.75rem;
        color: #FFFFFF;
        background-color: #111114;
        border: 1px solid #242429;
        border-radius: 0.6rem;
    }
`
export const LinkDownload = styled.a`
    color: #FFFFFF;
    font-size: 1rem;
    margin-bottom: 2rem;
    text-underline-offset: 0.25rem;
`
export const DescricaoSecao = styled.p`
    color: #A1A1AA;
    font-size: 1.2rem;
`
