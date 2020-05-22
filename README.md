# KnownUser.V3.Cloudfront
The Queue-it Security Framework is used to ensure that end users cannot reach to your protected backend routes without passing the virtual queue by performing a server-side validation before processing a request. This repository is containing two AWS lambda functions you can add them in your CloudFront distribution for CloudFront Events ViewerRequest and ViewerResponse to integrate queue-it functionality for your backend.

## Introduction
When a user makes a request to your backend Cloudfront will trigger the script in ViewerRequest function and that script validates the request and if it was needed it will redirect the user to the queue. After waiting in the queue, the queue engine will redirect the user back to your end attaching a query string parameter (`queueittoken`) containing some information about the user to the URL.
The most important fields of the `queueittoken` are:

- q - the users' unique queue identifier
- ts - a timestamp of how long this redirect is valid
- h - a hash of the token

After returning  from the queue, the script will let user continue its request to your backend and will add a cookie to the user browser (the code in ViewerResponse will do that) containing a valid queue session and since then all the requests of that specific user will pass the validation from ViewerRequest function without going to the queue since it has a valid queue session cookie.

## Instruction

- Set your CustomerId, SecretKey and API key in `index.js` file in ViewerRequest package
- Create two lambda edge functions one for ViewerRequest and one for ViewerResponse and put the code from this repository there respectively. 
- Define your desired behaviours where you want to be protected by queue and set CloudFront events  ViewerRequest and ViewerResponse to function you have already created.

### Protecting AJAX calls
If you need to protect AJAX calls beside page loads you need to add the below JavaScript tags to your pages:
```
<script type="text/javascript" src="//static.queue-it.net/script/queueclient.min.js"></script>
<script
 data-queueit-intercept-domain="{YOUR_CURRENT_DOMAIN}"
   data-queueit-intercept="true"
  data-queueit-c="{YOUR_CUSTOMER_ID}"
  type="text/javascript"
  src="//static.queue-it.net/script/queueconfigloader.min.js">
</script>
```

>Please contact [queue-it support](https://support.queue-it.com/hc/en-us) for further information and intruction.
