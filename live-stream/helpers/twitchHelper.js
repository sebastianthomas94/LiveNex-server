
const twitchChats = (userName, accessToken) => {
    // const client = new tmi.Client({
    //     options: { debug: true },
    //     identity: {
    //         username: userName,
    //         password: accessToken
    //     },
    //     channels: [ userName ]
    // });
    
    // client.connect();
    
    // client.on('message', (channel, tags, message, self) => {
    //     // Ignore echoed messages.
    //     if(self) return;
    
    //     if(message.toLowerCase() === '!hello') {
    //         // "@alca, heya!"
    //         client.say(channel, `@${tags.username}, heya!`);
    //     }
    // });
};

function twichReply(message){
    
}

export { twitchChats, twichReply };
