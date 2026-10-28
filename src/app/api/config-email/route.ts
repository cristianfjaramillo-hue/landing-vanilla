import { NextResponse } from "next/server";
import { getActiveEmailConfig, saveEmailConfig, sendAppEmail, EmailConfig } from "@/lib/email-service";

export async function GET() {
  try {
    const config = await getActiveEmailConfig();
    if (!config) {
      return NextResponse.json({
        configured: false,
        recipient: "cristian.f.jaramillo@gmail.com",
        message: "No hay proveedor de correo configurado.",
      });
    }

    return NextResponse.json({
      configured: true,
      provider: config.provider,
      recipient: config.toEmail || "cristian.f.jaramillo@gmail.com",
      smtpUser: config.smtpUser ? config.smtpUser.replace(/(.{3}).*(@.*)/, "$1***$2") : undefined,
      hasResendKey: Boolean(config.resendApiKey && config.resendApiKey.startsWith("re_")),
    });
  } catch (err: any) {
    return NextResponse.json({ configured: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, resendApiKey, smtpUser, smtpPass, smtpHost, smtpPort, testNow } = body;

    const newConfig: EmailConfig = {
      provider: provider || "resend",
      resendApiKey: resendApiKey?.trim(),
      smtpHost: smtpHost?.trim() || (provider === "gmail" ? "smtp.gmail.com" : undefined),
      smtpPort: smtpPort ? Number(smtpPort) : provider === "gmail" ? 465 : 587,
      smtpUser: smtpUser?.trim(),
      smtpPass: smtpPass?.trim(),
      toEmail: "cristian.f.jaramillo@gmail.com",
    };

    // Guardar en Supabase
    const saved = await saveEmailConfig(newConfig);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "No se pudo persistir la configuración en la base de datos" },
        { status: 500 }
      );
    }

    // Intentar sincronizar también con Vercel si se cuenta con el token en entorno
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    if (vercelToken && vercelProjectId) {
      try {
        if (newConfig.provider === "resend" && newConfig.resendApiKey) {
          await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/env?upsert=true`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: "RESEND_API_KEY",
              value: newConfig.resendApiKey,
              type: "plain",
              target: ["production", "preview", "development"],
            }),
          });
        }
      } catch (vErr) {
        console.warn("Aviso Vercel env sync:", vErr);
      }
    }

    // Si se solicitó prueba inmediata
    if (testNow) {
      const testResult = await sendAppEmail({
        to: "cristian.f.jaramillo@gmail.com",
        subject: "🌿 Prueba Exitosa de Notificaciones - Amazon Vanilla",
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #F4EFEA; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #E5DFD7;">
              <h2 style="color: #1C3B24; margin-top: 0;">¡Configuración de Correo Exitosa! 🎉</h2>
              <p style="color: #2A4430; font-size: 14px;">
                Estimado Cristian,<br><br>
                Este correo confirma que el canal de notificaciones y recordatorios automáticos de <strong>Amazon Vanilla</strong> está plenamente activo y conectado a tu cuenta <strong>cristian.f.jaramillo@gmail.com</strong>.
              </p>
              <div style="background-color: #EBF5EE; border-left: 4px solid #1C3B24; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #1C3B24;">
                Proveedor Activo: <strong>${newConfig.provider.toUpperCase()}</strong><br>
                Fecha y Hora: <strong>${new Date().toLocaleString()}</strong>
              </div>
              <p style="color: #735D3D; font-size: 12px;">
                A partir de ahora, cada reporte diario y los 3 recordatorios automáticos programados 24 horas antes llegarán a esta bandeja.
              </p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({
        success: testResult.success,
        saved: true,
        testResult,
        error: testResult.error,
      });
    }

    return NextResponse.json({ success: true, saved: true, message: "Configuración guardada correctamente." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
