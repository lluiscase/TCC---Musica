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
export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: left;
    justify-content: left;
    margin-top: 2rem;
`
export const Titulo = styled.h2`
    color: #8800FF;
    font-size: 1.3rem;
    display: flex;
    justify-content: left;
    margin-top: 2rem;
    margin-left: 1.2rem;
`
export const Titulo2 = styled.h2`
    color: #FFFFFF;
    font-size: 2.5rem;
    display: flex;
    justify-content: left;
    margin-left: 1rem;
    margin-top: 1rem;
`
export const Texto = styled.p`
    color: #A1A1AA;
    font-size: 1.2rem;
    display: flex;
    justify-content: left;
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