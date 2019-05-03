exports.getCloudFrontHttpContext = function (request, response) {
    return {
        getHttpRequest: function () {
            var httpRequest = {
                getUserAgent: function () {
                    return this.getHeader("user-agent");
                },
                getHeader: function (headerNameArg) {
                    headerNameArg = (headerNameArg + "").toLowerCase();
                    for (var header in request.headers) {
                        if (header.toLowerCase() === headerNameArg) {
                            if (request.headers[header].length >= 1) {
                                return request.headers[header][0].value;
                            }
                        }
                    }
                    return "";
                },
                getAbsoluteUri: function () {
                    return `https://${request.headers.host[0].value}${request.uri}?${request.querystring}`;
                },
                getUserHostAddress: function () {
                    return request.clientIp;
                },
                getCookieValue: function (cookieKey) {
                    if (!this.parsedCookieDic) {
                        this.parsedCookieDic = __parseCookies(request.headers);
                    }
                    return decodeURIComponent(this.parsedCookieDic[cookieKey]);
                }
            };
            return httpRequest;
        },
        getHttpResponse: function () {
            var httpResponse = {
                setCookie: function (cookieName, cookieValue, domain, expiration) {

                    // expiration is in secs, but Date needs it in milisecs
                    let expirationDate = new Date(expiration * 1000);

                    var setCookieString = `${cookieName}=${encodeURIComponent(cookieValue)}; expires=${expirationDate.toGMTString()};`;
                    if (domain) {
                        setCookieString += ` domain=${domain};`;
                    }
                    setCookieString += " path=/";

                    //adding cookie header to response in case response generated from request without sending request to origin
                    response.headers['set-cookie'] = response.headers['set-cookie'] || [];
                    response.headers['set-cookie'].push({ key: "Set-Cookie", value: setCookieString });

                    //adding cookies as custom header to request to be used on the way back will be set in the response 
                    request.headers['queueit-response-set-cookie'] = request.headers['queueit-response-set-cookie'] || [];
                    request.headers['queueit-response-set-cookie'].push({ key: "queueit-response-set-cookie", value: setCookieString });

                }
            };
            return httpResponse;
        }
    };
};

function __parseCookies(headers) {
    var parsedCookie = {};
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            headers.cookie[i].value.split(';').forEach(function (cookie) {
                if (cookie) {
                    var parts = cookie.split('=');
                    if (parts.length >= 2)
                        parsedCookie[parts[0].trim()] = parts[1].trim();
                }
            });
        }
    }
    return parsedCookie;
}
