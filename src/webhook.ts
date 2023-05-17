import { Request, Response } from "express"
import { publicKeys } from "./constants"
import nacl from "tweetnacl"

export interface WebhookData {
    0: {
        type: "tip",
        from: string,
        to: string,
        message: string,
        channel: string,
        guild: string,
        raw_amount: string,
        amount: string,
        token: {
            id: string,
            ticker: string,
            decimals: number,
            name: string,
            prices: {
                usd?: string,
                vite?: string,
                btc?: string,
                eth?: string
            }
        },
        recipients: string[]
    }
}

export function makeWebhookMiddleware<version extends keyof WebhookData>(handler: (data:WebhookData[version]) => void, publicKey: string = publicKeys.VitaBot):(req: Request, res: Response) => void{
    return async (req:Request, res:Response) => {
        try{
            if(req.header("Content-Type") !== "application/json")return res.status(400).send({
                error: {
                    name: "InvalidContentType",
                    message: "Content-Type must be application/json"
                }
            })
            const signed = await new Promise<Buffer>((resolve, reject) => {
                const buffers = []
                req.on("data", chunk => {
                    buffers.push(chunk)
                })
                req.on("end", () => {
                    resolve(Buffer.concat(buffers))
                })
                req.on("error", reject)
            })
        
            const body = nacl.sign.open(signed, Buffer.from(publicKey, "hex"))
            if(!body)return res.status(400).send({
                error: {
                    name: "InvalidSignature",
                    message: "Invalid signature"
                }
            })

            const json:WebhookData[version] = JSON.parse(Buffer.from(body).toString("utf8"))
            if(!json || typeof json !== "object")return res.status(400).send({
                error: {
                    name: "InvalidBody",
                    message: "Invalid body"
                }
            })

            res.status(200).send({
                success: true
            })
            try{
                handler(json)
            }catch(err){
                process.emit("uncaughtException", err)
            }
        }catch(err){
            return res.status(500).send({
                error: {
                    name: "InternalError",
                    message: "Internal server error"
                }
            })
        }
    }
}