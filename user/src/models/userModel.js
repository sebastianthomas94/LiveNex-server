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
      broadcastId: String,
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
      liveVideoUrl: String,
    },
    razorpayDetails: {
      orderId: String,
      paymentId: String,
      signature: String,
      success: Boolean,
      startDate: Date,
      endDate: Date,
      plan: String,
    },
    tickets: [
      {
        subject: String,
        description: String,
        status: Boolean,
        reply: String,
        date: String,
      },
    ],
    streams: [
      {
        title: String,
        startTime: String,
        destinations: Array,
        broadcast: Boolean,
        youtubeLiveUrl: String,
        facebookLiveUrl: String,
        ScheduledLive: Boolean,
        videoUrl: String,
        youtube: {
          youtube_rtmp: String,
          youtubeLiveUrl: String,
          YT_liveChatId: String,
        },
        facebook: {
          facebook_rtmp: String,
          facebook_liveVideoId: String,
          facebook_accesstoken: String,
          liveVideoId:String,
        },
        twitch: {
          twitch_rtmp: String,
        },
        scheduledTime: String,
      },
    ],
    upcomingStreams: [
      {
        title: String,
        startTime: String,
        destinations: Array,
        broadcast: Boolean,
        youtubeLiveUrl: String,
        facebookLiveUrl: String,
        ScheduledLive: Boolean,
        videoUrl: String,
        fileName:String,
        youtube: {
          youtube_rtmp: String,
          youtubeLiveUrl: String,
          YT_liveChatId: String,
        },
        facebook: {
          facebook_rtmp: String,
          facebook_liveVideoId: String,
          facebook_accesstoken: String,
        },
        twitch: {
          twitch_rtmp: String,
        },
        scheduledTime: String,
      },
    ],
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
