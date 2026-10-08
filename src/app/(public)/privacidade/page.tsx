import type { Metadata } from "next";
import Link from "next/link";
import { Items, LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Quais dados o Freelin coleta, para quê, com quem compartilha e como você exerce seus direitos (LGPD).",
};

const sections: LegalSection[] = [
  {
    id: "controlador",
    title: "Quem cuida dos seus dados",
    body: (
      <p>
        O responsável pelo tratamento dos dados (controlador, na LGPD) é o Freelin, operado por Erick Fernandes, em Juiz
        de Fora, MG. Para qualquer assunto de privacidade, fale com a gente pelo botão de suporte do site ou pelos canais
        do rodapé.
      </p>
    ),
  },
  {
    id: "dados",
    title: "Quais dados coletamos",
    body: (
      <>
        <p>
          <strong className="text-ink">Conta:</strong> nome, e-mail, senha (guardada só em forma criptografada, nunca em
          texto) e o tipo de conta (freelancer ou contratante).
        </p>
        <p>
          <strong className="text-ink">Perfil de freelancer:</strong> foto, telefone ou WhatsApp, frase e apresentação,
          cidade onde mora, cidades onde aceita trabalhar e distância, funções, experiência, habilidades e dias e horários
          disponíveis.
        </p>
        <p>
          <strong className="text-ink">Perfil de contratante:</strong> nome da empresa ou da pessoa, logo ou foto,
          segmento, cidade, descrição, WhatsApp, e-mail e Instagram de contato.
        </p>
        <p>
          <strong className="text-ink">Uso da plataforma:</strong> vagas publicadas, candidaturas e mensagens enviadas
          nelas, contratações, avaliações dadas e recebidas, cursos, progresso e certificados, avisos e mensagens ao
          suporte.
        </p>
        <p>
          <strong className="text-ink">Visitantes do suporte:</strong> nome e contato informados no botão de suporte.
        </p>
        <p>
          <strong className="text-ink">Dados técnicos:</strong> cookies essenciais (veja abaixo) e registros de acesso,
          como endereço IP, data e hora, mantidos pelo nosso provedor de hospedagem.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Para que usamos",
    body: (
      <Items>
        <li>
          Criar e manter sua conta, mostrar vagas das suas cidades, conectar freelancers e contratantes e registrar
          contratações e avaliações. Base legal: execução de contrato (art. 7º, V, da LGPD).
        </li>
        <li>
          Mostrar seu perfil e sua reputação a quem contrata, manter a plataforma segura, prevenir fraudes e melhorar o
          Freelin. Base legal: legítimo interesse (art. 7º, IX).
        </li>
        <li>
          Enviar avisos sobre sua conta, como respostas do suporte e o e-mail de recuperação de senha. Base legal:
          execução de contrato.
        </li>
        <li>Guardar registros de acesso pelo prazo que a lei exige. Base legal: obrigação legal (art. 7º, II).</li>
      </Items>
    ),
  },
  {
    id: "compartilhamento",
    title: "Quem vê e com quem compartilhamos",
    body: (
      <>
        <Items>
          <li>
            Seu perfil profissional (nome, foto, funções, cidades, disponibilidade, nota, avaliações e cursos concluídos)
            pode ser visto por usuários logados, principalmente pelos contratantes das vagas em que você se candidata.
          </li>
          <li>O WhatsApp de contato aparece só para quem participa de uma contratação com você.</li>
          <li>As avaliações aparecem no perfil de quem foi avaliado.</li>
          <li>
            O certificado de um curso concluído é uma página pública com seu nome, o curso e a data, aberta para quem tiver
            o link ou o código.
          </li>
        </Items>
        <p>
          Usamos empresas que nos ajudam a operar o serviço: Vercel (hospedagem do site, nos Estados Unidos), Neon (banco
          de dados, com servidores em São Paulo) e um serviço de envio de e-mails. Quando há transferência para fora do
          Brasil, ela segue as garantias da LGPD (art. 33).
        </p>
        <p>
          <strong className="text-ink">Não vendemos seus dados</strong> e não os usamos para propaganda de outras
          empresas. Só compartilhamos com autoridades quando a lei obrigar.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <>
        <p>Usamos apenas cookies essenciais para o site funcionar:</p>
        <Items>
          <li>Sessão de login, para manter você conectado (até 30 dias).</li>
          <li>Conversa de suporte de visitantes, para mostrar a resposta no mesmo navegador (até 180 dias).</li>
        </Items>
        <p>
          Não usamos cookies de publicidade ou rastreamento. Vídeos e PDFs dos cursos podem ser exibidos a partir do
          YouTube, Vimeo ou Google Drive, que seguem as políticas dessas empresas.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: (
      <>
        <p>
          Guardamos seus dados enquanto sua conta existir. Quando a conta é excluída, apagamos os dados, inclusive as
          contratações e avaliações ligadas a ela, exceto o que a lei manda manter, como os registros de acesso por 6
          meses (Marco Civil da Internet).
        </p>
        <p>Links de recuperação de senha valem por 1 hora e só podem ser usados uma vez.</p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: (
      <p>
        As senhas são guardadas com criptografia de mão única, todo o tráfego do site é criptografado (HTTPS) e o acesso ao
        banco de dados é restrito. Nenhum sistema é 100% invulnerável. Se acontecer um incidente que possa trazer risco a
        você, avisaremos os afetados e a ANPD, como manda a lei.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: (
      <>
        <p>Pela LGPD (art. 18), você pode:</p>
        <Items>
          <li>Confirmar se tratamos seus dados e ter acesso a eles.</li>
          <li>Corrigir dados incompletos ou desatualizados. A maior parte você mesmo edita no seu perfil.</li>
          <li>Pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários.</li>
          <li>Pedir a portabilidade dos seus dados.</li>
          <li>Saber com quem compartilhamos seus dados.</li>
          <li>Pedir a exclusão da sua conta e dos seus dados.</li>
          <li>Reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </Items>
        <p>Faça o pedido pelo botão de suporte. Respondemos em até 15 dias.</p>
      </>
    ),
  },
  {
    id: "menores",
    title: "Menores de idade",
    body: <p>O Freelin é para pessoas com 18 anos ou mais. Não coletamos dados de menores de propósito.</p>,
  },
  {
    id: "mudancas",
    title: "Mudanças nesta política",
    body: (
      <p>
        Podemos atualizar esta política. A data no topo mostra a versão atual, e mudanças importantes serão avisadas no
        site. Veja também os{" "}
        <Link href="/termos" className="font-semibold text-brand hover:underline">
          Termos de Uso
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      updated="8 de outubro de 2026"
      intro={
        <p>
          Esta política explica quais dados o Freelin coleta, para que usa, com quem compartilha e como você exerce seus
          direitos, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>
      }
      sections={sections}
    />
  );
}
