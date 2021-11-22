import {handler as onRequestHandler} from "./ViewerRequest"
import {handler as onResponseHandler} from "./ViewerResponse"

import {CloudFrontRequestEvent, CloudFrontResponse, } from "aws-lambda";
import {CloudFrontResultResponse} from "aws-lambda/common/cloudfront";

export {setIntegrationDetails} from "./ViewerRequest"

export async function onClientRequest(event: CloudFrontRequestEvent): Promise<CloudFrontResultResponse>{
    return await onRequestHandler(event)
}

export async function onClientResponse(event: CloudFrontRequestEvent): Promise<CloudFrontResponse>{
    return await onResponseHandler(event)
}