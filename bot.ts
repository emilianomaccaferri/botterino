'use strict'

import { Bot } from './lib/Bot';
import cfg from './config.json'
import db from "./lib/db"

db.init(cfg.mysql);

const bot = new Bot(cfg);
bot.init()
    .then(() => console.log("done!")
)