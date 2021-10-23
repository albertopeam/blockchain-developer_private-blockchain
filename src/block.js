/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform, 
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods 
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256');
const hex2utf8 = require('./hex2utf8.js');

class Block {

    // Constructor - argument data will be the object containing the transaction data
	constructor(data){
		this.hash = null                                                    // Hash of the block
		this.height = 0;                                                    // Block Height (consecutive number of each block)
		this.body = Buffer.from(JSON.stringify(data)).toString('hex');      // Will contain the transactions stored in the block, by default it will encode the data
		this.time = 0;                                                      // Timestamp for the Block creation
		this.previousBlockHash = null;                                      // Reference to the previous Block Hash
    }
    
    /**
     *  validate() method will validate if the block has been tampered or not.
     *  Been tampered means that someone from outside the application tried to change
     *  values in the block data as a consecuence the hash of the block should be different.
     */
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            // Save in auxiliary variable the current block hash
            const currrentHash = self.hash;
            self.hash = null
            // Recalculate the hash of the Block
            const recalculatedHash = SHA256(JSON.stringify(self)).toString();
            // Comparing if the hashes changed
            const hashesMatch = currrentHash == recalculatedHash;        
            // Returning the Block is valid or not valid
            if (hashesMatch) {
                self.hash = currrentHash
                resolve(true);
            } else {
                self.hash = recalculatedHash
                resolve(false);
            }
        });
    }

    /**
     *  Auxiliary Method to return the block body (decoding the data)
     */
    getBData() {
        let self = this
        return new Promise((resolve, reject) => {            
            // Resolve with the data if the object isn't the Genesis block
            if(self.previousBlockHash != null) {
                // Getting the encoded data saved in the Block
                const hex = self.body;
                // Decoding the data to retrieve the JSON representation of the object
                const ascii = hex2utf8(hex);
                // Parse the data to an object to be retrieve.
                const data = JSON.parse(ascii);
                resolve(data);
            } else {
                reject(Error("Genesis block hasn't associated data"));
            }
        });
    }

}

module.exports = Block; // Exposing the Block class as a module