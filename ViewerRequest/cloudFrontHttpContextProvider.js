exports.getCloudFrontHttpContext = function (request, response) {
    return {
        getCryptoProvider: function() {
            // Code to configure hashing in KnownUser SDK (requires node module 'crypto'):
            return {
                getSha256Hash: function(secretKey, plaintext) {
                    return require('crypto')
                        .createHmac('sha256', secretKey)
                        .update(plaintext)
                        .digest('hex');
                }
            };
        },
        getHttpRequest: function () {
            return {
                decodedBody: null,
                parsedCookieDic: null,
                getUserAgent: function () {
                    return this.getHeader("user-agent");
                },
                getHeader: function (headerNameArg) {
                    headerNameArg = (headerNameArg + "").toLowerCase();
                    for (let header in request.headers) {
                        if (header.toLowerCase() === headerNameArg && request.headers[header].length >= 1) {
                            return request.headers[header][0].value;
                        }
                    }
                    return "";
                },
                getAbsoluteUri: function () {
                    let url = `https://${request.headers.host[0].value}${request.uri}`;
                    if (request.querystring) {
                        url += `?${request.querystring}`;
                    }
                    return url;
                },
                getUserHostAddress: function () {
                    return request.clientIp;
                },
                getCookieValue: function (cookieKey) {
                    if (!this.parsedCookieDic) {
                        this.parsedCookieDic = __parseCookies(request.headers);
                    }
                    var cookieValue = this.parsedCookieDic[cookieKey];

                    if (cookieValue) return decodeURIComponent(cookieValue);

                    return cookieValue;
                },
                getRequestBodyAsString: function () {
                    if (!this.decodedBody) {
                        this.decodedBody = __decodeBody(request);
                    }

                    return this.decodedBody;
                },
            };
        },
        getHttpResponse: function () {
            return {
                setCookie: function (cookieName, cookieValue, domain, expiration, httpOnly, isSecure, sameSiteValue) {
                    // expiration is in secs, but Date needs it in milisecs
                    let expirationDate = new Date(expiration * 1000);

                    let setCookieString = `${cookieName}=${encodeURIComponent(
                        cookieValue
                    )}; expires=${expirationDate.toGMTString()};`;
                    if (domain) {
                        setCookieString += ` domain=${domain};`;
                    }

                    if (httpOnly) {
                        setCookieString += " HttpOnly;"
                    }

                    if (isSecure) {
                        setCookieString += " Secure;"
                    }

                    if (sameSiteValue) {
                        setCookieString += ` SameSite=${sameSiteValue};`;
                    }

                    setCookieString += " path=/";
                    const setCookieHeader = 'set-cookie';
                    const responseSetCookieHeader = 'queueit-response-set-cookie';
                    //adding cookie header to response in case response generated from request without sending request to origin
                    response.headers[setCookieHeader] = response.headers[setCookieHeader] || [];
                    response.headers[setCookieHeader].push({key: "Set-Cookie", value: setCookieString});

                    //adding cookies as custom header to request to be used on the way back will be set in the response
                    request.headers[responseSetCookieHeader] = request.headers[responseSetCookieHeader] || [];
                    request.headers[responseSetCookieHeader].push({
                        key: responseSetCookieHeader,
                        value: setCookieString
                    });
                }
            }
        }
    };
}

function __decodeBody(request) {
    if (!request || !request.body || !request.body.data) {
        return "";
    }

    const bodyData = request.body.data;

    if (request.body.encoding !== "base64") {
        return bodyData;
    }

    return Buffer.from(request.body.data, "base64").toString();
}

function __parseCookies(headers) {
    var parsedCookie = {};
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            headers.cookie[i].value.split(";").forEach(function (cookie) {
                if (cookie) {
                    var parts = cookie.split("=");
                    if (parts.length >= 2)
                        parsedCookie[parts[0].trim()] = parts[1].trim();
                }
            });
        }
    }
    return parsedCookie;
}