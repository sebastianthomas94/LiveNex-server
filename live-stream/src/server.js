import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { spawn } from "child_process";
import {
  youtubeSettings,
  facebookSettings,
  inputSettings,
} from "../services/ffmpeg.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();

const io = new Server(8200,{
    cors: {
      origin: "*",
    },
    
  });

io.on("connection", (socket) => {
  // console.log("cookies from socket",socket.handshake.headers.cookie);
  console.log("User connected:", socket.id);
  console.log("youtube_rtmp url:", socket.handshake.query.youtube_rtmp);
  console.log("facebook_rtmp url:", socket.handshake.query.facebook_rtmp);




  const ffmpegInput = inputSettings.concat(
    youtubeSettings(socket.handshake.query.youtube_rtmp),
    facebookSettings(socket.handshake.query.facebook_rtmp),
  );
  const ffmpeg = spawn("ffmpeg", ffmpegInput);
  ffmpeg.on("start", (command) => {
    console.log("FFmpeg command:", command);
  })

  
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
     console.log("frames ",msg);
    ffmpeg.stdin.write(msg);
  });
  socket.conn.on("close", (e) => {
    console.log("kill: SIGINT");
    ffmpeg.kill("SIGINT");
  });
});
