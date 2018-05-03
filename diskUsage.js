const disk = require('diskusage');
const bytes = require('bytes');

const MOUNT_POINTS_TO_CHECK = ["/bar", "/scratch"];

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

async function replyDiskUsage() {
    const diskUsages = await Promise.all(MOUNT_POINTS_TO_CHECK.map(getDiskUsage));
    const humanReadableUsages = diskUsages.map((usage, i) => {
        const usedBytes = usage.total - usage.available;
        const available = bytes.format(usage.available, {decimalPlaces: 1});
        const percent = Math.round(usedBytes / usage.total * 100);
        return `*${MOUNT_POINTS_TO_CHECK[i]}*: ${percent}% full, ${available} left`;
    });
    return "Current disk usage of servers I am tracking:\n" + humanReadableUsages.join('\n');
}

module.exports = {
    replyDiskUsage: replyDiskUsage
};
