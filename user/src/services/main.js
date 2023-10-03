import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-google-oauth2";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

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
  console.log("reached endpoint");
  console.log(req.body);
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
            res.status(200).json({ message: "Login successful" });
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
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    console.log("token", tokens);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    await oauth2Client.setCredentials(tokens);
    // res.status(200).json({response:"Authorization successful! You can now start streaming."});
    const title = "Title";
    const description = "this i a live";
    const broadcastRequest = {
      snippet: {
        title,
        description,
        scheduledStartTime: `${new Date().toISOString()}`,
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
    const rtmp_url = await createYoutubeStreams(title, description, accessToken, broadcastId);

    res.send(`
          <script>
          const rtmp = ${JSON.stringify(rtmp_url)};
            window.opener.postMessage(rtmp,'http://localhost:3000/dashboard');
            window.close();
          </script>
       `);
  } catch (err) {
    console.error("Error in OAuth callback:", err.message);
    res.status(500).send("Error in OAuth callback");
  }
};

export {
  signupService,
  signinService,
  Oauth,
  googleCallBack,
  youtubeAuth,
  youtubeOauthCallback,
};

async function createYoutubeStreams(
  youtubeBroadcastTitle,
  youtubeBroadcastDescription,
  authorizeToken,
  broadcastId
) {
  try {
    const data = {
      snippet: {
        title: youtubeBroadcastTitle,
        description: youtubeBroadcastDescription,
      },
      cdn: {
        format: "",
        ingestionType: "rtmp",
        frameRate: "variable",
        resolution: "variable",
      },
      contentDetails: { isReusable: true },
    };

    const config = {
      headers: {
        Authorization: `Bearer ${authorizeToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const stream = await axios
      .post(
        `https://youtube.googleapis.com/youtube/v3/liveStreams?part=snippet%2Ccdn%2CcontentDetails%2Cstatus&key=${process.env.GOOGLE_API_KEY}`,
        data,
        config
      )
      .then(async (res) => {
        const { ingestionAddress, streamName } = res.data.cdn.ingestionInfo;
        const id = res.data.id;
        console.log(
          "ingestionAddress, streamName",
          streamName,
          ingestionAddress
        );

        const youtubeRTMURL = ingestionAddress + "/" + streamName;
        console.log(youtubeRTMURL)
/*         response.send(`
        <script>
        const rtmp = ${JSON.stringify(youtubeRTMURL)};
          window.opener.postMessage(rtmp,'http://localhost:3000/dashboard');
          window.close();
        </script>
      `); */

        bindYoutubeBroadcastToStream(broadcastId, id, authorizeToken);
        return {
          id: res.data.id,
          youtubeDestinationUrl: ingestionAddress + "/" + streamName,
        };
      })
      .catch((error) => {
        console.error(error.message);
      });

    return ;
  } catch (err) {
    console.error(err.message);
  }
}

async function bindYoutubeBroadcastToStream(
  youtubeBroadcastId,
  youtubeStreamId,
  youtubeAccessToken,
  userId
) {
  const config = {
    headers: {
      Authorization: `Bearer ${youtubeAccessToken}`,
      Accept: "application/json",
    },
  };

  try {
    console.log("binding youtube_________");
    const response = await axios.post(
      `https://youtube.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${youtubeBroadcastId}&part=snippet&streamId=${youtubeStreamId}&access_token=${youtubeAccessToken}&key=${process.env.GOOGLEAPIKEY}`,
      {},
      config
    );
    const liveChatId = response.data.snippet.liveChatId;
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          "youtube.liveChatId": liveChatId,
        },
      }
    );
    console.log("Live Chat ID: from binde streaming", liveChatId);
    await startStreaming(youtubeBroadcastId, youtubeAccessToken, userId);

    return response.data;
  } catch (error) {
    console.error("error message from  bind broadcast", error.message);
    throw error;
  }
};


const startStreaming = async (
  youtubeBroadcastId,
  youtubeAccessToken,
  userId
) => {
  const config = {
    headers: {
      Authorization: `Bearer ${youtubeAccessToken}`,
      Accept: "application/json",
    },
  };

  await axios
    .post(
      `https://youtube.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=live&id=${youtubeBroadcastId}&part=id&part=status&key=${process.env.GOOGLEAPIKEY}`,
      config
    )
    .then(async (res) => {
      const liveChatId = res.data.snippet.liveChatId;
      await User.updateOne(
        { _id: userId },
        { $set: { "youtube.liveChatId": liveChatId } }
      );
    })
    .catch((err) => {
      console.log(err.response.data.error.errors);
    });

  console.log("youtube going live");
};

