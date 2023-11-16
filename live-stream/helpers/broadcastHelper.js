async function downloadFromS3(videoS3Key, fs, s3Client, GetObjectCommand, localFilePath) {
    console.log("===================",videoS3Key);
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET,
    Key: videoS3Key,
  });

  const stream = fs.createWriteStream(localFilePath);
  const data = await s3Client.send(command);
  data.Body.pipe(stream);

  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

export { downloadFromS3 };
