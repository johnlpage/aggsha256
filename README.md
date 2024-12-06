The Challenge here is to implement sha256 hashing in MongoDB aggregation, this is not a native primitive.

I previously did this as part of a bitcoin miner in aggreagtion so this is extracting it as a standalone function.

This is convert the following from SQL `

`TO_BASE64(sha256(concat(CNT.contract_number,'salt'))) as ContractNumber`

Or in Javascript

```

>crypto.createHash('sha256').update("hello world").digest('hex')

b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
```

Simple example of how to use is in `aggsha256.js`
