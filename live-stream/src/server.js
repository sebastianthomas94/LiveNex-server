import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { spawn } from "child_process";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import corn from "node-cron";
import {
  youtubeSettings,
  facebookSettings,
  inputSettings,
  customRtmpSettings,
} from "../services/ffmpeg.js";
import { getLiveComments } from "../helpers/facebookHelper.js";
import {} from "../helpers/twitchHelper.js";
import { getYoutubeComments } from "../helpers/youtubeHelper.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"; // Import S3Client and GetObjectCommand
import fs from "fs";
import { downloadFromS3 } from "../helpers/broadcastHelper.js";
import { scheduleWatchdog } from "../helpers/scheduleWatchdog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();

const s3Client = new S3Client({
  region: process.env.AMAZON_S3_REGION,
  credentials: {
    accessKeyId: process.env.AMAZON_S3_ACCESS_KEY,
    secretAccessKey: process.env.AMAZON_S3_SECRET_KEY,
  },
});

const io = new Server(8200, {
  cors: {
    origin: "*",
  },
});

io.on("connection", async (socket) => {
  let counter = 0;
  let lastTime = new Date(),
    nowTime,
    localFilePath;
  localFilePath = path.join(__dirname, "downloaded_video.mp4");

  const sentComments = new Set();
  function filterNewComments(newComments) {
    const unsentComments = [];

    // Check each comment to see if it's new
    newComments.forEach((comment) => {
      if (!sentComments.has(comment.id)) {
        unsentComments.push(comment);
        sentComments.add(comment.id);
      }
    });

    return unsentComments;
  }
  // console.log("cookies from socket",socket.handshake.headers.cookie);
  console.log("User connected:", socket.id);
  console.log("youtube_rtmp url:", socket.handshake.query.youtube_rtmp);
  console.log("facebook_rtmp url:", socket.handshake.query.facebook_rtmp);
  console.log("twitch_rtmp url:", socket.handshake.query.twitch_rtmp);
  console.log("YOUTUBE LiveChatId:", socket.handshake.query.YT_liveChatId);
  const cookies = cookie.parse(socket.request.headers.cookie || "");

  const { YT_accessToken } = jwt.verify(cookies.jwt, process.env.JWT_SECRET);
  const youtube_rtmp = socket.handshake.query.youtube_rtmp;
  const facebook_rtmp = socket.handshake.query.facebook_rtmp;
  const twitch_rtmp = socket.handshake.query.twitch_rtmp;
  const YT_liveChatId = socket.handshake.query.YT_liveChatId;
  const facebook_liveVideoId = socket.handshake.query.facebook_liveVideoId;
  const facebook_accesstoken = socket.handshake.query.facebook_accesstoken;
  const broadcast = socket.handshake.query.broadcast;
  const fileName = socket.handshake.query.fileName;
  const scheduledTime = socket.handshake.query.scheduledTime;
  const scheduling = socket.handshake.query.scheduling;
  const videoFilePath =
    "/home/sebastian/Desktop/Brototype/Week 23/LiveNex-rollback/LiveNex-server/api-gateway/public/videos/" +
    fileName;

  let ffmpegInput, ffmpeg;
  let facebookCommand, twitchCommand, youtubeCommand;
  if (!scheduling) {
    if (!broadcast)
      ffmpegInput = inputSettings.concat(
        youtube_rtmp && youtubeSettings(youtube_rtmp),
        facebook_rtmp && facebookSettings(facebook_rtmp),
        twitch_rtmp && customRtmpSettings(twitch_rtmp)
      );
    else {
      facebookCommand = [].concat(
        ["-re", "-i", localFilePath],
        facebook_rtmp && facebookSettings(facebook_rtmp)
      );
      twitchCommand = [].concat(
        ["-re", "-i", localFilePath],
        twitch_rtmp && customRtmpSettings(twitch_rtmp)
      );
      youtubeCommand = [].concat(
        ["-re", "-i", localFilePath],
        youtube_rtmp && youtubeSettings(youtube_rtmp)
      );
    }
    try {
      if (!broadcast) ffmpeg = spawn("ffmpeg", ffmpegInput);
      else {
        const videoS3Bucket = process.env.BUCKET;
        const videoS3Key = fileName;
        const s3VideoUrl = `s3://${videoS3Bucket}/${videoS3Key}`;

        await downloadFromS3(
          videoS3Key,
          fs,
          s3Client,
          GetObjectCommand,
          localFilePath,
        );
        const startStreaming = (command) => {
          ffmpeg = spawn("ffmpeg", command);
        };
        youtube_rtmp && startStreaming(youtubeCommand);
        facebook_rtmp && startStreaming(facebookCommand);
        twitch_rtmp && startStreaming(twitchCommand);
        console.log("broadcasting the stream: ");
      }

      ffmpeg.on("start", (command) => {
        console.log("FFmpeg command:", command);
      });

      ffmpeg.on("close", (code, signal) => {
        console.log(
          "FFmpeg child process closed, code " + code + ", signal " + signal
        );
      });

      ffmpeg.stdin.on("error", (e) => {
        console.log("FFmpeg STDIN Error", e);
      });

      ffmpeg.stderr.on("data", (data) => {
        console.log("FFmpeg STDERR:", data.toString());
      });
      socket.on("message", (msg) => {
        //console.log("frames ",msg);
        ffmpeg.stdin.write(msg);
      });
      socket.conn.on("close", (e) => {
        console.log("kill: SIGINT");
        ffmpeg.kill("SIGINT");
      });
    } catch (error) {
      console.error("Error starting FFmpeg:", error);
    }
  }

  socket.on("reply", (data) => {
    console.log("reply from user:", data);
  });

  socket.on("requestingComments", async (data) => {
    console.log("Received comment fetch request:", data);
    try {
      const commentRate = "one_per_two_seconds";
      const YTComments =
        YT_liveChatId &&
        (await getYoutubeComments(YT_accessToken, YT_liveChatId));
      console.log(
        "fb live id:",
        facebook_liveVideoId,
        "--------fb access token",
        facebook_accesstoken
      );
      const FBComments = await getLiveComments(
        facebook_liveVideoId,
        facebook_accesstoken,
        commentRate
      );
      //console.log("FBComments: ",FBComments.data[0].from);
      //const TWComments = await twitchChats();
      const transformedFBcomments = FBComments.data.map((item) => ({
        displayMessage: item.message,
        displayName: item.from.name,
        publishedAt: item.created_time,
        platform: "facebook",
        profileImageUrl: `https://graph.facebook.com/v13.0/${item?.from?.id}/picture?width=100&height=100`,
        id: item.id,
      }));
      nowTime = new Date();
      counter += 1;
      console.log(counter, "---sending response");
      console.log("time difference:", nowTime - lastTime);
      lastTime = nowTime;
      const transformedComments = YTComments.map((item) => ({
        displayMessage: item.snippet.displayMessage,
        displayName: item.authorDetails.displayName,
        publishedAt: item.snippet.publishedAt,
        platform: "youtube",
        profileImageUrl: item.authorDetails.profileImageUrl,
        id: item.id,
      }));
      const filteredComments = filterNewComments([
        ...transformedComments,
        ...transformedFBcomments,
      ]);
      console.log("new YT comments:", filteredComments);

      if (transformedComments)
        io.to(socket.id).emit("comments", [
          ...transformedComments,
          ...transformedFBcomments,
        ]);
    } catch (error) {
      console.error("Error fetching comments:", error.message);
    }
  });

  socket.on("Schedule Live", () => {
    // Extract relevant parameters from socket.handshake.query

    // Call the function to start broadcasting when scheduled time is approached
    scheduleWatchdog({
      scheduledTime,
      youtube_rtmp,
      facebook_rtmp,
      twitch_rtmp,
      fileName,
      localFilePath,
      s3Client,
      fs,
      GetObjectCommand,
      facebook_liveVideoId,
      facebook_accesstoken,
      
    });
  });
});
