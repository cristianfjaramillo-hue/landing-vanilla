import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase";
import { ScheduledReminder } from "@/lib/types";

// Manejador central para procesar recordatorios (admite GET y POST)
async function processReminders(options: { manualId?: string; force?: boolean } = {}) {
  const targetEmail =
    process.env.NOTIFICATION_EMAIL_TO || process.env.ADMIN_EMAIL || "cristian.f.jaramillo@gmail.com";
  const now = new Date();

  // 1. Obtener lista de recordatorios pendientes desde Supabase
  let reminders: ScheduledReminder[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("recordatorios_programados")
      .select("*");

    if (!error && data && data.length > 0) {
      reminders = data.map((item: any) => ({
        id: item.id,
        reportId: item.report_id || item.reportId || "",
        actividadNombre: item.actividad_nombre || item.actividadNombre || "",
        area: item.area || "",
        responsable: item.responsable || "",
        observacionesPrevias: item.observaciones_previas || item.observacionesPrevias || "",
        fechaProgramada: item.fecha_programada || item.fechaProgramada || "",
        recordatoriosEnviados: item.recordatorios_enviados ?? item.recordatoriosEnviados ?? 0,
        ultimoEnvio: item.ultimo_envio || item.ultimoEnvio || undefined,
        estado: item.estado || "pendiente",
        created_at: item.created_at || new Date().toISOString(),
      }));
    }
  } catch (dbErr) {
    console.warn("Aviso al consultar Supabase en cron recordatorios:", dbErr);
  }

  const results: Array<{
    id: string;
    actividad: string;
    fechaProgramada: string;
    envioNumero: number;
    enviado: boolean;
    razon?: string;
  }> = [];

  // Filtrar o seleccionar recordatorio si es envío manual de prueba
  let targetReminders = reminders;
  if (options.manualId) {
    targetReminders = reminders.filter((r) => r.id === options.manualId);
  }

  for (const reminder of targetReminders) {
    // Si ya completó los 3 envíos y no es forzado, saltar
    if (reminder.recordatoriosEnviados >= 3 && !options.force && !options.manualId) {
      results.push({
        id: reminder.id,
        actividad: reminder.actividadNombre,
        fechaProgramada: reminder.fechaProgramada,
        envioNumero: reminder.recordatoriosEnviados,
        enviado: false,
        razon: "Ya completó el ciclo de 3 recordatorios",
      });
      continue;
    }

    // Calcular horas hasta la fecha programada
    // Se toma las 08:00 AM del día programado como inicio de jornada
    const targetDate = new Date(`${reminder.fechaProgramada}T08:00:00`);
    const diffMs = targetDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Ventana de 24 horas antes: diffHours <= 26 y >= -14 (cubre las 24 horas previas y el día mismo)
    const isWithin24Hours = diffHours <= 26 && diffHours >= -14;

    // Verificar si ha transcurrido al menos 3 horas desde el último envío para no duplicar en el mismo minuto
    let hoursSinceLast = 999;
    if (reminder.ultimoEnvio) {
      hoursSinceLast = (now.getTime() - new Date(reminder.ultimoEnvio).getTime()) / (1000 * 60 * 60);
    }

    const shouldSend =
      options.manualId ||
      options.force ||
      (isWithin24Hours && reminder.recordatoriosEnviados < 3 && hoursSinceLast >= 3);

    if (!shouldSend) {
      results.push({
        id: reminder.id,
        actividad: reminder.actividadNombre,
        fechaProgramada: reminder.fechaProgramada,
        envioNumero: reminder.recordatoriosEnviados,
        enviado: false,
        razon: !isWithin24Hours
          ? `Fuera de la ventana de 24h (faltan ${Math.round(diffHours)}h)`
          : `Último envío reciente (hace ${hoursSinceLast.toFixed(1)}h)`,
      });
      continue;
    }

    const nextCount = Math.min(3, (reminder.recordatoriosEnviados || 0) + 1);
    const emailSubject = `🔔 [Recordatorio ${nextCount}/3] Labor Mañana: ${reminder.actividadNombre} (${reminder.area}) - ${reminder.fechaProgramada}`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Recordatorio de Labor Agronómica</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4EFEA; margin: 0; padding: 24px; color: #1C3B24;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #E5DFD7;">
    
    <!-- Encabezado -->
    <tr>
      <td style="background-color: #1C3B24; padding: 26px 24px; text-align: center;">
        <span style="display: inline-block; background-color: #C8944E; color: #0C1E12; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 999px; text-transform: uppercase;">
          RECORDATORIO AUTOMÁTICO • AVISO ${nextCount} DE 3
        </span>
        <h1 style="color: #FBF8F1; font-size: 20px; font-weight: bold; margin: 12px 0 4px 0; letter-spacing: 0.5px;">
          LABOR AGRONÓMICA PROGRAMADA
        </h1>
        <p style="color: #D6C2A0; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
          Amazon Vanilla • Proyecto de Trazabilidad
        </p>
      </td>
    </tr>

    <!-- Contenido -->
    <tr>
      <td style="padding: 28px 24px;">
        <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
          <span style="font-size: 13px; font-weight: bold; color: #92400E;">
            ⏳ FALTAN MENOS DE 24 HORAS PARA ESTA LABOR
          </span>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #78350F;">
            Fecha Programada: <strong>${reminder.fechaProgramada}</strong>
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #2A4430; margin-top: 0;">
          Estimado Administrador,<br><br>
          Este es el <strong>recordatorio automático (${nextCount}/3)</strong> generado por el sistema de trazabilidad de Vainilla para recordarle la labor registrada previamente en el informe diario:
        </p>

        <!-- Ficha de la Labor -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBF8F1; border-radius: 12px; border: 1px solid #E5DFD7; margin: 20px 0;">
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Actividad a Realizar:</span><br>
              <strong style="font-size: 15px; color: #1C3B24;">${reminder.actividadNombre}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Área Asignada:</span><br>
              <span style="display: inline-block; background-color: #E2ECE5; color: #1C3B24; font-weight: bold; font-size: 12px; padding: 3px 10px; border-radius: 6px; margin-top: 4px;">
                ${reminder.area}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Responsable:</span><br>
              <strong style="font-size: 13px; color: #1C3B24;">${reminder.responsable}</strong>
            </td>
          </tr>
          ${
            reminder.observacionesPrevias
              ? `
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #EAE3D8;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Observaciones / Antecedentes Registrados:</span><br>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-style: italic; color: #4B6352;">
                "${reminder.observacionesPrevias}"
              </p>
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 14px 18px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #735D3D; font-weight: bold;">Informe de Origen:</span><br>
              <span style="font-family: monospace; font-size: 12px; color: #555;">${reminder.reportId || "Registro de Campo"}</span>
            </td>
          </tr>
        </table>

        <!-- Botón de Acceso -->
        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="https://landing-vanilla.vercel.app/admin" target="_blank" style="display: inline-block; background-color: #1C3B24; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 13px 26px; border-radius: 10px; box-shadow: 0 3px 8px rgba(28,59,36,0.3); letter-spacing: 0.5px;">
            VER CRONOGRAMA EN EL PANEL ADMINISTRADOR &rarr;
          </a>
        </div>

        <p style="font-size: 11px; color: #7A8C7F; text-align: center; margin: 12px 0 0 0;">
          Recordatorio programado dentro de las 24 horas antes del trabajo. Total de avisos: 3.
        </p>
      </td>
    </tr>

    <!-- Pie de Página -->
    <tr>
      <td style="background-color: #FBF8F1; padding: 16px 20px; border-top: 1px solid #EAE3D8; text-align: center; font-size: 11px; color: #735D3D;">
        <strong>Amazon Vanilla By Waorani People & ITEC Ecuador</strong><br>
        Sistema Automatizado de Trazabilidad & Cronograma Agronómico
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    let emailSent = false;

    // Intento 1: Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "re_tuApiKeyDeResendAqui") {
      try {
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
            html: htmlBody,
          }),
        });
        if (resendRes.ok) emailSent = true;
      } catch (e) {
        console.warn("Error enviando por Resend:", e);
      }
    }

    // Intento 2: SMTP / Nodemailer
    if (!emailSent) {
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass && smtpUser !== "notificaciones@tudominio.com") {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: { user: smtpUser, pass: smtpPass },
          });

          await transporter.sendMail({
            from: process.env.NOTIFICATION_EMAIL_FROM || `"Amazon Vanilla Waorani" <${smtpUser}>`,
            to: targetEmail,
            subject: emailSubject,
            html: htmlBody,
          });
          emailSent = true;
        } catch (smtpErr) {
          console.warn("Error enviando por SMTP:", smtpErr);
        }
      }
    }

    // Si no hay correo configurado, considerar procesado para simulación/pruebas
    const wasDelivered = emailSent || (!resendApiKey && !process.env.SMTP_HOST);

    // Actualizar estado en Supabase
    try {
      const updatedCount = nextCount;
      const updatedEstado = updatedCount >= 3 ? "completado" : "pendiente";
      await supabaseAdmin
        .from("recordatorios_programados")
        .update({
          recordatorios_enviados: updatedCount,
          ultimo_envio: now.toISOString(),
          estado: updatedEstado,
        })
        .eq("id", reminder.id);
    } catch (dbErr) {
      console.warn("Error actualizando recordatorio en DB:", dbErr);
    }

    results.push({
      id: reminder.id,
      actividad: reminder.actividadNombre,
      fechaProgramada: reminder.fechaProgramada,
      envioNumero: nextCount,
      enviado: wasDelivered,
      razon: emailSent ? "Enviado por correo" : "Simulado exitosamente (credenciales en Vercel)",
    });
  }

  return {
    success: true,
    processedAt: now.toISOString(),
    recipient: targetEmail,
    totalReminders: reminders.length,
    processedCount: results.filter((r) => r.enviado).length,
    results,
  };
}

// GET: Invocado por Vercel Cron automáticamente cada periodo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const manualId = searchParams.get("id") || undefined;

    const data = await processReminders({ manualId, force });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error en cron de recordatorios (GET):", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Invocado desde el Panel de Administración para pruebas manuales inmediatas
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body vacío permitido
    }

    const data = await processReminders({
      manualId: body.manualId,
      force: body.force ?? true,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error en cron de recordatorios (POST):", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
