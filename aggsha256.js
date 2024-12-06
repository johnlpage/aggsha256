

const { agg_sha256 } = require("./agg_hashfns.js");

db = db.getSiblingDB("hasher")
db.hasher.drop()

plainText = "hello world";
document = { plainText }
db.hasher.insertOne(document);

console.log("Data Loaded");

// Pipeline is multiple stages this the ..., whilst it "Could" be an expression this is just 
// simpler to understand. It's also only hashing the first 448b block although it's pretty easy to 
// extend to more blocks as seen in mongoaggminer 

hashSteps = agg_sha256("$plainText", "hash_value")
var cursor = db.hasher.aggregate([...hashSteps])
var doc = cursor.next()
console.log(doc)


console.log(`Test: Should match ${crypto.createHash('sha256').update(plainText).digest('hex')}`)

