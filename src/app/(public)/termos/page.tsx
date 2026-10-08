import type { Metadata } from "next";
import Link from "next/link";
import { Items, LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "As regras para usar o Freelin, para freelancers e contratantes.",
};

const sections: LegalSection[] = [
  {
    id: "quem-somos",
    title: "O que é o Freelin",
    body: (
      <>
        <p>
          O Freelin é uma plataforma online que aproxima pessoas que procuram trabalho (freelancers) de pessoas e empresas
          que precisam contratar (contratantes). Também oferece cursos para quem quer aprender uma função nova.
        </p>
        <p>
          O Freelin é operado por Erick Fernandes, em Juiz de Fora, MG. Para falar com a gente, use o botão de suporte do
          site ou os canais do rodapé.
        </p>
      </>
    ),
  },
  {
    id: "aceite",
    title: "Aceite destes termos",
    body: (
      <p>
        Ao criar uma conta ou usar o Freelin, você concorda com estes Termos de Uso e com a{" "}
        <Link href="/privacidade" className="font-semibold text-brand hover:underline">
          Política de Privacidade
        </Link>
        . Se não concordar, não use a plataforma.
      </p>
    ),
  },
  {
    id: "quem-pode-usar",
    title: "Quem pode usar",
    body: (
      <Items>
        <li>Pessoas com 18 anos ou mais e empresas regularmente constituídas.</li>
        <li>As informações do cadastro e do perfil precisam ser verdadeiras e estar atualizadas.</li>
        <li>Cada pessoa pode ter uma conta. A conta é pessoal e não pode ser vendida ou emprestada.</li>
        <li>Você é responsável por guardar sua senha e por tudo o que for feito com a sua conta.</li>
      </Items>
    ),
  },
  {
    id: "como-funciona",
    title: "Como o Freelin funciona",
    body: (
      <>
        <p>
          Contratantes publicam oportunidades, freelancers demonstram interesse e o contratante escolhe quem vai trabalhar.
          Depois do trabalho, os dois confirmam a conclusão e se avaliam.
        </p>
        <p>
          <strong className="text-ink">O Freelin não é empregador, agência nem parte da contratação.</strong> A plataforma
          não escolhe candidatos e não garante vagas, contratações, pagamentos ou a qualidade do trabalho. Valores,
          horários, forma de pagamento e obrigações trabalhistas, fiscais e previdenciárias são combinados e cumpridos
          diretamente entre contratante e freelancer.
        </p>
        <p>O uso do Freelin para publicar vagas e se candidatar é gratuito para freelancers e contratantes.</p>
      </>
    ),
  },
  {
    id: "contratantes",
    title: "Responsabilidades de quem contrata",
    body: (
      <Items>
        <li>Publicar apenas oportunidades reais e lícitas, com informações corretas de valor, dia, horário e local.</li>
        <li>Pagar o que foi combinado e tratar os freelancers com respeito.</li>
        <li>
          Não discriminar candidatos por raça, cor, gênero, orientação sexual, religião, deficiência, origem, idade ou
          qualquer outro motivo proibido por lei.
        </li>
        <li>Cumprir a legislação aplicável à contratação, inclusive trabalhista e de segurança.</li>
      </Items>
    ),
  },
  {
    id: "freelancers",
    title: "Responsabilidades de quem trabalha",
    body: (
      <Items>
        <li>Manter o perfil, as cidades e a disponibilidade verdadeiros e atualizados.</li>
        <li>Comparecer ao trabalho combinado ou avisar o contratante com antecedência se não puder ir.</li>
        <li>Cumprir o que foi combinado e tratar o contratante e as outras pessoas com respeito.</li>
      </Items>
    ),
  },
  {
    id: "avaliacoes",
    title: "Avaliações e reputação",
    body: (
      <Items>
        <li>Só é possível avaliar depois de um trabalho concluído e confirmado pelos dois lados.</li>
        <li>As avaliações precisam ser honestas e sobre o trabalho realizado.</li>
        <li>É proibido oferecer ou cobrar qualquer vantagem em troca de avaliação.</li>
        <li>O Freelin pode ocultar avaliações ofensivas, falsas ou que desrespeitem estes termos.</li>
      </Items>
    ),
  },
  {
    id: "proibido",
    title: "O que não é permitido",
    body: (
      <Items>
        <li>Publicar vagas falsas, enganosas ou que escondam golpes.</li>
        <li>Cobrar qualquer valor de freelancers para se candidatar ou para serem contratados.</li>
        <li>Publicar conteúdo ilegal, ofensivo, discriminatório ou de cunho sexual.</li>
        <li>Enviar spam ou usar os dados de outros usuários para fins diferentes da contratação.</li>
        <li>Acessar contas de outras pessoas, tentar burlar a segurança ou prejudicar o funcionamento do site.</li>
      </Items>
    ),
  },
  {
    id: "cursos",
    title: "Cursos",
    body: (
      <Items>
        <li>Os cursos podem ser oferecidos pelo Freelin ou por parceiros, indicados na página de cada curso.</li>
        <li>
          Em cursos pagos, o acesso é liberado depois da confirmação do pagamento. Em assinaturas, o acesso vale pelo
          período pago.
        </li>
        <li>
          Você pode desistir de uma compra em até 7 dias após a liberação do acesso e pedir o reembolso pelo suporte,
          conforme o Código de Defesa do Consumidor.
        </li>
        <li>
          O certificado do Freelin atesta que você concluiu o conteúdo do curso na plataforma. Ele não substitui diplomas
          ou certificações reconhecidas pelo MEC ou por conselhos profissionais.
        </li>
        <li>O conteúdo dos cursos é para uso pessoal. É proibido copiar, gravar, revender ou compartilhar.</li>
      </Items>
    ),
  },
  {
    id: "suspensao",
    title: "Suspensão e exclusão de contas",
    body: (
      <>
        <p>
          O Freelin pode suspender ou excluir contas que desrespeitem estes termos ou a lei, ou que coloquem outros usuários
          em risco, avisando sempre que possível.
        </p>
        <p>Você pode pedir a exclusão da sua conta a qualquer momento pelo suporte.</p>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Limites de responsabilidade",
    body: (
      <p>
        Trabalhamos para manter o Freelin no ar e funcionando bem, mas a plataforma pode ter interrupções. O Freelin não
        responde por atos, combinados ou informações dos usuários entre si, nem por prejuízos indiretos do uso da
        plataforma. Nada nestes termos afasta os direitos garantidos pelo Código de Defesa do Consumidor.
      </p>
    ),
  },
  {
    id: "propriedade",
    title: "Marca e conteúdo",
    body: (
      <p>
        A marca, o logo e o visual do Freelin pertencem ao Freelin. O conteúdo que você publica (perfil, fotos, vagas,
        avaliações) continua sendo seu, e você autoriza o Freelin a exibi-lo dentro da plataforma enquanto ele estiver
        publicado.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Mudanças nestes termos",
    body: (
      <p>
        Podemos atualizar estes termos para acompanhar mudanças no Freelin ou na lei. A data no topo mostra a versão
        atual, e mudanças importantes serão avisadas no site.
      </p>
    ),
  },
  {
    id: "lei",
    title: "Lei e foro",
    body: (
      <p>
        Estes termos seguem as leis do Brasil. Para consumidores, vale o foro do seu domicílio. Nos demais casos, fica
        eleito o foro da Comarca de Juiz de Fora, MG.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      updated="8 de outubro de 2026"
      intro={<p>Estas são as regras para usar o Freelin. Escrevemos de forma direta para que todo mundo entenda.</p>}
      sections={sections}
    />
  );
}
