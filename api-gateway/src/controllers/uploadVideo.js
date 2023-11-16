import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { Upload } from "@aws-sdk/lib-storage";

import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { generatePresignedUrl } from "../helpers/main.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const s3Client = new S3Client({
  region: process.env.AMAZON_S3_REGION,
  credentials: {
    accessKeyId: process.env.AMAZON_S3_ACCESS_KEY,
    secretAccessKey: process.env.AMAZON_S3_SECRET_KEY,
  },
});

const uploadtos3 = async (req, res) => {
  try {
    const file = req.file;
    const fileName = Date.now() + file.originalname;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Create a readable stream from the file buffer
    const fileStream = Readable.from(file.buffer);

    const params = {
      Bucket: process.env.BUCKET,
      Key: fileName, // Use the original file name as the S3 object key
      Body: fileStream,
    };
    const upload = new Upload({
      client: s3Client,
      params,
    });
    const result = await upload.done();

    const videoUrl = await generatePresignedUrl(
      process.env.BUCKET,
      fileName,
      process.env.VIDEO_LINK_EXP_TIME,
      s3Client
    );
    res.status(200).json({
      fileName,
      message: "File uploaded successfully",
      location: result,
      videoUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { uploadtos3 };
