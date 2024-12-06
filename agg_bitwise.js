module.exports = { getbit, shiftright , shiftleft , binor, binxor, binand, binnot, binxor3way , rightrotate, add32bit , floatToUnsignedInt}


/* This was written to work on MongoDB befiore version 6.3, we now have some bitwise ops  */
//* We coupld optimisze it */

//Get a single bit from an integer

function getbit(integer, bit) {
    return {
        $let: {
            vars: {
                integer: integer,
                bit: bit
            },
            in: {
                $mod: [shiftright("$$integer", "$$bit"), 2]
            }
        }
    }
}

function rightrotate(integer, bits) {
    return {
        $let: {
            vars: {
                integer: integer,
                bits: bits
            },
            in: binor(shiftleft("$$integer", {
                $subtract: [32, "$$bits"]
            }), shiftright("$$integer", "$$bits"))

        }
    }
}


//Shift an integer right n bits using a lookup table
var powtwo = []
for (b = 0; b < 32; b++) {
    powtwo[b] = Math.pow(2, b)
}
function shiftright(integer, bits) {
    return {
        $floor: {
            $divide: [integer, {
                $arrayElemAt: [powtwo, bits]
            }]
        }
    }
}

function shiftleft(integer, bits) {
    return {
        $mod: [{
            $floor: {
                $multiply: [integer, {
                    $pow: [2, bits]
                }]
            }
        }, 0xffffffff]
    }
}

function binor(a, b) {
    return {
        $let: {
            vars: {
                a: a,
                b: b
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
                                $cond: [{
                                    $ne: [0, {
                                        $add: [getbit("$$a", "$$this"),
                                            getbit("$$b", "$$this")
                                        ]
                                    }]
                                }, 1, 0]
                            }
                        ]
                    }
                }
            }
        }
    }
}


function binxor(a, b) {
    return {
        $let: {
            vars: {
                a: a,
                b: b
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
                                $cond: [{
                                    $eq: [1, {
                                        $add: [getbit("$$a", "$$this"),
                                            getbit("$$b", "$$this")
                                        ]
                                    }]
                                }, 1, 0]
                            }
                        ]
                    }
                }
            }
        }
    }
}

function binnot(integer1) {
    return {
        $let: {
            vars: {
                notint: integer1
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
                                $cond: [{
                                    $eq: [1, getbit("$$notint", "$$this")]
                                }, 0, 1]
                            }
                        ]
                    }
                }
            }
        }
    }
}



function binxor3way(a, b, c) {
    return {
        $let: {
            vars: {
                a: a,
                b: b,
                c: c
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
                                $mod: [{
                                    $add: [getbit("$$a", "$$this"), getbit("$$b", "$$this"), getbit("$$c", "$$this")]
                                }, 2]
                            }
                        ]
                    }
                }
            }
        }
    }
}

function binand(integer1, integer2) {
    return {
        $let: {
            vars: {
                andint1: integer1,
                andint2: integer2
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
                                $cond: [{
                                    $eq: [2, {
                                        $add: [getbit("$$andint1", "$$this"),
                                            getbit("$$andint2", "$$this")
                                        ]
                                    }]
                                }, 1, 0]
                            }
                        ]
                    }
                }
            }
        }
    }
}

function add32bit(a, b) {
    return binand({
        $add: [a, b]
    }, 0xffffffff)
}

function floatToUnsignedInt(flt) {
    return {
        $let: {
            vars: {
                ftui: flt
            },
            in: binand("$$ftui", 0xffffffff)
        }
    }
}