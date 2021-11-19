const CLOUDFRONT_SDK_VERSION ="1.2.7";

exports.addKUPlatformVersion= function(redirectQueueUrl)
{
    return redirectQueueUrl + "&kupver=cloudfront-" + CLOUDFRONT_SDK_VERSION;
}

exports.configureKnownUserHashing= function(utils) {
    utils.generateSHA256Hash = function (secretKey, stringToHash) {
        const crypto = require('crypto');
        const hash = crypto.createHmac('sha256', secretKey)
            .update(stringToHash)
            .digest('hex');
        return hash;
    };
}
