/**
 * Configures chatbot replies for private messages.
 * 
 * @author Silas Hsu
 */
"use strict";

const { getDiskUsageMessage, getDiskCheckMessage } = require('./diskUsage');

const GREETING_MESSAGE = "Hello, world!";
const HELP_MESSAGE =
`
Here are a list of commands I understand:
*help*: show this message
*info load*: show a link to get current CPU and RAM use of our servers
*info disk*: get current disk usage of select file systems
*about*: About me!
`;
const INFO_LOAD_MESSAGE = "Visit this link for CPU and RAM use: http://wangftp.wustl.edu/~silas/serverLoad.cgi";
const ABOUT_MESSAGE = "I was created by Silas Hsu.  I like well-documented code, free space, and you, of course ❤️!  " +
    "See my source code at https://github.com/smhsu/wang-sever-slackbot";

/**
 * Mapping from received message to reply.  The value can either be a string, or a function that returns a string.  Do
 * not put any uppercase letters in keys, as all messages will be lowercased.
 */
const MESSAGE_HANDLERS = {
    hi: GREETING_MESSAGE,
    hello: GREETING_MESSAGE,
    help: HELP_MESSAGE,
    about: ABOUT_MESSAGE,

    "info load": INFO_LOAD_MESSAGE,
    "info usage": INFO_LOAD_MESSAGE,
    "info cpu": INFO_LOAD_MESSAGE,
    "info ram": INFO_LOAD_MESSAGE,

    "info disk": getDiskUsageMessage,
    "info diskusage": getDiskUsageMessage,
    "info disk usage": getDiskUsageMessage,

    "check disk": getDiskCheckMessage, // For debugging; not shown in help.
};

/**
 * Given a message, replies to it via the given Slack RTMClient.  Returns a promise that resolves with the RTM send
 * result, or null if there was no message sent.  Remember to handle rejected promises!
 * 
 * @param {string} message - message the bot received
 * @param {RTMClient} rtmClient - Slack RTMClient through which to reply
 * @return {Promise<RTMCallResult | null>} promise that resolves when done replying
 */
async function replyMessage(message, rtmClient) {
    if (!message.text) {
        return null;
    }
    const handler = MESSAGE_HANDLERS[message.text.toLowerCase()];
    if (typeof handler === "string") {
        return await rtmClient.sendMessage(handler, message.channel);
    } else if (typeof handler === "function") {
        const reply = await handler();
        return await rtmClient.sendMessage(reply, message.channel);
    } else if (message.channel.startsWith("D")) { // Direct message
        return await rtmClient.sendMessage("I don't understand.  For a list of commands, type 'help'.", message.channel);
    } else { // Not a message the bot understands, but also in a channel.  Send nothing.
        return null;
    }
}

module.exports = {
    replyMessage: replyMessage
};
