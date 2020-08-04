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