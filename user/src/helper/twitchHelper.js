import axios from "axios";
// import tmi from "tmi.js";

const getAccessToken = async (code) => {
  try {
    return await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_SECRET_KEY,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_REDIRECT_URL,
      },
    });
  } catch (err) {
    console.log("error from getAccessToken:", err.message);
  }
};

const getUserId = async (accessToken) => {
  try {
    const response = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userData = response.data.data[0];
    const user_id = userData.id;
    const userName = userData.login;
    const profilePicture = userData.profile_image_url;
    //console.log("user data twitch:", userData);
    return { user_id, profilePicture, userName };
  } catch (err) {
    console.log("error from getUserId:", err.message);
  }
};

const getStreamKey = async (accessToken, user_id) => {
  // Define the request configuration
  try {
    const config = {
      method: "get",
      url: "https://api.twitch.tv/helix/streams/key",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
      params: {
        broadcaster_id: user_id,
      },
    };
    const response = await axios(config);

    if (response.status === 200) {
      const streamKey = response.data.data[0].stream_key;
      console.log("Stream key:", streamKey);
      console.log("responst from fetching twitch stream key: ", response.data);
      return streamKey;
    } else {
      console.error("Failed to retrieve stream key:", response.data);
    }
  } catch (err) {
    console.log("error from getStreamKey:", err.message);
  }
};

export { getAccessToken, getUserId, getStreamKey };
