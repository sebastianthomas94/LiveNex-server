import axiosInstance from "./apiService.js";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

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

    // await bindYoutubeBroadcastToStream(broadcastId, id, authorizeToken);

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
}
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

export { createYoutubeStreams, bindYoutubeBroadcastToStream, startStreaming };
