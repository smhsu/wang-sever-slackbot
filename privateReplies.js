const diskUsage = require('./diskUsage');
const replyDiskUsage = diskUsage.replyDiskUsage;

const GREETING_MESSAGE = "Hello, world!";

const HELP_MESSAGE =
`
Here are a list of commands I understand:
*help*: show this message
*info load*: show a link to get current CPU and RAM use of our servers
*info disk*: get current disk usage of select servers
`
const INFO_LOAD_MESSAGE = "Visit this link for CPU and RAM use: http://wangftp.wustl.edu/~silas/serverLoad.cgi";

const MESSAGE_HANDLERS = {
    hi: GREETING_MESSAGE,
    hello: GREETING_MESSAGE,
    help: HELP_MESSAGE,
    "info load": INFO_LOAD_MESSAGE,
    "info usage": INFO_LOAD_MESSAGE,
    "info cpu": INFO_LOAD_MESSAGE,
    "info ram": INFO_LOAD_MESSAGE,
    "info disk": replyDiskUsage,
    "info diskusage": replyDiskUsage,
    "info disk usage": replyDiskUsage,
}

async function replyMessage(message, rtmClient) {
    const handler = MESSAGE_HANDLERS[message.text.toLowerCase()];
    if (typeof handler === "string") {
        return await rtmClient.sendMessage(handler, message.channel);
    } else if (typeof handler === "function") {
        const reply = await handler();
        return await rtmClient.sendMessage(reply, message.channel);
    } else if (message.channel.startsWith("D")) { // Direct message
        return await rtmClient.sendMessage('I don\'t understand.  For a list of commands, type "help".', message.channel);
    } // else {} No handler, but since this is a channel, that's to be expected
}

module.exports = {
    replyMessage: replyMessage
};
