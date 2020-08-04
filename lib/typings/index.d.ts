import { Context } from "telegraf";

export interface BotConfig{
    token: string,
    esse3_username: string,
    esse3_password: string
}
export interface Command{
    bot: any,
    message: any,
    text: string,
    context: Context
}
export interface Exam{
    available: string, 
    date: string, 
    type: string, 
    teacher: string, 
    part: string
}
export type Exams = {
    [name: string]: Exam[]
}