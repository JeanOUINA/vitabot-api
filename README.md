# Client
```js
import { Client } from "vitabot-api"

const client = new Client("Your api key from vitamin.tips")

const token1 = await client.getToken("VITC")
const token2 = await client.getToken("VITC-000")
const token3 = await client.getToken("BAN-001")

const amount1 = await client.parseAmount("1 vitc")
const amount2 = await client.parseAmount("$10 vitc")
const amount3 = await client.parseAmount("129k VITE")

// Bank API
const addresses = await client.getAddresses()
const balances = await client.getBalances()
const balance1 = await client.getBalance(index)
const balance1 = await client.getBalance("vite_xxxxxx")
const address = await client.newAddress()
const transaction = await client.sendTransaction({
    from: addresses[0].address,
    to: address.address,
    amount: amount1.amount,
    token_id: amount1.token_id
})
```

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