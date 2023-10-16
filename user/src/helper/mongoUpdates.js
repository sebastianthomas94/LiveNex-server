import User from "../models/userModel.js";

const saveGoogleCredentials = (accessToken, refreshToken, profile) => {
  const { email, displayName } = profile;
  const photo = profile.photos[0].value;
  User.findOneAndUpdate(
    { email: email },
    {
      name: displayName,
      "google.accessToken": accessToken,
      "google.refreshToken": refreshToken,
      "google.photo": photo,
    },
    { upsert: true, new: true }
  )
    .then((user) => {
      if (user) {
        console.log(
          "User updated or created successfully from passport oauth google stategy"
        );
        // The 'user' variable now contains the updated or newly created user document.
      } else {
        console.log("User not found or created");
      }
    })
    .catch((err) => {
      console.error("Error updating or creating user:", err);
    });
};

const saveYoutubeCredential = (rtmp, accessToken, email) => {
  User.findOneAndUpdate(
    { email: email },
    {
      "youtube.accessToken": accessToken,
      "youtube.rtmpUrl": rtmp,
    },
    { upsert: false, new: true }
  )
    .then((result) => {
      console.log("rtmp and access token updated (youtube)");
    })
    .catch((e) => {});
};

const getGoogleProfilePicture = async (email) => {
  const result = await User.findOne({ email });
  const url = result.google.photo;
  return url;
};

export {
  saveGoogleCredentials,
  saveYoutubeCredential,
  getGoogleProfilePicture,
};
