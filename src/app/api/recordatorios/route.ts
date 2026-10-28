import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ScheduledReminder } from "@/lib/types";

// Memoria en caché del servidor para garantizar disponibilidad si la tabla de Supabase no está configurada
let cachedReminders: ScheduledReminder[] = [];

export async function GET() {
  try {
    // Intentar consultar Supabase
    const { data, error } = await supabaseAdmin
      .from("recordatorios_programados")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      // Normalizar datos de Supabase
      const mapped: ScheduledReminder[] = data.map((item: any) => ({
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

      // Sincronizar caché
      cachedReminders = mapped;
      return NextResponse.json({ success: true, reminders: mapped, source: "supabase" });
    }
  } catch (err) {
    console.warn("Aviso al consultar Supabase recordatorios:", err);
  }

  return NextResponse.json({ success: true, reminders: cachedReminders, source: "cache" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reminders: ScheduledReminder[] = Array.isArray(body.reminders)
      ? body.reminders
      : body.reminder
      ? [body.reminder]
      : [];

    if (reminders.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se proporcionaron recordatorios para registrar" },
        { status: 400 }
      );
    }

    // 1. Guardar en caché en memoria del servidor
    for (const r of reminders) {
      const idx = cachedReminders.findIndex((c) => c.id === r.id);
      if (idx >= 0) {
        cachedReminders[idx] = { ...cachedReminders[idx], ...r };
      } else {
        cachedReminders.unshift(r);
      }
    }

    // 2. Persistir en Supabase (tabla recordatorios_programados)
    try {
      const rows = reminders.map((r) => ({
        id: r.id,
        report_id: r.reportId,
        actividad_nombre: r.actividadNombre,
        area: r.area,
        responsable: r.responsable,
        observaciones_previas: r.observacionesPrevias || "",
        fecha_programada: r.fechaProgramada,
        recordatorios_enviados: r.recordatoriosEnviados || 0,
        ultimo_envio: r.ultimoEnvio || null,
        estado: r.estado || "pendiente",
        data: r,
      }));

      const { error } = await supabaseAdmin
        .from("recordatorios_programados")
        .upsert(rows, { onConflict: "id" });

      if (error) {
        console.warn("Supabase upsert recordatorios:", error.message);
      }
    } catch (dbErr) {
      console.warn("Supabase notice recordatorios:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `${reminders.length} recordatorio(s) programado(s) exitosamente`,
      reminders,
    });
  } catch (err: any) {
    console.error("Error al registrar recordatorio:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    }

    cachedReminders = cachedReminders.filter((r) => r.id !== id);

    try {
      await supabaseAdmin.from("recordatorios_programados").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase delete notice:", e);
    }

    return NextResponse.json({ success: true, message: `Recordatorio ${id} eliminado` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
