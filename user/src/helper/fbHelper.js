import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const accessTokenFB =async (authorizationCode) => {
    try {
   
  
      const response = await axios.post(
        `https://graph.facebook.com/v12.0/oauth/access_token`,
        null,
        {
          params: {
            client_id: process.env.FB_CLIENT_ID,
            redirect_uri: process.env.FACEBOOK_AUTH_REDIRECT_URL,
            client_secret: process.env.FB_SECRET_KEY,
            code: authorizationCode,
          },
        }
      );

      
        return response;

    } catch (err) {
      console.error(err);
    }
  };

  const getUserIdFB = async (accessTokenFB) => {
    try {
      const res = await axios.get(
        `https://graph.facebook.com/v12.0/me?fields=id&access_token=${accessTokenFB}`
      );
      return res.data.id;
    } catch (error) {
      console.error("Error fetching user data:", error.response.data);
    }
  };

  const getRtmpUrlFB = async (userId, accessToken, req) => {
    const postData = {
      status: "LIVE_NOW",
      title: req.session.title,
      description: req.session.description,
    };
  
    try {
      const response = await axios.post(
        `https://graph.facebook.com/${userId}/live_videos`,
        null,
        {
          params: postData,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("rtmp url:",response.data.stream_url);
        return response.data.stream_url;
      
    } catch (error) {
      console.error("Error posting live video:", error);
    }
  };

  export {accessTokenFB,getRtmpUrlFB,getUserIdFB}