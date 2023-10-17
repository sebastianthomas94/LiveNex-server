import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
import {
  accessTokenFB,
  getRtmpUrlFB,
  getUserIdFB,
} from "../helper/fbHelper.js";
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
    const authorizationCode = req.query.code;
    if (!authorizationCode) {
      return res.status(400).send("Authorization code missing.");
    }
    const response = await accessTokenFB(authorizationCode);
    // console.log("response:----",response);

    const userId = await getUserIdFB(response.data.access_token);
    // console.log("userId:----",userId);


    const rtmpUrl = await getRtmpUrlFB(userId, response.data.access_token,req);
    // console.log("rtmpUrl:----",rtmpUrl);


    const rtmp = {
      facebook_rtmp: rtmpUrl,
    };

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
