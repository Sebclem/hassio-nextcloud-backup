
// Found on Stackoverflow, perfect code :D https://stackoverflow.com/a/14919494/8654475
function humanFileSize(bytes, si=false, dp=1) {
    const thresh = si ? 1000 : 1024;
    
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    
    const units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;
    
    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
    
    
    return bytes.toFixed(dp) + ' ' + units[u];
}

exports.humanFileSize = humanFileSize