
const https = require("https");

const CacheTimeoutMS = 5 * 60 * 1000;
const RequestTimeoutMS = 1000;
let GlobalCache = null;

exports.getConfig = async function (customerId, apiKey) {
    return new Promise((resolve, reject) => {
        if (isGLobalCacheValid()) {
            resolve(GlobalCache.integrationConfig);
            return;
        }
        const options = {
            hostname: `${customerId}.test.queue-it.net`,
            path: `/status/integrationconfig/secure/${customerId}`,
            method: 'GET',
            headers: { 'api-key': apiKey},
            port: 443
};
        let request = https.get(options, (resp) => {
            let data = '';
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (resp.statusCode == 200) {
                        var newCached = {
                            expirationTime:  (Date.now()) + CacheTimeoutMS,
                            integrationConfig: data
                        };
                        GlobalCache = newCached;
                        resolve(GlobalCache.integrationConfig);
                }
                else {
                    reject(new Error(data));
                }
            });
        });
        request.on('error', (error) => reject(error));
        request.setTimeout(RequestTimeoutMS,
            () => {
                let timeoutMessage = `Timeout: It took more than ${RequestTimeoutMS} to retrieve Integrationconfig.`;
                if (GlobalCache) {
                    console.log(timeoutMessage + ' (using old config)');
                    resolve(GlobalCache.integrationConfig);
                }
                else
                {
                    reject(new Error(timeoutMessage));
                }
            }
        );
    });
};

function isGLobalCacheValid() {
    return GlobalCache &&
        (GlobalCache.expirationTime.valueOf() > Date.now());
}
