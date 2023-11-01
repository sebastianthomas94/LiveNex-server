import axios from "axios";

function getLiveComments(liveVideoId, userAccessToken, commentRate) {
  const apiUrl = `https://graph.facebook.com/${liveVideoId}/comments?access_token=${userAccessToken}`;
 

  return axios
    .get(apiUrl)
    .then((response) => {
      return response.data; // Return the response data
    })
    .catch((error) => {
      throw error; // Throw an error if the request fails
    });
}

function facebookReply(message, accessToken,liveVideoId){
  const commentData = {
    message,
  };
  const url = `https://graph.facebook.com/v18.0/${liveVideoId}/comments?access_token=${accessToken}`;
  axios.post(url, commentData)
  .catch((e)=>console.log("error while sending fb comment:", e.message))
};

export { getLiveComments, facebookReply };
