import * as crypto from 'crypto';
import { devNull } from 'os';

class Transaction {
    constructor(
        public amount: number,
        public payer: string, //public key
        public payee: string, //public key
    ) {}

    toString(): string {
        return JSON.stringify(this);
    }
}

class Block { //container to multiple transaction

    public nonce = Math.round(Math.random() * 99999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction, 
        public dateTransaction = Date.now()
    ) {}

    get hash(){
        const str = JSON.stringify(this.hash);
        const hash = crypto.createHash('SHA256')
        hash.update(str).end();
        return hash.digest('hex');
    }

    
}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block(devNull, new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1]
    }

    mine(nonce:number) {
        let solution = 1;
        console.log("⛏️ mining...")

        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempts = hash.digest('hex');
            if(attempts.substr(0,4)==='0000'){
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);
        
        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction)
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

class Wallet {
    public publicKey: string;
    public privateKey: string;


    constructor(){
        const keypair = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem'},
            privateKeyEncoding: { type: 'pkcs8', format: 'pem'}
        });
        
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}


// example
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
satoshi.sendMoney(50, alice.publicKey);
// bob.sendMoney(50, alice.publicKey);
// bob.sendMoney(50, satoshi.publicKey);
// alice.sendMoney(50, bob.publicKey);
// alice.sendMoney(50, satoshi.publicKey);

console.log(Chain.instance)