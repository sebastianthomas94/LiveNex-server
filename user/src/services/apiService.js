
import axios from "axios";

const createApiInstance = (accessToken, baseUrl) => {
  return axios.create({
    baseURL: baseUrl,
    timeout: 5000,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': "application/json",
      'Content-Type': 'application/json',
    },
  });
};

 export default createApiInstance;
