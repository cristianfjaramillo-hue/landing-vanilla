import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { report, pdfBase64, filename } = body;

    if (!report) {
      return NextResponse.json({ success: false, error: "Datos del reporte no proporcionados" }, { status: 400 });
    }

    const targetEmail =
      process.env.NOTIFICATION_EMAIL_TO || process.env.ADMIN_EMAIL || "cristian.f.jaramillo@gmail.com";
    const pdfFilename =
      filename || `Informe_Vainilla_${(report.lote || "Lote").replace(/\s+/g, "_")}_${report.fechaReporte}.pdf`;

    const emailSubject = `🌿 Nuevo Informe Diario - ${report.lote} (${report.fechaReporte})`;

    const actList = (report.actividades || [])
      .filter((a: any) => a.realizado)
      .map((a: any) => `<li style="margin-bottom: 4px;"><strong>${a.nombre}</strong> (${a.areaLote || "Todo el lote"})</li>`)
      .join("");

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Nuevo Informe Diario - Amazon Vanilla</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4EFEA; margin: 0; padding: 24px; color: #1C3B24;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #E5DFD7;">
    
    <!-- Encabezado con Identidad de Marca -->
    <tr>
      <td style="background-color: #1C3B24; padding: 28px 24px; text-align: center;">
        <span style="display: inline-block; background-color: #C8944E; color: #0C1E12; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">
          Trazabilidad & Supervisión Agronómica
        </span>
        <h1 style="color: #FBF8F1; font-size: 22px; font-weight: bold; margin: 12px 0 4px 0; letter-spacing: 0.5px;">
          NUEVO INFORME DIARIO REGISTRADO
        </h1>
        <p style="color: #D6C2A0; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
          Amazon Vanilla By Waorani People & ITEC Ecuador
        </p>
      </td>
    </tr>

    <!-- Contenido Principal -->
    <tr>
      <td style="padding: 28px 24px;">
        <p style="font-size: 14px; line-height: 1.6; color: #2A4430; margin-top: 0;">
          Estimado Administrador,<br><br>
          Se ha generado y registrado un nuevo <strong>Informe Diario de Campo</strong> en la plataforma. A continuación encontrarás el resumen técnico de actividades y el documento oficial en <strong>PDF adjunto</strong> listo para su archivo y control agronómico.
        </p>

        <!-- Ficha Resumen -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBF8F1; border-radius: 12px; border: 1px solid #E5DFD7; margin: 20px 0;">
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Código de Registro:</span><br>
              <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #1C3B24;">${report.id}</span>
            </td>
            <td style="padding: 16px 20px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Fecha del Reporte:</span><br>
              <strong style="font-size: 13px; color: #1C3B24;">${report.fechaReporte}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Área:</span><br>
              <strong style="font-size: 13px; color: #1C3B24;">${report.area || report.lote}</strong>
            </td>
            <td style="padding: 16px 20px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Responsable:</span><br>
              <strong style="font-size: 13px; color: #1C3B24;">${report.responsable}</strong>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 16px 20px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Condiciones Climáticas:</span><br>
              <span style="font-size: 13px; color: #2A4430;">
                Clima: <strong>${report.clima}</strong> | Temp: <strong>${report.temperatura !== undefined ? `${report.temperatura}°C` : `${report.tempMin}°C - ${report.tempMax}°C`}</strong> | Humedad: <strong>${report.humedad}%</strong>
              </span>
            </td>
          </tr>
        </table>

        <!-- Actividades Realizadas -->
        <div style="margin: 20px 0;">
          <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1C3B24; margin-bottom: 8px; border-bottom: 2px solid #C8944E; padding-bottom: 4px;">
            Actividades Realizadas en Campo
          </h3>
          <ul style="font-size: 12px; color: #2A4430; padding-left: 20px; margin: 8px 0;">
            ${actList || "<li>No se marcaron actividades específicas.</li>"}
          </ul>
        </div>

        <!-- Observaciones -->
        ${
          report.observaciones
            ? `
        <div style="margin: 20px 0;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #1C3B24;">
            Observaciones y Novedades:
          </h4>
          <p style="margin: 0; font-size: 12px; font-style: italic; color: #4B6352; background: #FAF7F2; padding: 10px 14px; border-left: 3px solid #C8944E; border-radius: 4px;">
            "${report.observaciones}"
          </p>
        </div>
        `
            : ""
        }

        <!-- Botón de Acceso al Panel de Administrador -->
        <div style="text-align: center; margin: 32px 0 20px 0;">
          <a href="https://landing-vanilla.vercel.app/admin" target="_blank" style="display: inline-block; background-color: #1C3B24; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 14px 28px; border-radius: 10px; box-shadow: 0 3px 8px rgba(28,59,36,0.3); letter-spacing: 0.5px;">
            ACCEDER AL PANEL ADMINISTRADOR &rarr;
          </a>
          <p style="font-size: 11px; color: #7A8C7F; margin-top: 10px;">
            En el panel podrás gestionar los datos, generar históricos y auditar el lote.
          </p>
        </div>

        <!-- Nota de PDF Adjunto -->
        <div style="background-color: #EBF5EE; border: 1px dashed #408050; border-radius: 8px; padding: 12px 16px; margin-top: 24px; text-align: center;">
          <span style="font-size: 12px; color: #1C3B24; font-weight: bold;">
            📎 Documento PDF Adjunto:
          </span>
          <span style="font-size: 12px; color: #2A4430;"> ${pdfFilename}</span>
        </div>
      </td>
    </tr>

    <!-- Pie de Página -->
    <tr>
      <td style="background-color: #FBF8F1; padding: 18px 24px; border-top: 1px solid #EAE3D8; text-align: center; font-size: 11px; color: #735D3D;">
        <strong>Amazon Vanilla - By Waorani People</strong> | ITEC Ecuador - Innovación para un campo sostenible<br>
        Notificación automática del Sistema Oficial de Trazabilidad de Vainilla Amazónica.
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Intento de envío mediante Resend (Recomendado para Vercel)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "re_tuApiKeyDeResendAqui") {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_EMAIL_FROM || "Amazon Vanilla <onboarding@resend.dev>",
          to: [targetEmail],
          subject: emailSubject,
          html: htmlTemplate,
          attachments: [
            {
              filename: pdfFilename,
              content: pdfBase64,
            },
          ],
        }),
      });

      const resendData = await resendRes.json();
      if (resendRes.ok) {
        return NextResponse.json({
          success: true,
          provider: "resend",
          recipient: targetEmail,
          data: resendData,
        });
      }
      console.warn("Resend devolvió un error:", resendData);
    }

    // 2. Intento de envío mediante SMTP / Nodemailer (Gmail o servidor de correo)
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass && smtpUser !== "notificaciones@tudominio.com") {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.NOTIFICATION_EMAIL_FROM || `"Amazon Vanilla Waorani" <${smtpUser}>`,
        to: targetEmail,
        subject: emailSubject,
        html: htmlTemplate,
        attachments: [
          {
            filename: pdfFilename,
            content: Buffer.from(pdfBase64, "base64"),
            contentType: "application/pdf",
          },
        ],
      });

      return NextResponse.json({
        success: true,
        provider: "smtp",
        recipient: targetEmail,
        messageId: info.messageId,
      });
    }

    // 3. Si no hay credenciales SMTP/Resend configuradas en las variables de entorno:
    return NextResponse.json({
      success: true,
      configured: false,
      recipient: targetEmail,
      message:
        "El informe se procesó correctamente. Para envío real de correos electrónicos, configura RESEND_API_KEY o credenciales SMTP en Vercel.",
    });
  } catch (error: any) {
    console.error("Error al enviar correo electrónico:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
