'use strict';

const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
const integrationConfig = require("./integrationConfig.js");
const httpContextProvider = require("./cloudFrontHttpContextProvider.js");
const querystringParser = require('querystring');
const knownUser = QueueIT.KnownUserV3.SDK.KnownUser;
const CLOUDFRONT_SDK_VERSION ="1.0.0";

function configureKnownUserHashing() {
    var utils = QueueIT.KnownUserV3.SDK.Utils;
    utils.generateSHA256Hash = function (secretKey, stringToHash) {
        const crypto = require('crypto');
        const hash = crypto.createHmac('sha256', secretKey)
            .update(stringToHash)
            .digest('hex');
        return hash;
    };
}
exports.handler = (event, context, callback) => {
    try {
        configureKnownUserHashing();
        const request = event.Records[0].cf.request;
        const response = {
            headers: {}
        };
        let customerId = "YOUR CUSTOMERID";
        let secretKey = "YOUR SECRET KEY";
        let httpContext = httpContextProvider.getCloudFrontHttpContext(request, response);
        var queueitToken = querystringParser.parse(request.querystring)[knownUser.QueueITTokenKey];
        var requestUrl = httpContext.getHttpRequest().getAbsoluteUri();
        var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
        requestUrlWithoutToken = requestUrlWithoutToken.replace(new RegExp("[?]$"), "");


        var validationResult = knownUser.validateRequestByIntegrationConfig(
            requestUrlWithoutToken, queueitToken, integrationConfig,
            customerId, secretKey, httpContext);

        if (validationResult.doRedirect()) {
            // Adding no cache headers to prevent browsers to cache requests
            response.headers['cache-control'] = [
                {
                    key: 'Cache-Control',
                    value: 'no-cache, no-store, must-revalidate'
                }];
            response.headers['pragma'] = [
                {
                    key: 'Pragma',
                    value: 'no-cache'
                }];
            response.headers['pragma'] = [
                {
                    key: 'Pragma',
                    value: 'no-cache, no-store, must-revalidate'
                }];
            response.headers['expires'] = [
                {
                    key: 'Expires',
                    value: 'Fri, 01 Jan 1990 00:00:00 GMT'
                }];

            if (validationResult.isAjaxResult) {
                var headerName =  validationResult.getAjaxQueueRedirectHeaderKey();
                // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
                response.headers[headerName] = [{ key: headerName, value: validationResult.getAjaxRedirectUrl() + QueueIT.KnownUserV3.SDK.Utils.encodeUrl('&cloudfrontsdkver=' + CLOUDFRONT_SDK_VERSION) }];
                response.status = '200';
                response.statusDescription = 'OK';
                callback(null, response);

            }
            else {
                // Send the user to the queue - either because hash was missing or because is was invalid
                response.status = '302';
                response.statusDescription = 'Found';
                response.headers['location']= [{
                    key: 'Location',
                    value: validationResult.redirectUrl + QueueIT.KnownUserV3.SDK.Utils.encodeUrl('&cloudfrontsdkver=' + CLOUDFRONT_SDK_VERSION)
                }];
                callback(null, response);
            }
        }
        else {
            // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
            if (queueitToken && validationResult.actionType) {
                response.status = '302';
                response.statusDescription = 'Found';
                response.headers['location']=[{
                    key: 'Location',
                    value: requestUrlWithoutToken
                }];
                callback(null, response);
            }
            else {
                callback(null, request);
            }
        }
    }

    catch (e) {
        // There was an error validationg the request
        // Use your own logging framework to log the Exception
        // This was a configuration exception, so we let the user continue
        console.log("ERROR:" + e);
    }
};

