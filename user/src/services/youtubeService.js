import axiosInstance from "./apiService.js";
import User from "../models/userModel.js";

async function createYoutubeStreams(
  youtubeBroadcastTitle,
  youtubeBroadcastDescription,
  authorizeToken,
  broadcastId,
  email
) {
  try {
    const axios = axiosInstance(authorizeToken, process.env.YT_API_BASEURL);
    const params = {
      part: "snippet,cdn,contentDetails,status",
      key: process.env.GOOGLE_API_KEY,
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
    const res = await axios.post(url, data, { params });
    //console.log("creating live stream-------- respose:", res);
    const { ingestionAddress, streamName } = res.data.cdn.ingestionInfo;
    const streamId = res.data.id;
    console.log("streamId:", streamId);


    const youtubeRTMURL = ingestionAddress + "/" + streamName;
    console.log("youtube rtmp url:", youtubeRTMURL);

    await bindYoutubeBroadcastToStream(
      broadcastId,
      streamId,
      authorizeToken,
      email
    );

    return youtubeRTMURL;
  } catch (err) {
    console.error("error form create stream:", err.message);
  }
}

async function bindYoutubeBroadcastToStream(
  youtubeBroadcastId,
  youtubeStreamId,
  youtubeAccessToken,
  email
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
      part: "snippet",
      streamId: youtubeStreamId,
      access_token: youtubeAccessToken,
      key: process.env.GOOGLE_CLIENT_SECRET_KEY,
    };
    const url = "/liveBroadcasts/bind";
    const response = await axios.post(url, {}, { params });
    const liveChatId = response.data.snippet.liveChatId;
    User.findOneAndUpdate(
      { email: email },
      {
          "youtube.liveChatId": liveChatId,
        
      },
      { upsert: true, new: true }
    )
      .then((res) => {
        console.log("live chat id has been updated:", liveChatId);
      })
      .catch((e) => {
        console.log(e.message);
      });
    console.log("Live Chat ID: from binde streaming", liveChatId);
    await startStreaming(youtubeBroadcastId, youtubeAccessToken);

    return response.data;
  } catch (error) {
    console.error("error message from  bind broadcast", error.message);
    throw error;
  }
}
const startStreaming = async (
  youtubeBroadcastId,
  youtubeAccessToken
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
    broadcastStatus: "live",
    id: youtubeBroadcastId,
    part: "id,status",
    key: process.env.GOOGLE_CLIENT_SECRET_KEY,
  };
  const url = "/liveBroadcasts/transition";
  axios
    .post(url, {}, { params })
    .then(async (res) => {
      const liveChatId = res.data.snippet.liveChatId;
      // await User.updateOne(
      //   { _id: userId },
      //   { $set: { "youtube.liveChatId": liveChatId } }
      // );
    })
    .catch((err) => {
      console.log("error form start stream:", err?.message);
    });

  console.log("youtube going live");
};


export { createYoutubeStreams, bindYoutubeBroadcastToStream, startStreaming };
