import cron from "node-cron";
import { spawn } from "child_process";

import { downloadFromS3 } from "./broadcastHelper.js";
import {
  customRtmpSettings,
  facebookSettings,
  youtubeSettings,
} from "../services/ffmpeg.js";
import axios from "axios";
const scheduleWatchdog = async ({
  scheduledTime,
  youtube_rtmp,
  facebook_rtmp,
  twitch_rtmp,
  fileName,
  localFilePath,
  s3Client,
  GetObjectCommand,
  facebook_liveVideoId,
  facebook_accesstoken,
  fs,
}) => {
  const currentTime = new Date();
  const scheduledDateTime = new Date(scheduledTime);
  const timeDifference = scheduledDateTime - currentTime;
  // Check if the current time is approaching the scheduled time
  console.log("broadcasting in: ", timeDifference);
  const startBroadcast = async () => {
    console.log("Scheduled time is approaching. Starting broadcast...");

    try {
      const videoS3Bucket = process.env.BUCKET;
      const videoS3Key = fileName;
      const s3VideoUrl = `s3://${videoS3Bucket}/${videoS3Key}`;

      // Download the video from S3 bucket
      await downloadFromS3(
        videoS3Key,
        fs,
        s3Client,
        GetObjectCommand,
        localFilePath
      );
      console.log("youtube_rtmp: ", youtube_rtmp);
      console.log("facebook_rtmp: ", facebook_rtmp);
      // Prepare FFmpeg command based on the provided RTMP URLs
      const facebookCommand = [].concat(
        ["-re", "-i", localFilePath],
        facebook_rtmp && facebookSettings(facebook_rtmp)
      );

      const youtubeCommand = [].concat(
        ["-re", "-i", localFilePath],
        youtube_rtmp && youtubeSettings(youtube_rtmp)
      );
      let ffmpeg;
      const startStreaming = (command) => {
        ffmpeg = spawn("ffmpeg", command);

        ffmpeg.on("start", (command) => {
          console.log("FFmpeg command:", command);
        });

        ffmpeg.on("close", (code, signal) => {
          console.log(
            "FFmpeg child process closed, code " + code + ", signal " + signal
          );
        });
        ffmpeg.on("error", (err) => {
          console.error("FFmpeg process error:", err);
        });

        ffmpeg.stderr.on("data", (data) => {
          console.log("FFmpeg STDERR:", data.toString());
        });
      };

      if (facebook_rtmp) {
        console.log(facebook_liveVideoId);
        console.log(facebook_accesstoken);
        
        const apiUrl = `https://graph.facebook.com/${facebook_liveVideoId}?status=LIVE_NOW&access_token=${facebook_accesstoken}`;

        const response = await axios.post(apiUrl);
        console.log(
          "facebook stream start now send the object id is:",
          response?.id
        );
      }
      youtube_rtmp && startStreaming(youtubeCommand);
      facebook_rtmp && startStreaming(facebookCommand);

      console.log("Broadcasting has started at ");
    } catch (error) {
      console.error("Error starting scheduled broadcast:", error.message);
    }
  };
  setTimeout(() => {
    startBroadcast();
    console.log("Operation performed at", scheduledDateTime);
  }, timeDifference);
};

function iso8601ToCron(iso8601) {
  const date = new Date(iso8601);

  // Extract components
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)

  // Build cron expression
  const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

  return cronExpression;
}

export { scheduleWatchdog };
