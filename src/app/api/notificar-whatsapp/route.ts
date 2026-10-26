import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mensaje, telefono } = body;

    const targetPhone = telefono || process.env.WHATSAPP_ADMIN_PHONE || "593962577613";
    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");

    // Opción 1: CallMeBot (Gratuito, instantáneo para alertas directas sin abrir la app)
    const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
    if (callmebotApiKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(
        mensaje
      )}&apikey=${callmebotApiKey}`;

      const res = await fetch(url);
      const text = await res.text();
      return NextResponse.json({ success: true, provider: "callmebot", response: text });
    }

    // Opción 2: Twilio WhatsApp API
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    if (twilioSid && twilioAuth) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", `whatsapp:+${cleanPhone}`);
      params.append("From", twilioFrom);
      params.append("Body", mensaje);

      const res = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      return NextResponse.json({ success: res.ok, provider: "twilio", data });
    }

    // Opción 3: Meta WhatsApp Cloud API Oficial
    const metaToken = process.env.WHATSAPP_API_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId && metaToken !== "tuTokenDeMetaCloudAPI") {
      const metaUrl = `https://graph.facebook.com/v18.0/${metaPhoneId}/messages`;
      const res = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: { body: mensaje },
        }),
      });

      const data = await res.json();
      return NextResponse.json({ success: res.ok, provider: "meta", data });
    }

    // Si aún no se ha configurado ninguna API de envío silencioso:
    return NextResponse.json({
      success: false,
      configured: false,
      message:
        "No hay proveedor de WhatsApp API configurado en las variables de entorno (CallMeBot, Twilio o Meta).",
    });
  } catch (error: any) {
    console.error("Error en API de WhatsApp:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
