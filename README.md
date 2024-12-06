The Challenge here is to implement sha256 hashing in MongoDB aggregation, this is not a native primitive.

I previously did this as part of a bitcoin miner in aggreagtion so this is extracting it as a standalone function.

This is convert the following from SQL `

`TO_BASE64(sha256(concat(CNT.contract_number,'salt'))) as ContractNumber`

Or in Javascript

```

crypto.createHash('sha256').update("abc12345").digest('hex')
6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090
ef63adb4a33117f6bb6395be441b5bb254de93275b26ffd35c19010c2c3cb82e
```

Simple example of how to use is in `aggsha256.js`
