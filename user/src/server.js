import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import cors from "cors";
import mongoose from "mongoose";
import {
  signupService,
  signinService,
  Oauth,
  googleCallBack,
  youtubeAuth,
  youtubeOauthCallback,
  replyComment
} from "./services/main.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import { authAndSave } from "./middlewear/auth-and- cookiesave.js";
import {
  facebookAuth,
  facebookOauthCallback,
} from "./services/facebookEndpoints.js";
import {
  twitchAuth,
  twitchOauthCallback,
} from "./services/twitchEndpoints.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to user db!"));

const app = express();

app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "*",
    credentials: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.post("/signin", signinService);
app.post("/signup", signupService);
app.get("/logout", (req, res) => {
  console.log("logged out");
  res.end();
});
app.post("/reply", replyComment);
app.get("/auth/google", Oauth);
app.get("/auth/google/callback", googleCallBack);
app.get("/auth/youtubeauth", authAndSave, youtubeAuth);
app.get("/auth/youtube-oauth-callback", youtubeOauthCallback);
app.get("/auth/fbauuth", authAndSave, facebookAuth);
app.get("/auth/facebook-oauth-callback", facebookOauthCallback);
app.get("/auth/twitchauth", authAndSave, twitchAuth);
app.get("/auth/twitch-oauth-callback", twitchOauthCallback);

app.listen(process.env.PORT, () =>
  console.log(`User server started at ${process.env.PORT}`)
);
