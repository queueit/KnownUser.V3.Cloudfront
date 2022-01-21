﻿# KnownUser.V3.Cloudfront
[![npm version](https://badge.fury.io/js/@queue-it%2Fcloudfront.svg)](https://badge.fury.io/js/@queue-it%2Fcloudfront)

The Queue-it Security Framework is used to ensure that end users cannot reach to your protected backend routes without
passing the virtual queue by performing a server-side validation before processing a request. This repository is
containing two AWS lambda functions you can add them in your CloudFront distribution for CloudFront Events ViewerRequest
and ViewerResponse to integrate queue-it functionality for your backend.

## Introduction

When a user makes a request to your backend Cloudfront will trigger the script in ViewerRequest function and that script
validates the request and if it was needed it will redirect the user to the queue. After waiting in the queue, the queue
engine will redirect the user back to your end attaching a query string parameter (`queueittoken`) containing some
information about the user to the URL. The most important fields of the `queueittoken` are:

- q - the users' unique queue identifier
- ts - a timestamp of how long this redirect is valid
- h - a hash of the token

After returning from the queue, the script will let user continue its request to your backend and will add a cookie to
the user browser (the code in ViewerResponse will do that) containing a valid queue session and since then all the
requests of that specific user will pass the validation from ViewerRequest function without going to the queue since it
has a valid queue session cookie.

### Request body trigger (advanced)

The connector supports triggering on request body content. An example could be a POST call with specific item ID where
you want end-users to queue up for. For this to work, you will need to contact queue-it support, so it can be enabled on
your GO Queue-it platform account.  
Once enabled, you will need to check the `Include body` checkbox in the `Viewer request` function associations. This can
be done by editing your CloudFront distribution behaviors.
![Function associations](https://github.com/queueit/KnownUser.V3.Cloudfront/blob/master/FunctionAssociations.png)

## Instruction

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

Install `@queue-it/cloudfront` and use it like this:

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

### Protecting AJAX calls

If you need to protect AJAX calls beside page loads you need to add the below JavaScript tags to your pages:

```html

<script
        type="text/javascript"
        src="//static.queue-it.net/script/queueclient.min.js"
></script>
<script
        data-queueit-intercept-domain="{YOUR_CURRENT_DOMAIN}"
        data-queueit-intercept="true"
        data-queueit-c="{YOUR_CUSTOMER_ID}"
        type="text/javascript"
        src="//static.queue-it.net/script/queueconfigloader.min.js"
></script>
```

> Please contact [queue-it support](https://support.queue-it.com/hc/en-us) for further information and intruction.

