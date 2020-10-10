import { Telegraf, Context } from 'telegraf'
import {
    BotConfig,
    ForwardedCommand
} from './typings'
import {
    reply
} from './utils'
import {
    execute
} from './commands'
import {
    readFileSync
} from 'fs-extra'
import axios from 'axios';
import db from './db'

export class Bot{

    #cfg: BotConfig;
    #bot: any;
    static admins: number[];

    constructor(cfg: BotConfig){
        this.#cfg = cfg;
        this.#bot = new Telegraf(this.#cfg.token);
        Bot.admins = this.#cfg.admins as number[];
    }

    async init(){
        
        this.#bot.launch();
        this.#bot.on('new_chat_members', this.handleNewChatMembers)
        this.#bot.command('start', this.handleStart)
    }

    handleStart = async(context: any): Promise<void> => {
        
        let message = context.update.message.text;
        let split = message.split(" ");
        if(split.length == 1)
            return;
        
        let user_id = split[1];

        try{

            let res = await axios.get(`https://fiorino.macca.cloud/user/${user_id}`);
            if(res.data.success){               
                await db.query('UPDATE users SET telegram_id = ? WHERE user_id = ?', [context.update.message.from.id, user_id])
                context.reply(`Hey, benvenuto/a. Entra pure qui: https://t.me/joinchat/Arin7lLXsM3f92BR479HeQ`)
            }
            else
                context.reply(`Non sei registato. Vai su https://fiorino.macca.cloud per saperne di più`);

        }catch(err){
            console.log(err);
            context.reply('Qualcosa è andato storto, contatta @macca_ferri')
            return; 
        }
    }

    handleNewChatMembers = async(context: any): Promise<void> => {

        let work: Promise<void>[] = [];
        context.message.new_chat_members.forEach((member: any) => {
            let name;
            if(member.hasOwnProperty("username"))
                name = `@${member.username}`
            else 
                name = member.first_name;

            work.push(reply({context: context, bot: this.#bot, message_obj: context.message, message: "welcome", variables: [{
                "name": name
                }
            ]}))

        })
        
        await Promise.all(work);
        return;

    }

    handleCommand = async(obj: ForwardedCommand): Promise<void> => {

        let split = obj.text.split(" ");
        let response = await execute(split[0], {
            message_obj: obj.message,
            bot: this.#bot,
            command_args: [...split].slice(1, split.length)
        })

        return await reply({message_obj: obj.message, bot: this.#bot, message: response.text, variables: response.variables, context: obj.context });
        
    }

    handleMessage = async(ctx: Context): Promise<void> => {

        let message = ctx.message;
        
        if (message === undefined || message.text === undefined) return;

        let text = message!.text!.toLowerCase();

        if(message.text.toLowerCase().includes("stonks"))
            return reply({
                bot: this.#bot,
                message_obj: message,
                context: ctx,
                message: "taci"
            });

        if(text.charAt(0) === '!'){

            return await this.handleCommand({
                bot: this.#bot,
                message,
                context: ctx,
                text: text.split("!")[1],
            });

        }
            

    }

}
