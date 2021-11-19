const QUEUEIT_FAILED_HEADERNAME = "x-queueit-failed";
const QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME = 'x-queueit-connector';
const QUEUEIT_CONNECTOR_NAME = "cloudfront"

exports.handler = async (event, context) => {
    const response = event.Records[0].cf.response;
    const request = event.Records[0].cf.request;

    if (request.headers["queueit-response-set-cookie"]) {
        for (let customHeaderKeyValue of request.headers["queueit-response-set-cookie"]) {
            response.headers['set-cookie'] = response.headers['set-cookie'] || [];
            response.headers['set-cookie'].push({ key: "Set-Cookie", value: customHeaderKeyValue.value });
        }
    }

    if(request.headers["queueit-response-error"]){
        response.headers[QUEUEIT_FAILED_HEADERNAME] = [
            {key: QUEUEIT_FAILED_HEADERNAME, value: 'true'}
        ];
    }

    response.headers[QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME] = [
        {key: QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME, value: QUEUEIT_CONNECTOR_NAME}
    ];

    return response
};
