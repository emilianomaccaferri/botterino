import { Telegraf, Context } from 'telegraf'
import {
    BotConfig,
    ForwardedCommand
} from './typings'
import {
    reply,
    Status,
    verifyUser
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
	    this.#bot.on('message', this.handleMessage);
        

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

                context.reply(`Hey, benvenuto/a. Ecco la lista di gruppi accessibile ${this.#cfg.groups.join("\n")}`);
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

        let group = await context.getChat();
        let group_name = group.title;
        let work: Promise<void>[] = [];
        let allowed: Promise<Status>[] = [];
        context.message.new_chat_members.forEach((member: any) => {
            let name;
            if(member.hasOwnProperty("username"))
                name = `@${member.username}`
            else 
                name = member.first_name;

            allowed.push(verifyUser(member, name));
            work.push(reply({context: context, bot: this.#bot, message_obj: context.message, message: "welcome", variables: [{
                    "name": name
                }, 
                {
                    "group_name": group_name
                }
            ]}))

        })
        
        let allowed_users = await Promise.all(allowed);

        allowed_users.forEach((user: Status, index: number) => {

            if(!user.is_verified){
                this.#bot.telegram.kickChatMember(group.id, user.user_id, { until_date: 40 });
                this.#bot.telegram.sendMessage(group.id, `${user.name!} non ha verificato il suo account. È stato terminato/a.`);
            }

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
