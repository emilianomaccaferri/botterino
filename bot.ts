'use strict'

import { Bot } from './lib/Bot';
import config from './config.json'

const bot = new Bot(config);
bot.init()
    .then(() => console.log("done!")
)