const CLOUDFRONT_SDK_VERSION ="1.2.5";
const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
exports.addKUPlatformVersion= function(redirectQueueUrl)
{
    return redirectQueueUrl + "&kupver=cloudfront-" + CLOUDFRONT_SDK_VERSION;
}
exports.configureKnownUserHashing= function() {
    var utils = QueueIT.KnownUserV3.SDK.Utils;
    utils.generateSHA256Hash = function (secretKey, stringToHash) {
        const crypto = require('crypto');
        const hash = crypto.createHmac('sha256', secretKey)
            .update(stringToHash)
            .digest('hex');
        return hash;
    };
}
