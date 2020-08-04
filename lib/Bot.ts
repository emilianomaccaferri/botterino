import { Telegraf, Context } from 'telegraf'
import {
    BotConfig,
    Command
} from './typings/index'
import {
    reply
} from './utils'
import {
    execute
} from './commands'
import * as commands from './commands'
import { fetchExams } from './utils'

export class Bot{

    #cfg: BotConfig;
    #bot: any;

    constructor(cfg: BotConfig){
        this.#cfg = cfg;
        this.#bot = new Telegraf(this.#cfg.token);
    }

    async init(){
        
        this.#bot.launch();
        this.#bot.on('new_chat_members', this.handleNewChatMembers)
        this.#bot.on('text', this.handleMessage);
        let exams = await fetchExams();

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

    handleCommand = async(obj: Command): Promise<void> => {

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