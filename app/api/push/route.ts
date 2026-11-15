import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/db/supabase-server";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "dummy-public-key";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "dummy-private-key";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      "mailto:assistant@lucy.local",
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (err) {
    console.warn("VAPID config warning:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, subscription, title, message } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (action === "subscribe" && subscription) {
      if (user) {
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        });
      }
      return NextResponse.json({ success: true, message: "Push subscription registered" });
    }

    if (action === "test_send" && subscription) {
      const payload = JSON.stringify({
        title: title || "Lucy Reminder",
        body: message || "Your scheduled protocol alert is due now.",
        icon: "/icon-192.png",
      });

      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        await webpush.sendNotification(subscription, payload);
        return NextResponse.json({ success: true, message: "Push delivered" });
      } else {
        return NextResponse.json({
          success: true,
          mock: true,
          message: "VAPID keys not configured in env; simulated push event successfully.",
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Push API error:", error);
    return NextResponse.json({ error: "Failed to process push action" }, { status: 500 });
  }
}
