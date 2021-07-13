#!/usr/bin/env node

const fs = require('fs')
const fileNames = process.argv.splice(2)
const fileName = fileNames[0]

let rawdata = fs.readFileSync(fileName, 'utf-8')
let json = JSON.parse(rawdata).components
var data = []

function removeComponents(obj) {
    for (prop in obj) {
        if (prop === 'components')
            delete obj[prop]
        else if (typeof obj[prop] === 'object')
            removeComponents(obj[prop])
    }
}

function underNest(a) {
    for (var i = 0; i < a.length; i++) {
        var objc = a[i]
        switch (objc.type) {
            case 5:
                data.push(objc)
                break
            case 6:
                var underChoice = []
                if (objc.choices.length == 1) /* Choice is just one */ {
                    underChoice = {
                        type: 95,
                        speaker: {
                            name: 'Gudako'
                        },
                        lines: GudakoSays(objc.choices[0].option)
                    }
                    data.push(underChoice)
                } else if (objc.choices.length >= 2) /* Choice is two or more */ {
                    if (typeof objc.choices[0].results != "undefined" &&
                        objc.choices[0].results != null &&
                        objc.choices[0].results.length != null &&
                        objc.choices[0].results.length > 0) {
                        for (var c = 0; c < objc.choices.length; c++) {
                            underChoice = {
                                type: 95,
                                speaker: {
                                    name: "Gudako"
                                },
                                lines: (c + 1) + ". " + GudakoSays(objc.choices[c].option),
                                description: "Start of script if Choice " + (c + 1) + " of " + [objc.choices.length] + " selected."
                            }
                            data.push(underChoice)
                            underNest(objc.choices[c].results)
                            underChoice = {
                                type: 94,
                                description: "End of script if Choice " + (c + 1) + " of " + [objc.choices.length] + " selected."
                            }
                            data.push(underChoice)
                        }
                    } else {
                        for (var c = 0; c < objc.choices.length; c++) {
                            underChoice = {
                                type: 95,
                                speaker: {
                                    name: "Gudako"
                                },
                                lines: (c + 1) + ". " + GudakoSays(objc.choices[c].option)
                            }
                            data.push(underChoice)
                        }
                    }
                }
                break
            case 11:
                objc.description = `Start of script if Quest cleared.`
                data.push(objc)
                break
            case 10:
                objc.description = `End of script if Quest cleared.`
                data.push(objc)
                break
            case 9:
                switch (objc.name) {
                    case "lblNotClear00":
                        objc.description = `Start of script if Quest NOT cleared.`
                        data.push(objc)
                        break
                    case "lblConf00":
                        objc.description = `End of script if Quest NOT cleared.`
                        data.push(objc)
                        break
                }
                break
            default:
        }
    }
}

function GudakoSays(optionArray) {
    var lt = ""
    for (var t = 0; t < optionArray.length; t++) {
        switch (optionArray[t].type) {
            case 17:
                lt = lt + optionArray[t].text
                break
            case 20:
                lt = lt + "[line 3]"
                break
            case 21:
                lt = lt + "[&" + optionArray[t].male[0].text + ":" + optionArray[t].female[0].text + "]"
                break
            default:
        }
    }
    return lt
}

removeComponents(json)
underNest(json)
/* console.log(JSON.stringify(data, null, 4)) */

const {
    parse
} = require('json2csv');

const fields = ['type',
    'description',
    'speaker.name',
    {
        value: 'lines'
    }
];
const opts = {
    fields,
    defaultValue: ""
};

try {
    const csv = parse(data, opts);
    console.log(csv);
} catch (err) {
    console.error(err);
}