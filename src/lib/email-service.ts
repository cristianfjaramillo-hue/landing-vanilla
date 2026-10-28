import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase";

export interface EmailConfig {
  provider: "resend" | "gmail" | "smtp";
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  toEmail?: string;
}

// Obtener la configuración activa (prioridad: variables de entorno válidas, luego Supabase)
export async function getActiveEmailConfig(): Promise<EmailConfig | null> {
  // 1. Verificar variables de entorno
  const envResend = process.env.RESEND_API_KEY;
  if (envResend && envResend.startsWith("re_") && envResend !== "re_tuApiKeyDeResendAqui") {
    return {
      provider: "resend",
      resendApiKey: envResend,
      fromEmail: process.env.NOTIFICATION_EMAIL_FROM || "Amazon Vanilla <onboarding@resend.dev>",
      toEmail: process.env.NOTIFICATION_EMAIL_TO || process.env.ADMIN_EMAIL || "cristian.f.jaramillo@gmail.com",
    };
  }

  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;
  if (
    envHost &&
    envUser &&
    envPass &&
    envUser !== "notificaciones@tudominio.com" &&
    envPass !== "tuPasswordSMTP"
  ) {
    return {
      provider: envHost.includes("gmail") ? "gmail" : "smtp",
      smtpHost: envHost,
      smtpPort: Number(process.env.SMTP_PORT) || (envHost.includes("gmail") ? 465 : 587),
      smtpUser: envUser,
      smtpPass: envPass,
      smtpSecure: process.env.SMTP_SECURE === "true" || envHost.includes("gmail"),
      fromEmail: process.env.NOTIFICATION_EMAIL_FROM || `"Amazon Vanilla" <${envUser}>`,
      toEmail: process.env.NOTIFICATION_EMAIL_TO || process.env.ADMIN_EMAIL || "cristian.f.jaramillo@gmail.com",
    };
  }

  // 2. Si no están en variables de entorno, consultar configuración guardada en Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from("reportes_diarios")
      .select("data")
      .eq("report_id", "CONFIG_EMAIL")
      .single();

    if (!error && data?.data) {
      return data.data as EmailConfig;
    }
  } catch (err) {
    console.warn("Aviso consultando CONFIG_EMAIL en Supabase:", err);
  }

  return null;
}

// Guardar configuración en Supabase
export async function saveEmailConfig(config: EmailConfig): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("reportes_diarios").upsert(
      [
        {
          report_id: "CONFIG_EMAIL",
          lote: "CONFIGURACION_SISTEMA",
          responsable: "ADMIN",
          fecha_reporte: new Date().toISOString().split("T")[0],
          data: config,
        },
      ],
      { onConflict: "report_id" }
    );

    if (error) {
      console.warn("Error guardando CONFIG_EMAIL en Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Excepción guardando CONFIG_EMAIL:", err);
    return false;
  }
}

// Función central para enviar correos reales
export async function sendAppEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to?: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType?: string;
  }>;
}): Promise<{
  success: boolean;
  provider?: string;
  messageId?: string;
  recipient?: string;
  error?: string;
}> {
  const config = await getActiveEmailConfig();
  const recipient = to || config?.toEmail || process.env.NOTIFICATION_EMAIL_TO || "cristian.f.jaramillo@gmail.com";

  if (!config) {
    return {
      success: false,
      recipient,
      error:
        "No hay proveedor de correo configurado. Es necesario registrar tu API Key de Resend o tu Contraseña de Aplicación de Gmail para poder despachar correos reales a " +
        recipient,
    };
  }

  // Enviar vía Resend
  if (config.provider === "resend" && config.resendApiKey) {
    try {
      const payload: any = {
        from: config.fromEmail || "Amazon Vanilla <onboarding@resend.dev>",
        to: [recipient],
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok) {
        return {
          success: true,
          provider: "resend",
          messageId: resData.id,
          recipient,
        };
      } else {
        return {
          success: false,
          provider: "resend",
          recipient,
          error: resData.message || resData.error || "Error devuelto por la API de Resend",
        };
      }
    } catch (e: any) {
      return {
        success: false,
        provider: "resend",
        recipient,
        error: "Excepción al conectar con Resend: " + e.message,
      };
    }
  }

  // Enviar vía Gmail o SMTP
  if ((config.provider === "gmail" || config.provider === "smtp") && config.smtpUser && config.smtpPass) {
    try {
      const isGmail = config.provider === "gmail" || (config.smtpHost && config.smtpHost.includes("gmail"));
      const host = isGmail ? "smtp.gmail.com" : config.smtpHost || "smtp.gmail.com";
      const port = config.smtpPort || (isGmail ? 465 : 587);
      const secure = config.smtpSecure ?? (port === 465);

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass.replace(/\s+/g, ""), // Eliminar espacios accidentales de contraseñas de app de Google
        },
      });

      const mailOptions: any = {
        from: config.fromEmail || `"Amazon Vanilla Waorani" <${config.smtpUser}>`,
        to: recipient,
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.from(att.content, "base64"),
          contentType: att.contentType || "application/pdf",
        }));
      }

      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        provider: isGmail ? "gmail" : "smtp",
        messageId: info.messageId,
        recipient,
      };
    } catch (smtpErr: any) {
      return {
        success: false,
        provider: "smtp",
        recipient,
        error: "Error de autenticación o conexión SMTP: " + smtpErr.message,
      };
    }
  }

  return {
    success: false,
    recipient,
    error: "Configuración de correo incompleta.",
  };
}
