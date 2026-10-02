
import Meuicone from '../../assets/Vector.png'
import Guitarra from '../../assets/hero-image.png'
import { Icone, Icone2 } from './styles'
import { Texto } from './styles'
import { Texto2 } from './styles'
import { Cabecalho } from './styles'
import { Descricao } from './styles'
import { Titulo } from './styles'
import { Titulo2 } from './styles'

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
            <Icone2 src={Guitarra} alt="Ícone" />
        </body>
    )
}

export default Home