const { getbit, binor, binxor, binand, binnot, shiftright, shiftleft, binxor3way, rightrotate, add32bit, floatToUnsignedInt } = require("./agg_bitwise.js");

module.exports = { createDataBlock, agg_sha256, s0, s1, roundsigma1, roundsigma0, majority, choose, temp1, temp2, showAsBinary }

// Each value (0–63) is the first 32 bits of the fractional parts of the cube roots of the first 64 primes (2–311).


k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]


function s0(a, i) {
    return {
        $let: {
            vars: {
                n: {
                    $ifNull: [{
                        $arrayElemAt: [a, {
                            $subtract: [i, 15]
                        }]
                    }, 0]
                }
            },
            in: binxor3way(rightrotate("$$n", 7),
                rightrotate("$$n", 18),
                shiftright("$$n", 3))
        }
    }
}



function s1(a, i) {
    return {
        $let: {
            vars: {
                n: {
                    $ifNull: [{
                        $arrayElemAt: [a, {
                            $subtract: [i, 2]
                        }]
                    }, 0]
                }
            },
            in: binxor3way(rightrotate("$$n", 17),
                rightrotate("$$n", 19),
                shiftright("$$n", 10))
        }
    }
}





function roundsigma1(vals) {
    return {
        $let: {
            vars: {
                rs1e: vals + ".e"
            },
            in: binxor3way(rightrotate("$$rs1e", 6), rightrotate("$$rs1e", 11), rightrotate("$$rs1e", 25))
        }
    }
}

function roundsigma0(vals) {
    return {
        $let: {
            vars: {
                rs2a: vals + ".a"
            },
            in: binxor3way(rightrotate("$$rs2a", 2), rightrotate("$$rs2a", 13), rightrotate("$$rs2a", 22))
        }
    }
}

function majority(vals) {
    return {
        $let: {
            vars: {
                a: vals + ".a",
                b: vals + ".b",
                c: vals + ".c"
            },
            in: {
                $reduce: {
                    input: {
                        $range: [31, -1, -1]
                    },
                    initialValue: 0,
                    in: {
                        $add: [{
                            $multiply: ["$$value", 2]
                        },
                        {
                            $arrayElemAt: [
                                [0, 0, 1, 1], {
                                    $add: [getbit("$$a", "$$this"), getbit("$$b", "$$this"), getbit("$$c", "$$this")]
                                }
                            ]
                        }
                        ]
                    }
                }
            }
        }
    }
}

function choose(vals) {
    return {
        $let: {
            vars: {
                che: vals + ".e",
                chf: vals + ".f",
                chg: vals + ".g"
            },
            in: binxor(binand("$$che", "$$chf"), binand(binnot("$$che"), "$$chg"))
        }
    }
}


function temp2(vals) {
    return {
        $add: [roundsigma0(vals), majority(vals)]
    }
}

function temp1(vals, idx) {
    return {
        $add: [vals + ".h", roundsigma1(vals), choose(vals), {
            $arrayElemAt: [k, idx]
        }, {
            $arrayElemAt: ["$M", idx]
        }]
    }
}


function showAsBinary(arr) {
    console.log(arr);
    r = ""
    for (x = 0; x < arr.length; x++) {
        r += ("0".repeeat(32) + arr[x].toString(2)).slice(-32)
        if (x % 2 == 1) { r += "\n" } else { r += " " }
    }
    console.log(r);
}


function createDataBlock(field) {

    // We dont have chr and ord but it's bytes so we can build a lookup
    allchars = ""
    for (x = 0; x < 255; x++) { allchars += String.fromCharCode(x) }

    nChars = { $strLenBytes: field }
    charArray = {
        $reduce: {
            input: { $range: [0, nChars] },
            initialValue: [],
            in: {
                $concatArrays: ["$$value",
                    [{ $substrBytes: [field, "$$this", 1] }]]
            }
        }
    }

    mapOrd = { $map: { input: charArray, in: { $indexOfBytes: [allchars, "$$this"] } } }
    toArray = { $set: { chars: charArray } }
    byteArray = { $set: { bytes: mapOrd } }
    nInts = { $divide: [{ $size: charArray }, 4] }

    skip = { $multiply: ["$$this", 4] }
    byte1 = { $ifNull: [{ $arrayElemAt: ["$bytes", { $add: [skip, 3] }] }, 128] }
    byte2 = { $ifNull: [{ $arrayElemAt: ["$bytes", { $add: [skip, 2] }] }, 128] }
    byte3 = { $ifNull: [{ $arrayElemAt: ["$bytes", { $add: [skip, 1] }] }, 128] }
    byte4 = { $ifNull: [{ $arrayElemAt: ["$bytes", { $add: [skip, 0] }] }, 128] }

    msbint = { $add: [{ $multiply: [byte4, 0x1000000] }, { $multiply: [byte3, 0x10000] }, { $multiply: [byte2, 0x100] }, byte1] }


    toInt = {
        $reduce: {
            input: { $range: [0, { $ceil: nInts }] },
            initialValue: [],
            in: { $concatArrays: ["$$value", [msbint]] }
        }
    }

    //If nBytes DOES divide by 4 add a single bit
    extrabit = { $cond: { if: { $eq: [nInts, { $ceil: nInts }] }, then: [0x80000000], else: [] } }
    toInt = { $concatArrays: [toInt, extrabit] }
    //Now we need to convert that to an array of unsigned integers
    intArray = { $set: { data: toInt } }
    //Now pad the data to a multiple of 512 - 64 bits but we are going for a simple 
    //one block 14 ints 
    zeroPadding = { $map: { input: { $range: [{ $size: "$data" }, 15] }, in: 0 } }
    padArray = { $set: { data: { $concatArrays: ["$data", zeroPadding] } } }
    //Add Length in last int
    addLength = { $set: { data: { $concatArrays: ["$data", [{ $multiply: [nChars, 8] }]] } } }
    return [toArray, byteArray, intArray, padArray, addLength]
}

