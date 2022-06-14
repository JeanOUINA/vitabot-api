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
            amount: transaction.amount
        })
        return tx
    }
}

export class ClientError extends Error {
    name = "ClientError"
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
    token_id: string
}

export interface Transaction {
    type: "send"|"receive",
    from: string,
    to: string,
    hash: string,
    amount: string,
    token_id: string,
    sender_handle: string
}