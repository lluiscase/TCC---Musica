import Meuicone from '../../assets/Vector.png'
import Guitarra from '../../assets/hero-image.png'
import iconeAssistente from '../../assets/Frame.png'
import Seta from '../../assets/Seta.png'
import { MyButton } from '/components/Button/styles'
import { useNavigate } from 'react-router-dom'
import { H1, Icone, Icone2, IconeSeta, CaixaButton, CabecalhoBox, TituloAssistente, Container, Destaque, Caixa, Titulo, Titulo2, Descricao, Cabecalho, IconeAssistente, MenuLink } from './styles'

function Home(){
    const navigate = useNavigate()

    return(
        <body>
        <header>
            <Icone src={Meuicone} alt="Ícone" />
            <Cabecalho>
                <H1>
                    <MenuLink to="/" end>Home</MenuLink>
                    <MenuLink to="/assistente">Assistente</MenuLink>
                </H1>
            </Cabecalho>
        </header>
            <Titulo>Bem-vindo ao ---</Titulo>
            <Titulo2>A aplicação que conecta música e inteligência artificial</Titulo2>
            <Descricao>Aqui você descobre como o Assistente transforma sua prática musical com orientações personalizadas.</Descricao>
            <Destaque>
            <Container>
            <Icone2 src={Guitarra} alt="Ícone" />
            </Container>
            </Destaque>
            <Caixa>
                <CabecalhoBox>
                    <IconeAssistente src={iconeAssistente} alt="Ícone" />
                    <TituloAssistente> Assistente Musical</TituloAssistente>
                </CabecalhoBox>
                <Descricao>O Assistente analisa seu progresso, sugere exercícios e ajuda a melhorar a técnica com orientações guiadas pela IA.</Descricao>
            </Caixa>
            <CaixaButton>
                <MyButton onClick={() => navigate('/assistente')}>
                    Ir para o Assistente
                    <IconeSeta src={Seta} alt="Ícone" />
                </MyButton>
            </CaixaButton>
        </body>
    )
}

export default Home