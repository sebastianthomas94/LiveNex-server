import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-google-oauth2";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import {
  createYoutubeStreams,
  bindYoutubeBroadcastToStream,
  startStreaming,
} from "./youtubeService.js";
import jwt from "jsonwebtoken";
import {
  saveGoogleCredentials,
  saveYoutubeCredential,
  getGoogleProfilePicture,
} from "../helper/mongoUpdates.js";
import { access } from "fs";
import { fbReply } from "../helper/fbHelper.js";
import { ytReply } from "../helper/ytHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
      callbackURL: process.env.CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      saveGoogleCredentials(accessToken, refreshToken, profile);
      return done(null, profile);
    }
  )
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET_KEY,
  process.env.YT_CALLBACK_URL
);

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
});
const saltRounds = 10;

const signupService = (req, res) => {
  // console.log("reached endpoint");
  // console.log(req.body);
  const { email, password, name } = req.body;
  bcrypt.hash(password, saltRounds).then(function (hash) {
    console.log(hash);
    const user = new User({
      email,
      password: hash,
      name,
    });
    user
      .save()
      .then((result) => {
        console.log("user created successfully");
        res
          .status(201)
          .json({ message: email + " Account created successfully" });
      })
      .catch((e) => {
        if (e.code === 11000)
          res.status(409).json({ error: email + " Account already exists" });
        console.log("user already exists", e);
      });
  });
};

const signinService = (req, res) => {
  console.log("body from signin", req.body);
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        bcrypt.compare(password, user.password).then((result) => {
          if (result) {
            const user = {
              email,
            };
            const token = jwt.sign(user, process.env.JWT_SECRET);
            res
              .cookie("jwt", token)
              .status(200)
              .json({ message: "Login successful" });
          } else {
            res.status(401).json({ message: "Invalid password" });
          }
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Internal server error" });
    });
};

const Oauth = (req, res) => {
  try {
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res);
  } catch (err) {
    if (err) throw err;
  }
};

const googleCallBack = (req, res) => {
  try {
    passport.authenticate(
      "google",
      { failureRedirect: "/" },
      async (err, user) => {
        if (err) {
          return res.status(500).json("Authentication failed");
        }
        if (!user) {
          return res.status(401).json("User not authenticated");
        }

        const email = user.email;
        const userExits = await User.findOne({ email });

        if (userExits) {
          const user = {
            email,
          };
          const token = jwt.sign(user, process.env.JWT_SECRET);
          res.cookie("jwt", token);
          res.send(`
          <script>
            window.opener.postMessage(${JSON.stringify(
              user
            )}, 'http://localhost:3000');
            window.close();
          </script>
        `);
        } else {
          const newUser = await User.create({ email });
          if (newUser) {
            res.status(200).json("authenticated");
          } else {
            res.status(400).json("invalid user data");
          }
        }
      }
    )(req, res);
  } catch (err) {
    if (err) throw err;
  }
};

const youtubeAuth = (req, res) => {
  console.log("enetered at the youtube auth");
  //console.log("browser cookies:",req.cookies.user);
  //console.log("token test", token);
  console.log("title query", req.query);
  const { title, description, selectedDateTime } = req.query;
  req.session.title = title;
  req.session.description = description;

  req.session.selectedDateTime = selectedDateTime;
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "online",
      scope: ["https://www.googleapis.com/auth/youtube"],
    });
    res.redirect(authUrl);
  } catch (err) {
    if (err) console.log(err.message);
    throw err;
  }
};