function toHex(expr) {
    const lut = []
    for (i = 0; i < 256; i++) { lut[i] = ("0" + i.toString(16)).slice(-2) }
    var byte1 = { $arrayElemAt: ["$$lut", binand("$$this", 0xFF)] }
    var byte2 = { $arrayElemAt: ["$$lut", binand(shiftright("$$this", 8), 0xFF)] }
    var byte3 = { $arrayElemAt: ["$$lut", binand(shiftright("$$this", 16), 0xFF)] }
    var byte4 = { $arrayElemAt: ["$$lut", binand(shiftright("$$this", 24), 0xFF)] }

    hexints = { $let: { vars: { lut }, in: { $map: { input: expr, in: { $concat: [byte4, byte3, byte2, byte1] } } } } }
    rval = { $reduce: { input: hexints, initialValue: "", in: { $concat: ["$$value", "$$this"] } } }
    return rval;
}

// WARNING, This is only hashing the first block, it's pretty easy to extend to longer messages
// That's why its not returning an expression though as that woudlnt support longer messages

function agg_sha256(source, dest) {

    // Convery message to 32 but integers, add a zero block and pad

    const pipeline = createDataBlock(source)

    // These are hard-coded constants that represent the first 32 bits of the fractional
    // parts of the square roots of the first 8 primes: 2, 3, 5, 7, 11, 13, 17, 19

    h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]

    //Assign Seeds (We only do this at the start of a round)
    var addInitialHash = {
        $addFields: {
            s: {
                a: h[0],
                b: h[1],
                c: h[2],
                d: h[3],
                e: h[4],
                f: h[5],
                g: h[6],
                h: h[7]
            }
        }
    }
    pipeline.push(addInitialHash)

    //Create a Message Array, first 16 x 32 bit  ( 512 bits )
    //We can repeat this for each block to support longer data

    var copyBlock1 = {
        $addFields: {
            M: {
                $slice: ["$data", 0, 16]
            }
        }
    }

    pipeline.push(copyBlock1)


    //Now copy shifted values into block

    var extendMessage = {
        $addFields: {
            M: {
                $reduce: {
                    input: {
                        $range: [16, 64]
                    },
                    initialValue: "$M",
                    in: {
                        $concatArrays: ["$$value", [floatToUnsignedInt({
                            $add: [{
                                $ifNull: [{
                                    $arrayElemAt: ["$$value", {
                                        $subtract: ["$$this", 16]
                                    }]
                                }, 0]
                            },
                            s0("$$value", "$$this"),
                            {
                                $ifNull: [{
                                    $arrayElemAt: ["$$value", {
                                        $subtract: ["$$this", 7]
                                    }]
                                }, 0]
                            },
                            s1("$$value", "$$this")
                            ]
                        })]]
                    }

                }
            }
        }
    }

    pipeline.push(extendMessage);

    // 64 rounds of what is called 'Compression'

    var hashround = {
        $addFields: {
            new_s: {
                $reduce: {
                    input: {
                        $range: [0, 64, 1]
                    },
                    initialValue: "$s",
                    in: {
                        h: "$$value.g",
                        g: "$$value.f",
                        f: "$$value.e",
                        e: binand({
                            $add: ["$$value.d", temp1("$$value", "$$this")]
                        }, 0xffffffff),
                        d: "$$value.c",
                        c: "$$value.b",
                        b: "$$value.a",
                        a: binand({
                            $add: [temp1("$$value", "$$this"), temp2("$$value")]
                        }, 0xffffffff)
                    }
                }
            }
        }
    }

    pipeline.push(hashround)

    //Pull the data out

    var saveseeds = {
        $addFields: {
            s: {
                a: add32bit("$s.a", "$new_s.a"),
                b: add32bit("$s.b", "$new_s.b"),
                c: add32bit("$s.c", "$new_s.c"),
                d: add32bit("$s.d", "$new_s.d"),
                e: add32bit("$s.e", "$new_s.e"),
                f: add32bit("$s.f", "$new_s.f"),
                g: add32bit("$s.g", "$new_s.g"),
                h: add32bit("$s.h", "$new_s.h")
            }
        }
    }

    pipeline.push(saveseeds)

    // Project out all the temp steps
    pipeline.push({ $set: { sa: { $objectToArray: "$s" } } })
    pipeline.push({ $set: { sa: "$sa.v" } })
        / pipeline.push({ "$set": { [dest]: toHex("$sa", "digest") } })

    pipeline.push({ $project: { chars: 0, bytes: 0, data: 0, new_s: 0, M: 0, sa: 0, s: 0 } })

    return pipeline;
}