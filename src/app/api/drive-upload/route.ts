import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DRIVE_FOLDERS = {
  diario: {
    id: "1gGdDnhpOOM0zhKGEGhTuvXmOfHRYwmpN",
    url: "https://drive.google.com/drive/folders/1gGdDnhpOOM0zhKGEGhTuvXmOfHRYwmpN",
    name: "Informes Diarios",
  },
  actividades: {
    id: "1lPouDSEyC3cWQwmDGDaygB_yfJF83qAY",
    url: "https://drive.google.com/drive/folders/1lPouDSEyC3cWQwmDGDaygB_yfJF83qAY",
    name: "Listado de Actividades",
  },
};

// POST: Despachar archivo PDF a la carpeta de Google Drive correspondiente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, filename, pdfBase64, reportId, action, webhookUrl: newWebhook } = body;

    // Acción para guardar la configuración del Webhook desde el panel Admin
    if (action === "save_webhook") {
      const { error } = await supabaseAdmin.from("reportes_diarios").upsert(
        [
          {
            report_id: "CONFIG_GOOGLE_DRIVE",
            lote: "CONFIGURACION_SISTEMA",
            responsable: "ADMIN",
            fecha_reporte: new Date().toISOString().split("T")[0],
            data: { webhookUrl: (newWebhook || "").trim() },
          },
        ],
        { onConflict: "report_id" }
      );
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "Webhook de Google Drive guardado correctamente" });
    }

    const folderConfig = type === "actividades" ? DRIVE_FOLDERS.actividades : DRIVE_FOLDERS.diario;

    // 1. Obtener webhook configurado de Google Apps Script (desde Supabase o env)
    let webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || "";
    try {
      const { data: configRow } = await supabaseAdmin
        .from("reportes_diarios")
        .select("data")
        .eq("report_id", "CONFIG_GOOGLE_DRIVE")
        .single();
      if (configRow?.data?.webhookUrl) {
        webhookUrl = configRow.data.webhookUrl;
      }
    } catch {}

    let uploaded = false;
    let driveFileUrl = "";
    let serverNotice = "";

    // 2. Si hay webhook configurado, enviar el archivo de forma automática a Google Drive
    if (webhookUrl && pdfBase64) {
      try {
        const driveRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderId: folderConfig.id,
            filename: filename || `Documento_${Date.now()}.pdf`,
            base64: pdfBase64,
            reportId,
          }),
        });

        if (driveRes.ok) {
          const driveJson = await driveRes.json();
          if (driveJson?.success) {
            uploaded = true;
            driveFileUrl = driveJson.fileUrl || "";
          }
        }
      } catch (uploadErr: any) {
        serverNotice = uploadErr.message;
        console.warn("Aviso al subir a Google Drive Webhook:", uploadErr);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded,
      folderId: folderConfig.id,
      folderUrl: folderConfig.url,
      folderName: folderConfig.name,
      driveFileUrl,
      hasWebhook: !!webhookUrl,
      serverNotice,
      message: uploaded
        ? `Archivo ${filename} guardado directamente en la carpeta de Google Drive: ${folderConfig.name}`
        : `Acceso directo a carpeta de Google Drive configurado: ${folderConfig.name}`,
    });
  } catch (err: any) {
    console.error("Error en drive-upload API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET: Consultar carpetas y estado del Webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "diario";
  const folderConfig = type === "actividades" ? DRIVE_FOLDERS.actividades : DRIVE_FOLDERS.diario;

  let webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || "";
  try {
    const { data: configRow } = await supabaseAdmin
      .from("reportes_diarios")
      .select("data")
      .eq("report_id", "CONFIG_GOOGLE_DRIVE")
      .single();
    if (configRow?.data?.webhookUrl) {
      webhookUrl = configRow.data.webhookUrl;
    }
  } catch {}

  return NextResponse.json({
    success: true,
    folders: DRIVE_FOLDERS,
    currentFolder: folderConfig,
    hasWebhook: !!webhookUrl,
    webhookUrl,
  });
}
