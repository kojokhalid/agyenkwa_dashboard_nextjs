import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    console.log("🗄️ Fetching data from MongoDB...");

    if (!MONGODB_URI) {
      console.error("❌ MongoDB_URI not configured");
      return NextResponse.json(
        { error: "MongoDB URI not configured" },
        { status: 500 }
      );
    }

    if (!MONGODB_DB_NAME) {
      console.error("❌ MONGODB_DB_NAME not configured");
      return NextResponse.json(
        { error: "MongoDB database name not configured" },
        { status: 500 }
      );
    }

    if (!MONGODB_COLLECTION_NAME) {
      console.error("❌ MONGODB_COLLECTION_NAME not configured");
      return NextResponse.json(
        { error: "MongoDB collection name not configured" },
        { status: 500 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection(MONGODB_COLLECTION_NAME);

    const totalDocuments = await collection.countDocuments();
    console.log("📊 Total documents in collection:", totalDocuments);

    if (totalDocuments === 0) {
      console.warn("⚠️  No documents found in collection");
      return NextResponse.json(
        {
          error: "No data found in MongoDB collection",
          database: MONGODB_DB_NAME,
          collection: MONGODB_COLLECTION_NAME,
        },
        { status: 404 }
      );
    }

    const latestDocument = await collection
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (!latestDocument || latestDocument.length === 0) {
      console.warn("⚠️  No documents found");
      return NextResponse.json(
        {
          error: "No data found in MongoDB collection",
          totalDocuments,
        },
        { status: 404 }
      );
    }

    const data = latestDocument[0];
    console.log("✅ Successfully fetched latest document");
    console.log("📄 Document ID:", data._id);

    const sanitizedData = {
      ...data,
      _id: data._id.toString(),
    };

    return NextResponse.json({
      data: sanitizedData,
      totalDocuments,
      documentId: data._id.toString(),
      timestamp: data._id.getTimestamp(),
    });
  } catch (err: any) {
    console.error("❌ Error fetching MongoDB data:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch data from MongoDB",
        details: err.message,
        errorType: err.name,
      },
      { status: 500 }
    );
  }
}
