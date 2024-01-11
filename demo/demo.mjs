import DeepBase from "../index.js";

const mem = new DeepBase({ name: "demo" });

await mem.connect();

// SET
await mem.set("config", "lang", "en");

const configLang = await mem.get("config", "lang");
console.log(configLang); // "en"

// ADD
const path = await mem.add("user", { name: "martin" });
console.log(path) // [ 'user', 'CqtOILTDUg' ] / CqtOILTDUg is a random string

const userName = await mem.get(...path, "name");
console.log(userName); // "martin"

// INC
await mem.inc(...path, "count", 1);
await mem.inc(...path, "count", 1);

const userBalance = await mem.get(...path, "count");
console.log(userBalance); // 2

await mem.add("user", { name: "anya" });

const userIds = await mem.keys("user")
console.log(userIds) // [ 'CqtOILTDUg', 'MXOlTBSmEf' ]

// UPDATE
await mem.upd("config", "lang", v => v.toUpperCase());
const lang = await mem.get("config", "lang"); // EN

console.log(await mem.get())

await mem.disconnect();
// {
//     "config": {
//         "lang": "EN"
//     },
//     "user": {
//         "CqtOILTDUg": {
//             "name": "martin",
//             "count": 2
//         },
//         "MXOlTBSmEf": {
//             "name": "anya"
//         }
//     }
// }