import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import {
  accessTokenFB,
  getRtmpUrlFB,
  getUserIdFB,
} from "../helper/fbHelper.js";
import { saveFacebookCredentials } from "../helper/mongoUpdates.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const facebookAuth = (req, res) => {
  try {
    const { title, description } = req.query;
    req.session.title = title;
    req.session.description = description;
    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${process.env.FB_CLIENT_ID}&redirect_uri=${process.env.FACEBOOK_AUTH_REDIRECT_URL}&scope=publish_video,read_insights`;
    res.redirect(authUrl);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const facebookOauthCallback = async (req, res) => {
  try {
    console.log("entered faceboook callback:");
    const token = req.cookies.jwt;
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const authorizationCode = req.query.code;
    if (!authorizationCode) {
      return res.status(400).send("Authorization code missing.");
    }
    const response = await accessTokenFB(authorizationCode);
    // console.log("response:----",response);
    const facebook_accesstoken = response.data.access_token;
    const { userId, profilePicture } = await getUserIdFB(facebook_accesstoken);
    console.log("userId:----", userId);
    console.log("profilePicture: ", profilePicture.data.url);
    const dpURL = `https://graph.facebook.com/v13.0/${userId}/picture?width=1000&height=1000`;
    const { rtmpUrl, liveVideoId } = await getRtmpUrlFB(
      userId,
      response.data.access_token,
      req
    );
    console.log("rtmpUrl:----", rtmpUrl);
    console.log("live video id:", liveVideoId);
    const rtmp = {
      facebook_rtmp: rtmpUrl,
      facebook_liveVideoId: liveVideoId,
      facebook_accesstoken,
      profilePicture: dpURL,
    };
    saveFacebookCredentials({
      facebook_rtmp: rtmpUrl,
      facebook_liveVideoId: liveVideoId,
      facebook_accesstoken,
      profilePicture: dpURL,
      email
    });
    res.send(`
  <script>
    window.opener.postMessage(${JSON.stringify(rtmp)},'http://localhost:3000/');
    window.close();
  </script>
`);
  } catch (err) {
    // if (err.response) {
    //   console.error("Response Error:", err.response.data);
    // } else if (err.request) {
    //   console.error("Request Error:", err.request);
    // } else {
    //   console.error("Error:", err.message);
    // }
    console.log(err);
  }
};

export { facebookAuth, facebookOauthCallback };
