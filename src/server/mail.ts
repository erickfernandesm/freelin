import "server-only";

/**
 * Envio de e-mail transacional por API HTTP (sem dependência extra).
 * Provedor escolhido pelas variáveis de ambiente:
 *  - BREVO_API_KEY  (grátis até 300/dia; remetente = um e-mail verificado no Brevo, não exige domínio)
 *  - RESEND_API_KEY (exige domínio próprio verificado no Resend)
 * MAIL_FROM_EMAIL e MAIL_FROM_NAME definem o remetente.
 * Sem nenhuma chave, o e-mail é só registrado no log (útil em desenvolvimento).
 */

export type Mail = { to: string; toName?: string; subject: string; html: string; text: string };

export function mailConfigured() {
  return Boolean((process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) && process.env.MAIL_FROM_EMAIL);
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  const fromName = process.env.MAIL_FROM_NAME || "Freelin";

  try {
    if (process.env.BREVO_API_KEY && fromEmail) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { email: fromEmail, name: fromName },
          to: [{ email: mail.to, ...(mail.toName ? { name: mail.toName } : {}) }],
          subject: mail.subject,
          htmlContent: mail.html,
          textContent: mail.text,
        }),
      });
      if (!res.ok) console.error("[mail] Brevo", res.status, await res.text());
      return res.ok;
    }

    if (process.env.RESEND_API_KEY && fromEmail) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
      });
      if (!res.ok) console.error("[mail] Resend", res.status, await res.text());
      return res.ok;
    }
  } catch (err) {
    console.error("[mail] falha de rede", err);
    return false;
  }

  console.warn(`[mail] nenhum provedor configurado; e-mail para ${mail.to} não enviado: ${mail.subject}\n${mail.text}`);
  return false;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Layout simples e compatível com clientes de e-mail: texto, um botão e o link por extenso */
export function brandedEmail({ greeting, lines, button, footer }: { greeting: string; lines: string[]; button: { label: string; href: string }; footer: string }) {
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#0f1b3d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #e3e8f2">
<tr><td style="background:#2c67e8;border-radius:20px 20px 0 0;padding:22px 28px;font-size:22px;font-weight:bold;color:#ffffff">Freelin</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 14px;font-size:17px;font-weight:bold">${escape(greeting)}</p>
${lines.map((l) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:#3b4664">${escape(l)}</p>`).join("")}
<p style="margin:24px 0"><a href="${escape(button.href)}" style="display:inline-block;background:#2c67e8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 22px;border-radius:12px">${escape(button.label)}</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#6b7591">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all;color:#2c67e8">${escape(button.href)}</span></p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e3e8f2;font-size:12px;color:#6b7591">${escape(footer)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [greeting, "", ...lines, "", `${button.label}: ${button.href}`, "", footer].join("\n");
  return { html, text };
}
