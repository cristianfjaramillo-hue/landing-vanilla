import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ScheduledReminder } from "@/lib/types";

let cachedReminders: ScheduledReminder[] = [];

export async function GET() {
  try {
    // 1. Consultar recordatorios guardados en reportes_diarios (IDs que empiezan por REM-)
    const { data: remRows, error: remErr } = await supabaseAdmin
      .from("reportes_diarios")
      .select("*")
      .like("report_id", "REM-%")
      .order("created_at", { ascending: false });

    const dbReminders: ScheduledReminder[] = [];
    if (!remErr && remRows) {
      remRows.forEach((r: any) => {
        if (r.data) {
          dbReminders.push(r.data as ScheduledReminder);
        }
      });
    }

    // 2. Extraer también labores con fechaProxima de todos los informes diarios registrados
    const { data: repRows } = await supabaseAdmin
      .from("reportes_diarios")
      .select("*")
      .like("report_id", "REP-%")
      .order("created_at", { ascending: false });

    if (repRows) {
      repRows.forEach((row: any) => {
        const report = row.data as any;
        if (report && Array.isArray(report.actividades)) {
          report.actividades.forEach((act: any) => {
            if (act.fechaProxima && act.fechaProxima.trim() !== "") {
              const remId = `REM-${report.id}-${act.id}`;
              const exists = dbReminders.some((m) => m.id === remId);
              if (!exists) {
                dbReminders.push({
                  id: remId,
                  reportId: report.id,
                  actividadNombre: act.nombre,
                  area: act.areaLote || "INVERNADERO N°1",
                  responsable: report.responsable || "GUIMARE",
                  observacionesPrevias: act.descripcion || report.observaciones,
                  fechaProgramada: act.fechaProxima,
                  recordatoriosEnviados: 0,
                  estado: "pendiente",
                  created_at: report.created_at || new Date().toISOString(),
                });
              }
            }
          });
        }
      });
    }

    // Unificar con caché
    const map = new Map<string, ScheduledReminder>();
    [...dbReminders, ...cachedReminders].forEach((r) => {
      const existing = map.get(r.id);
      if (!existing || (r.recordatoriosEnviados || 0) > (existing.recordatoriosEnviados || 0)) {
        map.set(r.id, r);
      }
    });

    const unified = Array.from(map.values()).sort(
      (a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime()
    );

    cachedReminders = unified;
    return NextResponse.json({ success: true, reminders: unified, source: "database" });
  } catch (err: any) {
    console.warn("Aviso al consultar recordatorios:", err);
    return NextResponse.json({ success: true, reminders: cachedReminders, source: "cache" });
  }
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

    // Actualizar caché
    for (const r of reminders) {
      const idx = cachedReminders.findIndex((c) => c.id === r.id);
      if (idx >= 0) {
        cachedReminders[idx] = { ...cachedReminders[idx], ...r };
      } else {
        cachedReminders.unshift(r);
      }
    }

    // Persistir en Supabase (tabla reportes_diarios con report_id = REM-...)
    try {
      const rows = reminders.map((r) => ({
        report_id: r.id,
        lote: "CRONOGRAMA",
        responsable: r.responsable,
        fecha_reporte: r.fechaProgramada,
        data: r,
      }));

      await supabaseAdmin.from("reportes_diarios").upsert(rows, { onConflict: "report_id" });
    } catch (dbErr) {
      console.warn("Supabase notice upserting reminders:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `${reminders.length} recordatorio(s) registrado(s) exitosamente`,
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
      await supabaseAdmin.from("reportes_diarios").delete().eq("report_id", id);
    } catch (e) {
      console.warn("Supabase delete notice:", e);
    }

    return NextResponse.json({ success: true, message: `Recordatorio ${id} eliminado` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
