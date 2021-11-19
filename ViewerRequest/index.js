'use strict';
const QUEUEIT_FAILED_HEADERNAME = "x-queueit-failed";
const QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME = 'x-queueit-connector';
const QUEUEIT_CONNECTOR_NAME = "cloudfront"

let CustomerId = "YOUR CUSTOMERID HERE";
let SecretKey = "YOUR SECRETE KEY HERE";
let APIKey = "YOUR API KEY HERE";

const querystringParser = require('querystring');
const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
const knownUser = QueueIT.KnownUser;
const httpContextProvider = require("./cloudFrontHttpContextProvider.js");
const helpers = require("./queueitHelpers.js");
const integrationConfigProvider = require("./integrationConfigProvider.js");

exports.setIntegrationDetails = (customerId, secretKey, apiKey) => {
    CustomerId = customerId;
    SecretKey = secretKey;
    APIKey = apiKey;
}

exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    try {
        return await handleRequest(request);
    } catch (e) {
        let errorText = getErrorText(e);
        setQueueItErrorHeaders(request, null);
        console.log("ERROR: Queue-it Connector " + errorText);
        return request;
    }
};

async function handleRequest(request) {
    helpers.configureKnownUserHashing(QueueIT.Utils);
    const response = {
        headers: {}
    };
    setQueueItHeaders(response);
    if (isIgnored(request)) {
        return request;
    }

    let httpContext = httpContextProvider.getCloudFrontHttpContext(request, response);
    var queueitToken = querystringParser.parse(request.querystring)[knownUser.QueueITTokenKey];
    var requestUrl = httpContext.getHttpRequest().getAbsoluteUri();
    var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
    requestUrlWithoutToken = requestUrlWithoutToken.replace(new RegExp("[?]$"), "");
    var integrationConfig = "";

    try {
        integrationConfig = await integrationConfigProvider.getConfig(CustomerId, APIKey);
    } catch (e) {
        let errorText = getErrorText(e);
        setQueueItErrorHeaders(request, response);
        console.log("ERROR: Downloading config " + errorText);
    }

    var validationResult = knownUser.validateRequestByIntegrationConfig(
        requestUrlWithoutToken, queueitToken, integrationConfig,
        CustomerId, SecretKey, httpContext);

    if (validationResult.doRedirect()) {
        // Adding no cache headers to prevent browsers to cache requests
        response.headers['cache-control'] = [
            {
                key: 'Cache-Control',
                value: 'no-cache, no-store, must-revalidate, max-age=0'
            }];
        response.headers['pragma'] = [
            {
                key: 'Pragma',
                value: 'no-cache'
            }];
        response.headers['expires'] = [
            {
                key: 'Expires',
                value: 'Fri, 01 Jan 1990 00:00:00 GMT'
            }];

        if (validationResult.isAjaxResult) {
            var headerName = validationResult.getAjaxQueueRedirectHeaderKey();
            // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
            response.headers[headerName] = [{
                key: headerName,
                value: helpers.addKUPlatformVersion(validationResult.getAjaxRedirectUrl())
            }];
            response.status = '200';
            response.statusDescription = 'OK';
            return response;

        } else {
            // Send the user to the queue - either because hash was missing or because is was invalid
            response.status = '302';
            response.statusDescription = 'Found';
            response.headers['location'] = [{
                key: 'Location',
                value: helpers.addKUPlatformVersion(validationResult.redirectUrl)
            }];
            return response;
        }
    } else {
        // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
        if (queueitToken && validationResult.actionType === "Queue") {
            response.status = '302';
            response.statusDescription = 'Found';
            response.headers['location'] = [{
                key: 'Location',
                value: requestUrlWithoutToken
            }];
            return response;
        } else {
            return request;
        }
    }
}

function setQueueItHeaders(response) {
    response.headers[QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME] = [
        {key: QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME, value: QUEUEIT_CONNECTOR_NAME}
    ];
}

function setQueueItErrorHeaders(request, response) {
    request.headers['queueit-response-error'] = [
        {key: 'queueit-response-error', value: 'true'}
    ];

    if (response) {
        response.headers[QUEUEIT_FAILED_HEADERNAME] = [
            {key: QUEUEIT_FAILED_HEADERNAME, value: 'true'}
        ];
    }
}

function isIgnored(request) {
    return request.method === 'OPTIONS'
        || request.method === 'HEAD';
}

function getErrorText(e) {
    let errorText = e;
    if (e instanceof Error) {
        errorText = e.toString();
    } else if (typeof e == 'object') {
        errorText = JSON.stringify(e);
    }
    return errorText;
}
