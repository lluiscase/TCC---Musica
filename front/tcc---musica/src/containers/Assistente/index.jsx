import Meuicone from '../../assets/Vector.png'
import Iconerobo from '../../assets/Robo.png'
import Meumicrogone from '../../assets/Microfone.png'
import { MyButton } from '/components/Button/styles'
import { Icone, Cabecalho, H1, MenuLink, Container, Titulo, Titulo2, Texto, Robo, ContainerRobo,CaixaButton, Microfone } from './styles'

function Assistente(){
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
            <Container>
                <Titulo>Assistente</Titulo>
                <Titulo2>Aprenda notas e técnicas com dicas em tempo real.</Titulo2>
                <Texto>O assistente escuta sua execução, sugere alternativas mais fáceis e ajuda a construir um caminho mais suave para cada nova peça.</Texto>
            </Container>
            <ContainerRobo>
                <Robo src={Iconerobo} alt="Ícone" />
            </ContainerRobo>
            <CaixaButton>
                <MyButton>Ativar microfone
                <Microfone src={Meumicrogone} alt="Ícone" />
                </MyButton>
            </CaixaButton>
        </body>
    )
}

export default Assistente