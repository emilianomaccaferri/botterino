export interface Variable {
  [key: string]: string;
}
export interface Markup {
  reply_markup: string;
}
export interface Reply {
  message_obj: any;
  bot: any;
  context: any;
  message: string;
  variables?: Variable[];
} // i docs dei typings di Telegraf fanno cagare

export interface CmdArgs{
    bot: any,
    message_obj: any,
    command_args: string[]
}
export interface Result{
    text: string,
    variables?: {[key: string]: string}[]
}
export interface Commands{
    [name: string]: Command
}
export interface Command{
    desc: string,
    exec: (args?: CmdArgs) => (Promise<Result> | Result)
}