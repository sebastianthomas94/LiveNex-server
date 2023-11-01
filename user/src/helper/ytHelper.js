import User from "../models/userModel.js";
import axios from "axios";

const ytReply = async (comment, email) => {
const result = await User.findOne({email});
const accessToken = result.youtube.accessToken;
const liveChatId =  result.youtube.liveChatId;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const data = {
    snippet: {
      liveChatId: liveChatId,
      type: "textMessageEvent",
      textMessageDetails: {
        messageText: comment,
      },
    },
  };
  axios.post(
    `https://youtube.googleapis.com/youtube/v3/liveChat/messages?key=${process.env.GOOGLE_CLIENT_SECRET_KEY}&part=snippet`,
    data,
    {
      headers: headers,
    }
  ).then((res)=>{
    console.log("reply to yt send successfully");
  }).catch((e)=>{
    console.log("error when sending reply to yt: ", e.response?.data?.error);
  })
};

export { ytReply };
