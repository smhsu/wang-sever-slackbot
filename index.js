const disk = require('diskusage');
const bytes = require('bytes');

disk.check('/', function(err, info) {
    if (err) {
        console.log(err);
    } else {
        console.log(bytes.format(info.available));
        console.log(bytes.format(info.free));
        console.log(bytes.format(info.total));
    }
});
