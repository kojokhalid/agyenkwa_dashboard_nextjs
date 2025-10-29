import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MongoDB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME!;
const MONGODB_COLLECTION_NAME = process.env.MONGODB_COLLECTION_NAME!;

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

function extractStressLevel(payload: any): number {
  if (payload.decoded_payload?.stress_level !== undefined) {
    return payload.decoded_payload.stress_level;
  }
  if (payload.uplink_message?.decoded_payload?.stress_level !== undefined) {
    return payload.uplink_message.decoded_payload.stress_level;
  }
  if (payload.stress_level !== undefined) {
    return payload.stress_level;
  }
  return 0;
}

function extractUsername(payload: any): string {
  if (payload.decoded_payload?.username) {
    return payload.decoded_payload.username;
  }
  if (payload.uplink_message?.decoded_payload?.username) {
    return payload.uplink_message.decoded_payload.username;
  }
  if (payload.username) {
    return payload.username;
  }
  return "Unknown User";
}

function extractDeviceInfo(payload: any) {
  const endDeviceIds = payload.end_device_ids || {};
  return {
    dev_eui: endDeviceIds.dev_eui || endDeviceIds.device_id || "",
    device_id: endDeviceIds.device_id || "",
    application_id: endDeviceIds.application_ids?.application_id || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("📥 Webhook received from The Things Network");
    const payload = await request.json();
    console.log("📦 Payload received");

    if (!MONGODB_URI || !MONGODB_DB_NAME || !MONGODB_COLLECTION_NAME) {
      console.error("❌ MongoDB configuration missing");
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 200 }
      );
    }

    const uplinkMessage = payload.uplink_message || payload;
    const decodedPayload = uplinkMessage.decoded_payload || {};
    const deviceInfo = extractDeviceInfo(payload);
    const stressLevel = extractStressLevel(payload);
    const username = extractUsername(payload);

    const document = {
      raw_payload: payload,
      timestamp: uplinkMessage.received_at || new Date().toISOString(),
      stress_level: stressLevel,
      username: username,
      device_address: deviceInfo.dev_eui,
      device_id: deviceInfo.device_id,
      application_id: deviceInfo.application_id,
      decoded_payload: decodedPayload,
      sender: `TTN Webhook (${deviceInfo.device_id})`,
      upload_timestamp: new Date(),
      upload_method: "ttn_webhook",
      created_at: new Date(),
      rx_metadata: uplinkMessage.rx_metadata || [],
      settings: uplinkMessage.settings || {},
      frm_payload: uplinkMessage.frm_payload,
      f_port: uplinkMessage.f_port,
      f_cnt: uplinkMessage.f_cnt,
    };

    console.log("💾 Saving to MongoDB:", {
      username,
      stress_level: stressLevel,
      device: deviceInfo.device_id,
    });

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection(MONGODB_COLLECTION_NAME);
    const result = await collection.insertOne(document);

    console.log("✅ Data saved successfully:", result.insertedId);

    return NextResponse.json({
      success: true,
      message: "Webhook data processed and stored",
      insertedId: result.insertedId.toString(),
      data: {
        username,
        stress_level: stressLevel,
        device_id: deviceInfo.device_id,
        timestamp: document.timestamp,
      },
    });
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "active",
    message: "The Things Network Webhook Endpoint",
    endpoint: "/api/ttn-webhook",
    methods: ["POST", "GET"],
    description: "Send uplink messages from TTN to this endpoint",
    timestamp: new Date().toISOString(),
  });
}
