import { GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
const generatePresignedUrl = async (
  bucketName,
  objectKey,
  expirationTimeInSeconds,
  s3Client
) => {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  try {
    const command = new GetObjectCommand(params);
    const presignedUrl = await getSignedUrl(s3Client,command, {
      expiresIn: expirationTimeInSeconds,
    });
    console.log("Generated Presigned URL:", presignedUrl);
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error.message);
    throw error;
  }
};

export { generatePresignedUrl };
