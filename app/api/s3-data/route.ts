import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const bucketName = process.env.S3_BUCKET_NAME || "your-bucket-name";

// Create S3 client - will auto-detect region from bucket location
function createS3Client() {
  return new S3Client({
    region: process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

// Helper to convert stream to string
async function streamToString(stream: any): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function GET() {
  const s3 = createS3Client();
  
  try {
    console.log("🔍 Fetching data from S3 bucket:", bucketName);
    
    if (!bucketName) {
      console.error("❌ S3_BUCKET_NAME not configured");
      return NextResponse.json(
        { error: "S3 bucket name not configured" },
        { status: 500 }
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("❌ AWS credentials not configured");
      return NextResponse.json(
        { error: "AWS credentials not configured" },
        { status: 500 }
      );
    }

    // List all objects in the bucket (including nested folders)
    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "iot_data/",
      })
    );

    console.log("📂 Total files found:", listResponse.Contents?.length || 0);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.warn("⚠️  No files found in iot_data/");
      return NextResponse.json({ 
        error: "No data found in S3 bucket",
        bucket: bucketName,
        prefix: "iot_data/"
      }, { status: 404 });
    }

    // Filter out folders (keys ending with /) and get only JSON files
    const jsonFiles = listResponse.Contents.filter(
      (obj: any) => obj.Key && !obj.Key.endsWith('/') && obj.Key.endsWith('.json')
    );

    console.log("📄 JSON files found:", jsonFiles.length);

    if (jsonFiles.length === 0) {
      console.warn("⚠️  No JSON files found");
      return NextResponse.json({ 
        error: "No JSON files found in S3 bucket",
        totalFiles: listResponse.Contents.length
      }, { status: 404 });
    }

    // Get the latest uploaded file
    const latestFile = jsonFiles.reduce((a: any, b: any) =>
      (a.LastModified && b.LastModified && a.LastModified > b.LastModified) ? a : b
    );
    const key = latestFile.Key;

    console.log("📥 Fetching latest file:", key);
    console.log("🕐 Last modified:", latestFile.LastModified);

    // Fetch file content
    const getObjectResponse = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );

    const data = await streamToString(getObjectResponse.Body);

    // Try to parse as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(data);
      console.log("✅ Successfully parsed JSON data");
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      parsedData = data;
    }

    return NextResponse.json({
      data: parsedData,
      key,
      lastModified: latestFile.LastModified,
      totalFiles: jsonFiles.length,
    });
  } catch (err: any) {
    console.error("❌ Error fetching S3 data:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.Code || err.$metadata?.httpStatusCode,
    });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch data from S3",
        details: err.message,
        errorType: err.name,
      },
      { status: 500 }
    );
  }
}