const youtubeOauthCallback = async (req, res) => {
  try {
    console.log("inside youtube callback");
    // console.log("session from youtube callback:", req.session);
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    //console.log(" respose from getTokens youtube:",res)
    //console.log("token", tokens);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    console.log("access token:", accessToken);
    await oauth2Client.setCredentials(tokens);
    // res.status(200).json({response:"Authorization successful! You can now start streaming."});
    const { title, description, selectedDateTime } = req.session;
    let dateAndTime;
    if (selectedDateTime) {
      dateAndTime = selectedDateTime;
      console.log("schedulling youtube live for: ", dateAndTime);
    } else dateAndTime = new Date().toISOString();

    const broadcastRequest = {
      snippet: {
        title,
        description,
        scheduledStartTime: `${dateAndTime}`,
      },
      contentDetails: {
        recordFromStart: true,
        enableAutoStart: true,
        monitorStream: {
          enableMonitorStream: true,
        },
        enableLiveChat: true,
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
      cdn: {
        format: "720p",
        ingestionType: "rtmp",
      },
    };

    const { data } = await youtube.liveBroadcasts.insert({
      part: "snippet,contentDetails,status",
      resource: broadcastRequest,
    });
    console.log("broadcastId:", data.id);
    const broadcastId = data.id;
    const token = req.cookies.jwt;
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const rtmp_url = await createYoutubeStreams(
      title,
      description,
      accessToken,
      broadcastId,
      email
    );

    saveYoutubeCredential(rtmp_url, accessToken, email);
    const user = {
      email,
      rtmp_url,
      YT_accessToken: accessToken,
      broadcastId,
    };
    const mongoUser = await User.findOne({ email: email });
    const profilePicture = await getGoogleProfilePicture(email);
    const jsonToken = jwt.sign(user, process.env.JWT_SECRET);
    const youtubeLiveUrl = "https://www.youtube.com/watch?v=" + broadcastId;
    const json = {
      profilePicture,
      platform: "youtube",
      youtube_rtmp: rtmp_url,
      YT_liveChatId: mongoUser.youtube.liveChatId,
      youtubeLiveUrl,
      selectedDateTime,
    };
    res.cookie("jwt", jsonToken).send(`
        <script>
          window.opener.postMessage(${JSON.stringify(
            json
          )},'http://localhost:3000/');
          window.close();
        </script>
      `);
  } catch (err) {
    console.error("Error in OAuth callback:", err.message);
    res.status(500).send("Error in OAuth callback");
  }
};

const replyComment = (req, res) => {
  const token = req.cookies.jwt;
  const { email } = jwt.verify(token, process.env.JWT_SECRET);
  const { comment } = req.body;
  console.log("reply:", comment);
  fbReply(comment, email);
  ytReply(comment, email);
};

const createTicket = (req, res) => {
  const { subject, description } = req.query;
  const date = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const ticket = {
    subject,
    description,
    status: false,
    date,
  };
  User.findOneAndUpdate(
    { email: req.userEmail },
    { $push: { tickets: ticket } },
    { new: true }
  )
    .then((result) => {
      res.status(200).json({ data: "success" });
    })
    .catch((e) => {
      console.log("error at creating ticket: ", e.message);
    });
};

const gettickets = (req, res) => {
  const email = req.userEmail;
  User.findOne({ email })
    .then((result) => {
      res.status(200).json(result.tickets);
    })
    .catch((e) => console.log("error from getting tickets: ", e.message));
};

const getSubscriptionDetails = (req, res) => {
  const email = req.userEmail;
  User.findOne({ email })
    .then((result) => {
      // console.log(result.razorpayDetails);
      res.status(200).json(result.razorpayDetails);
    })
    .catch((e) => console.log("error at getSubscriptionDetails: ", e.message));
};

const scheduleInfoUpdate = (req, res) => {
  const email = req.userEmail;
  const{youtube, facebook, twitch, iso8601Date} = req.body;
  User.findOneAndUpdate({ email },
    {
      $push: {
        upcomingStreams: req.body,
      },
    })
    .then(() => {
      console.log("live Schedule info updated");
    })
    .catch((e) =>
      console.log("error from updating schedule info: ", e.message)
    );
};

const getUpcomingLives = (req, res) =>{
  const email = req.userEmail;
  User.findOne({email}).then((result)=>{
    const upcomingLives = result.upcomingStreams;
    console.log("sending the upcoming lives to client: ", result);
    res.status(200).json(upcomingLives);
  }).catch((e)=>console.log("error at getpastlives: ", e.message))
}

export {
  signupService,
  signinService,
  Oauth,
  googleCallBack,
  youtubeAuth,
  youtubeOauthCallback,
  replyComment,
  createTicket,
  gettickets,
  getSubscriptionDetails,
  scheduleInfoUpdate,
  getUpcomingLives,
};
