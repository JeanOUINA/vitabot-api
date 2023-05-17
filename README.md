# WebHooks
```js
import express from "express"
import { makeWebhookMiddleware } from "vitabot-api"

express()
.post(
    "/",
    makeWebhookMiddleware(data => {
        // save data.nonce somewhere
        // verify it hasn't been used before
        // if it has, return
        // this prevents replay attacks
        console.log(data)
        // do something with it
    })
).listen(1337)
```