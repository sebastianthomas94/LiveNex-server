import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { spawn } from "child_process";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import {
  youtubeSettings,
  facebookSettings,
  inputSettings,
  customRtmpSettings,
} from "../services/ffmpeg.js";
import { getLiveComments } from "../helpers/facebookHelper.js";
import {} from "../helpers/twitchHelper.js";
import { getYoutubeComments } from "../helpers/youtubeHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();

const io = new Server(8200, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  let counter = 0;
  let lastTime = new Date(), nowTime;
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
  console.log("json web token:", cookies.jwt);

  const { YT_accessToken } = jwt.verify(cookies.jwt, process.env.JWT_SECRET);
  const youtube_rtmp = socket.handshake.query.youtube_rtmp;
  const facebook_rtmp = socket.handshake.query.facebook_rtmp;
  const twitch_rtmp = socket.handshake.query.twitch_rtmp;
  const YT_liveChatId = socket.handshake.query.YT_liveChatId;
  const facebook_liveVideoId = socket.handshake.query.facebook_liveVideoId;
  const facebook_accesstoken = socket.handshake.query.facebook_accesstoken;

  const ffmpegInput = inputSettings.concat(
    youtube_rtmp && youtubeSettings(youtube_rtmp),
    facebook_rtmp && facebookSettings(facebook_rtmp),
    twitch_rtmp && customRtmpSettings(twitch_rtmp),
  );
  const ffmpeg = spawn("ffmpeg", ffmpegInput);
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

  socket.on("reply",(data)=>{
    console.log("reply from user:",data);
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
});


