/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const Block = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if(this.height === -1){
            let block = new Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain. 
     * After adding the block, the chain will be validated, if 
     * it is corrupted _addBlock will reject with a list of 
     * errors
     * @param {*} block 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {                                    
            const isNotEmptyChain = self.height > 0
            if (isNotEmptyChain) {                      // if not genesis
                const previousBlockHeight = self.height - 1;
                block.previousBlockHash = self.chain[previousBlockHeight].hash  // link current block with previous block
            } else {
                self.height = 0;                                        // if chain is empty set height to zero
            }
            block.time = new Date().getTime().toString().slice(0,-3)    // UTC time
            block.height = self.height                                  // height
            block.hash = SHA256(JSON.stringify(block)).toString()
            self.chain.push(block)                                      // add
            self.height += 1;                                           // add height
            const errors = await self.validateChain();                  // check if chain is valid
            if (errors.length > 0) {
                reject(new Error(errors.toString()));
            } else {
                resolve(block);
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            const date = new Date().getTime().toString().slice(0,-3);
            const ownershipMessage = `${address}:${date}:starRegistry`;
            resolve(ownershipMessage);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error. 
     * This method also checks if the signing of the message(param)
     * with the address(param) will generate the expected signature(param).
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            const messageTime = parseInt(message.split(':')[1]);
            const currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            const fiveMinuteSeconds = 5 * 60;
            const diffBetweenTimes = currentTime - messageTime;            
            if(diffBetweenTimes >=0 && diffBetweenTimes < fiveMinuteSeconds) {
                try {
                    const isVerified = bitcoinMessage.verify(message, address, signature);
                    if (isVerified) {
                        const data = {address: address, star: star};
                        const newBlock = new Block(data);
                        await self._addBlock(newBlock);
                        resolve(newBlock);                    
                    } else {
                        reject(Error("Message verification failed"));    
                    }                    
                } catch(e) {
                    reject(Error(`Message verification failed. ${e}`));
                }
            } else {
                reject(Error("Elapsed more than five minutes between message ownership verification and current time"));
            }
        })
    }

    /**
     * This method will return a Promise that will resolve with the Block
     * with the hash passed as a parameter. If doesn't exist a Block with 
     * this hash it will be rejected with null.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            const block = self.chain.find(block => block.hash === hash)
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }            
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            const block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        return new Promise((resolve, reject) => {
            const blocks = self.chain.slice(1);
            const promises = blocks.map(block => block.getBData());
            resolve(Promise.all(promises));
        }).then((results) => {
            const filtered = results.filter(data => data.address === address);
            const stars = filtered.map(item => item.star);
            return stars
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {            
            // block validation
            const promises = self.chain.map(async (block, index) => await block.validate() ? null : index);
            const results = await Promise.all(promises);
            errorLog = results.filter(index => index != null).map(index => `Invalid block hash at index ${index}`);
            // previousBlockHash validation
            for (let i = self.chain.length-1; i > 0; i--) {
                if (self.chain[i].previousBlockHash !== self.chain[i-1].hash) {
                    errorLog.push(`Invalid previous block hash at index ${i}`);
                }
            }
            if (self.chain[0].previousBlockHash != null) {
                errorLog.push(`Invalid previous block hash at index 0`);
            }
            resolve(errorLog);
        });
    }

}

module.exports = Blockchain;   