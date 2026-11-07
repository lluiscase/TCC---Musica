import Iconerobo from "../../../assets/Robo.png";
import { Container, Titulo2, Texto, Robo, ContainerRobo, CaixaButton } from "../styles";
import { MyButton } from "/components/Button/styles";
export default function StepZero({onAvancar}){
    return(
        <Container>
        <Titulo2>Aprenda ritmo e técnicas com dicas em tempo real.</Titulo2>
        <Texto>
          O assistente escuta sua execução, sugere alternativas mais fáceis e
          ajuda a construir um caminho mais suave para cada nova peça.
        </Texto>
        <ContainerRobo>
          <Robo src={Iconerobo} alt="Ícone" />
        </ContainerRobo>
         <CaixaButton>
          <MyButton
            type="button"
            onClick={onAvancar}
          >
            Escolha a referencia
          </MyButton>
        </CaixaButton>
       
      </Container>
    )
}