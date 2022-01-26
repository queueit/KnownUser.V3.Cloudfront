# KnownUser.V3.Cloudfront
Before getting started please read the [documentation](https://github.com/queueit/Documentation/tree/main/edge-connectors) to get acquainted with edge connectors.

This repository contains two AWS lambda functions you can add to your CloudFront distribution events ViewerRequest and ViewerResponse 
to integrate queue-it functionality into your backend.

## Installation

- Download the ViewerRequest and ViewerResponse zip files from the latest release.

- Set your CustomerId, SecretKey and API key in `index.js` file in ViewerRequest folder.

- Create two lambda edge functions, one for ViewerRequest and one for ViewerResponse and put the code from this
  repository there respectively.

Viewer Request example:  
![ViewerRequestStructure](https://github.com/queueit/KnownUser.V3.Cloudfront/blob/master/ViewerRequestStructure.png)

Viewer Response example:  
![ViewerRequestStructure](https://github.com/queueit/KnownUser.V3.Cloudfront/blob/master/ViewerResponseStructure.png)

- Define your desired CloudFront behaviours where you want to be protected by queue and set CloudFront events
  ViewerRequest and ViewerResponse to point to the two functions you just created.

** Please make sure the code is living in the highest level in our lambda definition as it shown here.

### Using the NPM package

Install `@queue-it/cloudfront` [![npm version](https://badge.fury.io/js/@queue-it%2Fcloudfront.svg)](https://badge.fury.io/js/@queue-it%2Fcloudfront) and use it like this:

- In your *Viewer request* lambda you need to add this.

```js
import {onClientRequest, setIntegrationDetails} from "@queue-it/cloudfront";

setIntegrationDetails("YOUR CUSTOMERID HERE", "YOUR SECRET KEY HERE", "YOUR API KEY HERE")

// Place this in the place where you handle the incoming cloudfront events.

const queueItResponse = await onClientRequest(cloudfrontEvent);
// We got a valid response, return it to the user.
if (queueItResponse.status) {
    return queueItResponse;
}
```

- In your *Viewer response* lambda you need to add this.

```js
import {onClientResponse} from "../";

// Place this in the place where you handle the incoming cloudfront events.

const response = await onClientResponse(cloudfrontEvent);
return response;
```

### Request body trigger (advanced)

The connector supports triggering on request body content. An example could be a POST call with specific item ID where
you want end-users to queue up for. For this to work, you will need to contact queue-it support, so it can be enabled on
your GO Queue-it platform account.  
Once enabled, you will need to check the `Include body` checkbox in the `Viewer request` function associations. This can
be done by editing your CloudFront distribution behaviors.
![Function associations](https://github.com/queueit/KnownUser.V3.Cloudfront/blob/master/FunctionAssociations.png)