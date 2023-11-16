import {
  getAccessToken,
  getUserId,
  getStreamKey,
} from "../helper/twitchHelper.js";
// import tmi from "tmi.js";

const twitchAuth = (req, res) => {
  try {
    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      redirect_uri: process.env.TWITCH_REDIRECT_URL,
      response_type: "code",
      scope: "channel:read:stream_key",
    }).toString();
    const url = process.env.TWITCH_OAUTH2_BASE_URL + "?" + params;
    res.redirect(url);
  } catch (err) {
    console.log("error from twitch auth:", err.message);
  }
};

const twitchOauthCallback = async (req, res) => {
  const code = req.query.code;
  console.log("autherization code:", code);
  try {
    const tokenResponse = await getAccessToken(code);
    const accessToken = tokenResponse.data.access_token;
    console.log("access token:", accessToken);
    //save this in mongo db
    const { user_id, profilePicture, userName } = await getUserId(accessToken); //not required
    console.log("user id:", user_id);
    console.log("UserName:", userName);
    //save user id
    const twitchLiveUrl = `https://www.twitch.tv/${userName}`;
    const stream_key = await getStreamKey(accessToken, user_id);
    const rtmp_url = "rtmp://live.twitch.tv/app/" + stream_key;
    console.log(rtmp_url);
    const rtmp = {
      twitch_rtmp: rtmp_url,
      profilePicture,
      twitchLiveUrl,
    };
    res.send(`
    <script>
      window.opener.postMessage(${JSON.stringify(
        rtmp
      )},'http://localhost:3000/');
      window.close();
    </script>
  `);
  } catch (err) {
    console.log("error from twitch callback:", err.message);
  }
};

export { twitchAuth, twitchOauthCallback };
