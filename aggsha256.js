

const { agg_sha256 } = require("./agg_hashfns.js");



db = db.getSiblingDB("hasher")
db.hasher.drop()

plainText = "hello world";
document = { plainText }
db.hasher.insertOne(document);

console.log("Data Loaded");


hashSteps = agg_sha256("$plainText", "hash_value")
var cursor = db.hasher.aggregate([...hashSteps])
var doc = cursor.next()
console.log(doc)


console.log(`Test: Should match ${crypto.createHash('sha256').update(plainText).digest('hex')}`)

