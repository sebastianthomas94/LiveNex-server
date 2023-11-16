import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
import User from "../models/userModel.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const accessTokenFB = async (authorizationCode) => {
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
      `https://graph.facebook.com/v13.0/me?fields=id,picture&access_token=${accessTokenFB}`
    );
    console.log("response from get user id fb: ", res.data);
    console.log("user id response: ", res.data.picture);
    return { userId: res.data.id, profilePicture: res.data.picture };
  } catch (error) {
    console.error("Error fetching user data:", error.response.data);
  }
};

const getRtmpUrlFB = async (userId, accessToken, req) => {
  const { title, selectedDateTime, description } = req.session;
  const date = new Date(selectedDateTime);
  const timestamp = Math.floor(date.getTime() / 1000);
  const date1 = new Date(timestamp * 1000);

  const postData = {
    status: selectedDateTime ? "UNPUBLISHED" : "LIVE_NOW",
    title: title,
    description: description,
    ...(selectedDateTime && {event_params: JSON.stringify({ start_time: timestamp })}),
  };
console.log(postData);
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
    console.log("-------", response);
    if (response.data && response.data.stream_url) {
      console.log("RTMP URL:", response.data.stream_url);
      return {
        rtmpUrl: response.data.stream_url,
        liveVideoId: response.data.id,
      };
    } else {
      console.error("Unexpected response format:", response.data);
      return null; // or handle the error as needed
    }
  } catch (error) {
    console.error("Error posting live video:", error.message);
  }
};

const fbReply = async (comment, email) => {
  const result = await User.findOne({ email });
  const accessToken = result.facebook.accessToken;
  const liveVideoId = result.facebook.liveVideoId;
  console.log(accessToken, liveVideoId, comment);
  const url = `https://graph.facebook.com/v18.0/${liveVideoId}/comments?access_token=${accessToken}`;
  const message = {
    message: comment,
  };
  axios
    .post(url, message)
    .then((res) => {
      console.log("reply in fb successfuly added:", res);
    })
    .catch((e) => {
      console.log("error at posting fb reply:", e.response.data);
    });
};

const getLiveVideoUrl = async (liveVideoId, accessToken) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v13.0/${liveVideoId}`,
      {
        params: {
          access_token: accessToken,
          fields: "id,title,video",
        },
      }
    );
    // Check if the live video is live
    console.log("live url data response: ", response.data);
    if (response.data?.video && response.data?.video?.id) {
      const streamUrlID = response.data?.video?.id;
      console.log("Live Video Stream URL id:", streamUrlID);
      return streamUrlID;
    } else {
      console.log("The specified video is not currently live.");
    }
  } catch (error) {
    console.error(
      "Error fetching live video details:",
      error?.response?.data ? error?.response?.data : error.message
    );
  }
};

export { accessTokenFB, getRtmpUrlFB, getUserIdFB, fbReply, getLiveVideoUrl };
