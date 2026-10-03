
import Meuicone from '../../assets/Vector.png'
import Guitarra from '../../assets/hero-image.png'
import iconeAssistente from '../../assets/Frame.png'
import { Icone, Icone2, Container, Destaque, Caixa, Titulo, Titulo2, Descricao, Cabecalho, Texto, Texto2, IconeAssistente } from './styles'

function Home(){
    return(
        <body>
        <header>
            <Icone src={Meuicone} alt="Ícone" />
            <Cabecalho>
                <Texto to="/front/tcc---musica/src/containers/Home">Home</Texto>
                <Texto2 to="/front/tcc---musica/src/containers/Artistas">Artistas</Texto2>
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
                <Titulo2> Assistente Musical</Titulo2>
                <IconeAssistente src={iconeAssistente} alt="Ícone" />
                <Descricao>O Assistente analisa seu progresso, sugere exercícios e ajuda a melhorar a técnica com orientações guiadas pela IA.</Descricao>
            </Caixa>
        </body>
    )
}

export default Home