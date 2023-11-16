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

const saveYoutubeCredential = (rtmp, accessToken, email, broadcastId) => {
  User.findOneAndUpdate(
    { email: email },
    {
      "youtube.accessToken": accessToken,
      "youtube.rtmpUrl": rtmp,
      "youtube.broadcastId": broadcastId,
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

const saveFacebookCredentials = (data) => {
  const {
    facebook_rtmp,
    facebook_liveVideoId,
    facebook_accesstoken,
    profilePicture,
    email,
    facebookLiveUrl,
  } = data;
  console.log("data to be updated at facebook: ", data);
  User.findOneAndUpdate(
    { email },
    {
      $set: {
        "facebook.accessToken": facebook_accesstoken,
        "facebook.rtmpUrl": facebook_rtmp,
        "facebook.liveVideoId": facebook_liveVideoId,
        "facebook.profilePicture": profilePicture,
        "facebook.liveVideoUrl": facebookLiveUrl,
      },
    }
  )
    .then((res) => {
      console.log("facebook credentials added to mongo: ", res);
    })
    .catch((e) =>
      console.log("error while updating fb credentials:", e.message)
    );
};

const checkIfSubscribed = async (req, res) => {
  const email = req.userEmail;
  const result = await User.findOne({ email });
  if (
    result.razorpayDetails?.endDate &&
    new Date(result.razorpayDetails?.endDate) > new Date()
  ) {
    res.status(200).json({ data: true });
  } else res.status(200).json({ data: false });
};

const saveFacebookUrl = (url, email) => {
  User.findOne({ email })
    .then((result) => {
      console.log("======", result)
      const stream = result.streams[result.streams.length-1]
      const newStream = {...stream, facebookLiveUrl:url}

      console.log("newStream :" , newStream);
      return User.updateOne({ email }, { $push: { streams: newStream } });
    })
    .catch((e) => {
      console.log("error at upadating fb url:", e.message);
    });
};
export {
  saveGoogleCredentials,
  saveYoutubeCredential,
  getGoogleProfilePicture,
  saveFacebookCredentials,
  checkIfSubscribed,
  saveFacebookUrl,
};
