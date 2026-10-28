import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "reporte";

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido para eliminar" }, { status: 400 });
    }

    // 1. Eliminar fila principal de Supabase usando Service Role (garantiza borrado real)
    const { error } = await supabaseAdmin
      .from("reportes_diarios")
      .delete()
      .eq("report_id", id);

    if (error) {
      console.warn("Aviso Supabase delete:", error.message);
    }

    // 2. Si es un reporte diario, eliminar también cualquier recordatorio hijo que se haya desprendido de él
    if (type === "reporte") {
      try {
        await supabaseAdmin
          .from("reportes_diarios")
          .delete()
          .like("report_id", `REM-${id}%`);
      } catch (childErr) {
        console.warn("Aviso eliminando recordatorios hijos:", childErr);
      }
    }

    // 3. Si es un recordatorio, registrarlo en la lista negra permanente para que no vuelva a auto-extraerse
    if (type === "recordatorio") {
      try {
        const { data: configRow } = await supabaseAdmin
          .from("reportes_diarios")
          .select("data")
          .eq("report_id", "CONFIG_DELETED_REMINDERS")
          .single();

        const currentDeleted: string[] = Array.isArray(configRow?.data?.deletedIds)
          ? configRow.data.deletedIds
          : [];

        if (!currentDeleted.includes(id)) {
          currentDeleted.push(id);
          await supabaseAdmin.from("reportes_diarios").upsert(
            [
              {
                report_id: "CONFIG_DELETED_REMINDERS",
                lote: "CONFIGURACION_SISTEMA",
                responsable: "ADMIN",
                fecha_reporte: new Date().toISOString().split("T")[0],
                data: { deletedIds: currentDeleted },
              },
            ],
            { onConflict: "report_id" }
          );
        }
      } catch (delErr) {
        console.warn("Aviso registrando CONFIG_DELETED_REMINDERS:", delErr);
      }
    }

    return NextResponse.json({
      success: true,
      id,
      type,
      message: `Elemento ${id} eliminado permanentemente de la base de datos`,
    });
  } catch (err: any) {
    console.error("Error al eliminar elemento:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
