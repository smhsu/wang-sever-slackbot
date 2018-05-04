/**
 * Main entry point, and functions that assist in chatbot initialization.
 * 
 * @author Silas Hsu
 */
"use strict";

const { RTMClient, WebClient } = require("@slack/client");
const privateReplies = require("./privateReplies");
const { startDiskMonitor, getDiskCheckMessage } = require("./diskUsage");

const ALERT_CHANNEL_NAME = "server"; // Channel in which to post messages about excessive server disk usage

/**
 * Gets the slack ID of a channel's name.  Returns null if the channel does not exist.  Remember to catch errors!
 * 
 * @param {string} channelName - channel name for which to get ID
 * @return {Promise<string>} ID of the channel, or null if it doesn't exist
 */
async function getIdOfChannel(channelName) {
    const token = process.env.SLACK_TOKEN;
    const webClient = new WebClient(token);
    const response = await webClient.channels.list();
    const channels = response.channels;
    
    const alertChannel = channels.find(channel => channel.name === channelName);
    if (alertChannel) {
        return alertChannel.id;
    } else {
        return null;
    }
}

/**
 * Starts the chatbot.  Returns a promise that resolves when the bot is started, or rejects if there is a problem
 * starting the bot.  Errors that happen *after* the bot has started will be caught.
 * 
 * @return {Promise<void>} promise that resolves when the bot is started
 */
async function initBot() {
    const token = process.env.SLACK_TOKEN;
    const alertChannelId = await getIdOfChannel(ALERT_CHANNEL_NAME);
    if (alertChannelId) {
        console.log("[INFO] Found channel in which to post alerts");
    } else {
        console.warn("[WARN] Could not find channel in which to post alerts.  Disk monitoring will not happen.");
    }

    const rtm = new RTMClient(token);
    rtm.on("message", message => {
        if ( // Skip messages that are from a bot or my own user ID
            (message.subtype && message.subtype === "bot_message") ||
            (!message.subtype && message.user === rtm.activeUserId)
        ) {
            return;
        }

        if (message.channel === alertChannelId) {
            // TODO
        } else {
            privateReplies.replyMessage(message, rtm)
                .catch(console.error);
        }
    });

    if (alertChannelId) {
        await startDiskMonitor(rtm, alertChannelId);
        console.log("[INFO] Disk monitoring started");
    }
    rtm.start();
}

/**
 * Main entry point.  Starts the chatbot and sets process event handlers.
 */
async function main() {
    try {
        await initBot();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

    process.on("SIGINT", () => process.exit(0));
    //process.on("unhandledRejection", console.error);
    console.log("[INFO] Bot started");
}

if (require.main === module) { // Called directly
    main();
} // else required as a module
