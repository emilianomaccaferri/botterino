'use strict'

const readline = require("readline");
import { Bot } from './lib/Bot';
import cfg from './config.json'
import db, {core} from "./lib/db"
import { randomBytes } from 'crypto'
 
db.init(cfg.mysql);

const bot = new Bot(cfg);
bot.init()
    .then(() => console.log("done!")
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})


// se starto con node
rl.on('line', async(data: string) => {
    
    let split = data.split(" "),
        name = `${split[0]} ${split[1]}`,
        email = split[2],
        userid = randomBytes(32).toString('hex');

    console.log(name, email, userid);
    
    await db.query(`INSERT INTO users (name, email, user_id) VALUES(AES_ENCRYPT(?, ${ core.escape(cfg.aes_key!) }), AES_ENCRYPT(?, ${ core.escape(cfg.aes_key!) }), ?)`, [name, email, userid]);

    console.log("utente inserito");

})