import mqtt from 'mqtt';

const MQTT_URL = process.env.Mqtts_V3_Url || 'mqtts://eu1.cloud.thethings.network:8883';
const MQTT_USERNAME = process.env.Username || '';
const MQTT_PASSWORD = process.env.Password || '';
const TTN_APPLICATION_ID = 'mo-lora-lora-no';

// Shared MQTT client instance
let mqttClient: mqtt.MqttClient | null = null;
let subscribers = new Set<(data: any) => void>();

function connectMQTT() {
  if (mqttClient && mqttClient.connected) {
    return mqttClient;
  }

  console.log('🔌 Connecting to TTN MQTT:', MQTT_URL);
  
  mqttClient = mqtt.connect(MQTT_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: 'mqtts',
    rejectUnauthorized: true,
  });

  mqttClient.on('connect', () => {
    console.log('✅ Connected to TTN MQTT');
    const topic = `v3/${TTN_APPLICATION_ID}/devices/+/up`;
    mqttClient!.subscribe(topic, (err) => {
      if (err) {
        console.error('❌ MQTT subscription error:', err);
      } else {
        console.log('📡 Subscribed to topic:', topic);
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 MQTT message received:', {
        topic,
        device: data.end_device_ids?.device_id,
        stress: data.uplink_message?.decoded_payload?.stress_level
      });
      
      // Notify all subscribers
      subscribers.forEach(callback => callback(data));
    } catch (e) {
      console.error('❌ Error parsing MQTT message:', e);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT error:', err);
  });

  mqttClient.on('close', () => {
    console.log('🔌 MQTT connection closed');
  });

  return mqttClient;
}

export async function GET(request: Request) {
  // Set up SSE headers
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      console.log('🌊 SSE stream started');
      
      // Connect to MQTT
      const client = connectMQTT();
      
      // Send initial connection message
      const initData = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Subscriber function that sends data to this SSE stream
      const subscriber = (data: any) => {
        try {
          const sseData = `data: ${JSON.stringify({ type: 'uplink', data })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch (e) {
          console.error('❌ Error sending SSE data:', e);
        }
      };

      // Add subscriber
      subscribers.add(subscriber);

      // Send keepalive every 30s
      const keepaliveInterval = setInterval(() => {
        try {
          const keepalive = `data: ${JSON.stringify({ type: 'keepalive', timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(keepalive));
        } catch (e) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        console.log('🛑 SSE stream closed');
        clearInterval(keepaliveInterval);
        subscribers.delete(subscriber);
        
        // If no more subscribers, we could optionally disconnect MQTT
        // But keeping it connected is fine for multiple clients
        if (subscribers.size === 0) {
          console.log('👋 No more subscribers, keeping MQTT connected for next client');
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
