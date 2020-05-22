'use strict';
const CustomerId = "YOUR CUSTOMERID HERE";
const SecretKey = "YOUR SECRETE KEY HERE";
const APIKey = "YOUR API KEY HERE";

const querystringParser = require('querystring');
const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
const knownUser = QueueIT.KnownUserV3.SDK.KnownUser;
const httpContextProvider = require("./cloudFrontHttpContextProvider.js");
const helpers = require("./queueitHelpers.js");
const integrationConfigProvider = require("./integrationConfigProvider.js");

exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    try {
        return await handleRequest(request);
    }
    catch (e) {
        let errorText = e;
        if (e instanceof Error) {
            errorText = e.toString();
        }
        else if (typeof e == 'object') {
            errorText = JSON.stringify(e);
        }
        console.log("ERROR: Queue-it Connector" + errorText);
        return request;
    }
};

async function handleRequest(request) {
    helpers.configureKnownUserHashing();
    const response = {
        headers: {}
    };    
    let httpContext = httpContextProvider.getCloudFrontHttpContext(request, response);
    var queueitToken = querystringParser.parse(request.querystring)[knownUser.QueueITTokenKey];
    var requestUrl = httpContext.getHttpRequest().getAbsoluteUri();
    var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
    requestUrlWithoutToken = requestUrlWithoutToken.replace(new RegExp("[?]$"), "");
    var integrationConfig = await integrationConfigProvider.getConfig(CustomerId, APIKey);

    var validationResult = knownUser.validateRequestByIntegrationConfig(
        requestUrlWithoutToken, queueitToken, integrationConfig,
        CustomerId, SecretKey, httpContext);

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
            var headerName = validationResult.getAjaxQueueRedirectHeaderKey();
            // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
            response.headers[headerName] = [{ key: headerName, value: helpers.addKUPlatformVersion(validationResult.getAjaxRedirectUrl()) }];
            response.status = '200';
            response.statusDescription = 'OK';
            return response;

        }
        else {
            // Send the user to the queue - either because hash was missing or because is was invalid
            response.status = '302';
            response.statusDescription = 'Found';
            response.headers['location'] = [{
                key: 'Location',
                value: helpers.addKUPlatformVersion(validationResult.redirectUrl)
            }];
            return response;
        }
    }
    else {
        // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
        if (queueitToken && validationResult.actionType) {
            response.status = '302';
            response.statusDescription = 'Found';
            response.headers['location'] = [{
                key: 'Location',
                value: requestUrlWithoutToken
            }];
            return response;
        }
        else {
            return request;
        }
    }
}