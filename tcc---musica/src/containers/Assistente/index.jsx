import Meuicone from "../../assets/Vector.png";
import { useState } from "react";
import useHook from "./hook";
import { Icone, Cabecalho, H1, MenuLink, ContainerCabecalho } from "./styles";

import StepZero from "./steps";
import StepOne from "./steps/StepOne";

const stepSection = [
  { Component: StepZero, step: 0 },
  { Component: StepOne, step: 1 },
];

function Assistente() {
  // Estado compartilhado por todos os steps (referências, gravações, análise...)
  const dados = useHook();
  const [step, setStep] = useState(0);

  return (
    <main>
      <header>
        <Icone src={Meuicone} alt="Ícone" />
        <ContainerCabecalho>
          <Cabecalho>
            <H1>
              <MenuLink to="/" end>
                Home
              </MenuLink>
              <MenuLink to="/assistente">Assistente</MenuLink>
            </H1>
          </Cabecalho>
        </ContainerCabecalho>
      </header>
      {stepSection
        .filter((e) => e.step === step)
        .map((e) => (
          <e.Component
            key={e.step}
            {...dados}
            onAvancar={() => setStep((atual) => Math.min(atual + 1, stepSection.length - 1))}
            onVoltar={() => setStep((atual) => Math.max(atual - 1, 0))}
          />
        ))}
    </main>
  );
}

export default Assistente;
