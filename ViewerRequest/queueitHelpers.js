const CLOUDFRONT_SDK_VERSION = "1.2.10";

exports.addKUPlatformVersion = function (redirectQueueUrl) {
    return redirectQueueUrl + "&kupver=cloudfront-" + CLOUDFRONT_SDK_VERSION;
}