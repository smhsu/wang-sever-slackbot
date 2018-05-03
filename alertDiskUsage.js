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
