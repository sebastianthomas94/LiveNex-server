import axiosInstance from "./apiService.js";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
// import User from "../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });


async function createYoutubeStreams(
  youtubeBroadcastTitle,
  youtubeBroadcastDescription,
  authorizeToken,
  broadcastId
) {
  try {
    const axios = axiosInstance(authorizeToken, process.env.YT_API_BASEURL);
    const params = {
        part: 'snippet,cdn,contentDetails,status',
        key: process.env.GOOGLE_API_KEY
      };
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

    const url = "/liveStreams";
    const res = await axios.post(url, data, {params});
    //console.log("creating live stream-- respose:", res);
    const { ingestionAddress, streamName } = res.data.cdn.ingestionInfo;
    const id = res.data.id;

    const youtubeRTMURL = ingestionAddress + "/" + streamName;
    console.log(youtubeRTMURL);

    await bindYoutubeBroadcastToStream(broadcastId, id, authorizeToken);

    return youtubeRTMURL;
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
  // const config = {
  //   headers: {
  //     Authorization: `Bearer ${youtubeAccessToken}`,
  //     Accept: "application/json",
  //   },
  // };

  try {
    console.log("binding youtube_________");
    const axios = axiosInstance(youtubeAccessToken, process.env.YT_API_BASEURL);
    const params = {
      id: youtubeBroadcastId,
      part: 'snippet',
      streamId: youtubeStreamId,
      access_token: youtubeAccessToken,
      key: process.env.GOOGLE_CLIENT_SECRET_KEY,
    };
    const url = "/liveBroadcasts/bind";
    const response = await axios.post(url, {}, {params});
    const liveChatId = response.data.snippet.liveChatId;
    // await User.updateOne(
    //   { _id: userId },
    //   {
    //     $set: {
    //       "youtube.liveChatId": liveChatId,
    //     },
    //   }
    // );
    console.log("Live Chat ID: from binde streaming", liveChatId);
    await startStreaming(youtubeBroadcastId, youtubeAccessToken, userId);

    return response.data;
  } catch (error) {
    console.error("error message from  bind broadcast", error.message);
    throw error;
  }
}
const startStreaming = async (
  youtubeBroadcastId,
  youtubeAccessToken,
  userId
) => {
  console.log("Starting stream________");
  // const config = {
  //   headers: {
  //     Authorization: `Bearer ${youtubeAccessToken}`,
  //     Accept: "application/json",
  //   },
  // };

    const axios = axiosInstance(youtubeAccessToken, process.env.YT_API_BASEURL);

  const params = {
    broadcastStatus: 'live',
    id: youtubeBroadcastId,
    part: 'id,status',
    key: process.env.GOOGLE_CLIENT_SECRET_KEY,
  };
  const url = "/liveBroadcasts/transition";
  axios
    .post(
      url,{},{params}
    )
    .then(async (res) => {
      const liveChatId = res.data.snippet.liveChatId;
      console.log("response form create stream==============================================>",res)
      // await User.updateOne(
      //   { _id: userId },
      //   { $set: { "youtube.liveChatId": liveChatId } }
      // );
    })
    .catch((err) => {
      console.log(err?.response?.data?.error?.errors);
    });

  console.log("youtube going live");
};

export { createYoutubeStreams, bindYoutubeBroadcastToStream, startStreaming };
