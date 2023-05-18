import fetch from "node-fetch"

export class Client {
    private key:string
    BASE_URL = "https://vitamin.tips/api"
    constructor(key:string){
        if(!/^[abcdef\d]{64}$/.test(key))throw new ClientError("Invalid API key")
        this.key = key
    }

    async request(path: string, method: "POST"|"GET" = "GET", body?:any){
        const res = await fetch(`${this.BASE_URL}${path}`, {
            method: method,
            headers: {
                Authorization: this.key,
                ...(body ? {
                    "Content-Type": "application/json"
                } : {})
            },
            body: body ? JSON.stringify(body) : null
        })
        if(res.status !== 200){
            const data = await res.text()
            let error
            try{
                const json = JSON.parse(data)
                error = new Error(json.error.message)
                error.name = json.error.name
            }catch{
                error = new ClientError(`${res.status} ${res.statusText}: Invalid server response`)
            }
            throw error
        }

        const json = await res.json()
        return json
    }

    async getDiscordUserAddress(user_id:string):Promise<string>{
        const address = await this.request(`/address/discord/${user_id}`)
        return address.address
    }

    async getToken(ticker:string):Promise<Token>{
        const token = await this.request(`/vite/get_token`, "POST", {
            ticker
        })
        return token
    }

    async parseAmount(amount:string):Promise<Amount>{
        const parsed = await this.request(`/vite/parse_amount`, "POST", {
            amount
        })
        return parsed
    }

    async getAddresses():Promise<Address[]>{
        const addresses = await this.request("/bank/addresses")

        return addresses.map((address, i) => {
            return {
                address: address,
                index: i
            }
        })
    }

    async getBalances():Promise<(Address & {
        balances: Balances
    })[]>{
        const balances = await this.request("/bank/balances")
        return balances
    }

    async getBalance(address:string):Promise<Balances>
    async getBalance(index:number):Promise<Balances>
    async getBalance(selector:string|number):Promise<Balances>{
        const balances = await this.request(`/bank/balances/${selector}`)
        return balances
    }

    async newAddress():Promise<Address>{
        const address = await this.request("/bank/addresses/new", "POST")
        return address
    }

    async sendTransaction(transaction:TransactionRequest):Promise<Transaction>{
        const tx = await this.request(`/bank/send/${transaction.from}`, "POST", {
            to: transaction.to,
            tokenId: transaction.token_id,
            amount: transaction.amount,
            data: transaction.data?.toString("hex") || undefined
        })
        return tx
    }
}

export class ClientError extends Error {
    name = "ClientError"
}

export interface Token {
    decimals: number,
    token_id: string,
    name: string,
    currency: string
}
export interface Amount extends Token {
    amount: string,
    amount_display: string
}

export interface Balances {
    [tokenId: string]: string
}

export interface Address {
    address: string,
    index: number
}

export interface TransactionRequest {
    from: string|number,
    to: string,
    amount: string,
    token_id: string,
    data?: Buffer
}

export interface Transaction {
    type: "send"|"receive",
    from: string,
    to: string,
    hash: string,
    amount: string,
    token_id: string,
    sender_handle: string,
    data: string
}