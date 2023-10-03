import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import cors from "cors";
import mongoose from "mongoose";
import { signupService, signinService, Oauth, googleCallBack, youtubeAuth, youtubeOauthCallback } from "./services/main.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";

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
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use(express.json());
app.post("/signin", signinService );
app.post("/signup", signupService );
app.get("/logout", (req,res)=>{
  console.log("logged out");
  res.end();
});
app.get("/auth/google",Oauth);
app.get("/auth/google/callback",googleCallBack);
app.get("/auth/youtubeauth",youtubeAuth);
app.get("/auth/youtube-oauth-callback",youtubeOauthCallback);


app.listen(process.env.PORT, () =>
  console.log(`User server started at ${process.env.PORT}`)
);