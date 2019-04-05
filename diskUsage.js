/**
 * Utilities that get and process disk usage.
 * 
 * @author Silas Hsu
 */
"use strict";

const disk = require('diskusage');
const bytes = require('bytes');
const schedule = require('node-schedule');

const MOUNT_POINTS_TO_CHECK = ["/bar", "/scratch", "/tavern", "/saloon"];
const USE_WARNING_THRESHOLD = 85; // Percent
const DISK_CHECK_SCHEDULE = new schedule.RecurrenceRule();
DISK_CHECK_SCHEDULE.dayOfWeek = new schedule.Range(1, 5); // Weekdays
DISK_CHECK_SCHEDULE.hour = 12; // Noon
DISK_CHECK_SCHEDULE.minute = 0; // On the hour

/**
 * Gets disk usage info of each configured file system.  For return schema, see
 * https://github.com/jduncanator/node-diskusage
 * 
 * @return {Promise<DiskUsage[]>} objects with disk usage info
 */
function getDiskUsages() {
    const promises = MOUNT_POINTS_TO_CHECK.map(mountPoint => 
        new Promise((resolve, reject) => {
            disk.check(mountPoint, function(error, info) {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        })
    );
    return Promise.all(promises);
}

/**
 * Gets the effective percentage of space used from a DiskUsage object
 * 
 * @param {DiskUsage} diskInfo - object with disk usage info
 * @return {number} effective percentage of space used
 */
function getUsePercent(diskInfo) {
    const used = diskInfo.total - diskInfo.available;
    return used / diskInfo.total * 100;
}

/**
 * Generates a Slack message that states disk usage.
 * 
 * @param {DiskUsage} diskInfo - object with disk usage info
 * @param {string} mountPoint - mount point from which the disk usage info came
 * @return {string} Slack-readable string that states disk usage
 */
function formatDiskUsage(diskInfo, mountPoint) {
    const percent = Math.round(getUsePercent(diskInfo));
    const available = bytes.format(diskInfo.available, {decimalPlaces: 1});
    return `*${mountPoint}*: ${percent}% full, ${available} left`;
}

/**
 * @return {Promise<string>} promise for a Slack message containing stats of all configured file systems
 */
async function getDiskUsageMessage() {
    const diskInfos = await getDiskUsages();
    const humanReadableUsages = diskInfos.map((diskInfo, i) =>
        formatDiskUsage(diskInfo, MOUNT_POINTS_TO_CHECK[i])
    );
    return "Current disk usage of file systems I am tracking:\n" + humanReadableUsages.join('\n');
}

/**
 * Checks all configured file systems for problems, such as being near capacity.  Returns a promise for a Slack message
 * containing any warnings, or an empty string if there are no warnings.
 * 
 * @return {Promise<string>} promise for a Slack message containing warnings for all configured file systems
 */
async function getDiskCheckMessage() {
    const diskInfos = await getDiskUsages();
    let warnings = [];
    diskInfos.forEach((diskInfo, i) => {
        if (getUsePercent(diskInfo) > USE_WARNING_THRESHOLD) {
            warnings.push(formatDiskUsage(diskInfo, MOUNT_POINTS_TO_CHECK[i]));
        }
    });

    if (warnings.length > 0) {
        return "One or more file systems that I am monitoring are almost full 😱!\n" +
                warnings.join('\n') + "\n" +
                "People, please clean up your files!\n" +
                "_Bleep boop, I am a bot.  Contact Silas Hsu for maintenance issues._"
    } else {
        return "";
    }
}

/**
 * Starts checking configured file systems for problems periodically, and sends a message to a Slack channel if there
 * are any problems.
 * 
 * This function returns a promise for the scheduled job, or a rejected promise if there is a issue starting the job.
 * If the job itself errors, it will be caught and logged to the console, and periodic checks will continue.
 * 
 * @param {RTMClient} rtmClient - Slack RTMClient through which to reply
 * @param {string} notifyChannelId - channel ID to which to send messages
 * @return {Promise<Job>} promise for the scheduled job
 */
async function startDiskMonitor(rtmClient, notifyChannelId) {
    if (!notifyChannelId) {
        return null;
    }
    await getDiskUsages(); // Check if mount points are intact.  Ignore return value.
    const job = schedule.scheduleJob(DISK_CHECK_SCHEDULE, async fireDate => {
        try {
            const warning = await getDiskCheckMessage();
            if (warning) {
                rtmClient.sendMessage(warning, notifyChannelId);
            }
        } catch (error) {
            console.error(error);
        }
    });
    return job;
}

module.exports = {
    getDiskUsageMessage: getDiskUsageMessage,
    getDiskCheckMessage: getDiskCheckMessage,
    startDiskMonitor: startDiskMonitor,
};
