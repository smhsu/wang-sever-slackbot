const disk = require('diskusage');
const bytes = require('bytes');
const schedule = require('node-schedule');

const MOUNT_POINTS_TO_CHECK = ["/bar", "/scratch"];
const USE_WARNING_THRESHOLD = 80; // Percent

function getDiskUsage(mountPoint) {
    return new Promise((resolve, reject) => {
        disk.check(mountPoint, function(error, info) {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
}

function getUsePercent(diskInfo) {
    const used = diskInfo.total - diskInfo.available;
    return used / diskInfo.total * 100;
}

function formatDiskUsage(diskInfo, mountPoint) {
    const percent = Math.round(getUsePercent(diskInfo));
    const available = bytes.format(diskInfo.available, {decimalPlaces: 1});
    return `*${mountPoint}*: ${percent}% full, ${available} left`;
}

async function getDiskUsageMessage() {
    const diskInfos = await Promise.all(MOUNT_POINTS_TO_CHECK.map(getDiskUsage));
    const humanReadableUsages = diskInfos.map((diskInfo, i) =>
        formatDiskUsage(diskInfo, MOUNT_POINTS_TO_CHECK[i])
    );
    return "Current disk usage of file systems I am tracking:\n" + humanReadableUsages.join('\n');
}

async function getDiskCheckMessage() {
    const diskInfos = await Promise.all(MOUNT_POINTS_TO_CHECK.map(getDiskUsage));
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

function startDiskMonitor(rtmClient, notifyChannelId) {
    if (!notifyChannelId) {
        return null;
    }

    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = new schedule.Range(1, 5); // Weekdays
    rule.hour = 12; // Noon
    rule.minute = 0; // On the hour
    const job = schedule.scheduleJob(rule, async fireDate => {
        const warning = await getDiskCheckMessage();
        if (warning) {
            console.log("[INFO] sending disk use warning");
            rtmClient.sendMessage(warning, notifyChannelId);
        }
    });
    return job;
}

module.exports = {
    getDiskUsageMessage: getDiskUsageMessage,
    getDiskCheckMessage: getDiskCheckMessage,
    startDiskMonitor: startDiskMonitor,
};
