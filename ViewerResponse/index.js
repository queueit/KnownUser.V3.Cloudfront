exports.handler = (event, context, callback) => {
    let response = event.Records[0].cf.response;
    const request = event.Records[0].cf.request;

    if (request.headers["queueit-response-set-cookie"]) {
        for (let customHeaderKeyValue of request.headers["queueit-response-set-cookie"]) {
            response.headers['set-cookie'] = response.headers['set-cookie'] || [];
            response.headers['set-cookie'].push({ key: "Set-Cookie", value: customHeaderKeyValue.value });
        }
    }
    callback(null, response);
};
