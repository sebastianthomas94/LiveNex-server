import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: false,
    },
    name: {
      type: String,
      require: true,
    },
    youtube: {
      accessToken: String,
      refreshTocken: String,
      rtmpUrl: String,
      photo: String,
      liveChatId: String,
    },
    google: {
      accessToken: String,
      refreshTocken: String,
      photo: String,
    },
    instagram: {
      accessToken: String,
      refreshTocken: String,
      rtmpUrl: String,
      photo: String,
    },
    twitch: {
      accessToken: String,
      refreshTocken: String,
      rtmpUrl: String,
      photo: String,
    },
    facebook: {
      accessToken: String,
      refreshTocken: String,
      liveVideoId: String,
      rtmpUrl: String,
      photo: String,
    },
    razorpayDetails: {
      orderId: String,
      paymentId: String,
      signature: String,
      success: Boolean,
      startDate: Date,
      endDate: Date,
    },
    tickets: [
      {
        email: String,
        subject: String,
        description: String,
        status: Boolean,
      },
    ],
    streams: [
      {
        title: String,
        startTime: Date,
        destinations: Array,
      },
    ],
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
