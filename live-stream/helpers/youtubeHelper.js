import axios from "axios";

const apiKey = process.env.GOOGLE_API_KEY;

async function getYoutubeComments(accessToken, liveChatId) {
  const apiUrl = "https://youtube.googleapis.com/youtube/v3/liveChat/messages";

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  try {
    const response = await axios.get(apiUrl, {
      params: {
        key: apiKey,
        liveChatId,
        part: "id,snippet,authorDetails",
      },
      headers: headers,
    });

    if (response) {
      //console.log("comnet:", response?.data?.items);

      return response.data.items;
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function youtubeReply(comment, liveChatId, accessToken) {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
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

    axios
      .post(
        `https://youtube.googleapis.com/youtube/v3/liveChat/messages?key=${process.env.GOOGLE_API_KEY}&part=snippet`,
        data,
        {
          headers: headers,
        }
      )
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.error("Error posting message:", error.response?.data?.error);
      });
  } catch (err) {
    console.error(err.message);
  }
}

export { getYoutubeComments, youtubeReply };
