import * as fs from 'fs-extra'
import { Exams } from "./typings"
import { Reply, Variable, Markup } from "./typings/messages.d";
import axios, { AxiosResponse, AxiosError } from "axios";
import cheerio from 'cheerio'
import qs from 'qs'

axios.defaults.headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
  'Referer': 'https://www.esse3.unimore.it/LoginInfo.do?menu_opened_cod=',
  'Content-Type': 'application/x-www-form-urlencoded'
}

export const messages = JSON.parse(fs.readFileSync('./messages.json').toString());

export const fetchExams = async function(): Promise<Exams | AxiosError>{

  let result: Exams | AxiosError = {};

  try{
    let response = await axios({
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: qs.stringify({
        FAC_ID: 10005,
        CDS_ID: 10296,
        AD_ID: 'X',
        DOCENTE_ID: 'X',
        DATA_ESA: '',
        form_id_form1: 'form1',
        actionBar1: 'Cerca'
      }),
      url: 'https://www.esse3.unimore.it/Guide/PaginaListaAppelli.do'
    });
    let $ = cheerio.load(response.data),
      exams: Exams = {};

      $("#tableAppelli .table-1-body tr").each((i: number, el: any) => {

      let e = $(el);
  
      let exam_name = $(e.children()[0]).text(),
          available = $(e.children()[1]).text(),
          date = $(e.children()[2]).text(),
          type = $(e.children()[3]).text(),
          teacher = $(e.children()[4]).text(),
          part = $(e.children()[5]).text();

      if (exam_name.charAt(0) != '[')
          return;
      if (!exams.hasOwnProperty(exam_name))
          exams[exam_name] = [{ available, date, type, teacher, part }]
      else
          exams[exam_name].push({ available, date, type, teacher, part })

      })

      result = exams;

    }catch(err){

      result = err;

    }finally{

      return result;

    }
}

export const reply = async function(obj: Reply){
  
    const reply_type = messages[obj.message];
    let text = reply_type || obj.message;
    const bot = obj.bot;
  
    if(reply_type && obj.variables)
        text = tokenize(text.join("\n"), obj.variables);
  
    return obj.context.reply(text, { parse_mode: 'HTML' })
          
}
  
export const tokenize = function(str: string, vars: Variable[]): string{
  
    vars.forEach((v: Variable) => {
 
        let key = Object.keys(v)[0];
        let value = v[key];
        str = str.replace(new RegExp(`%${key}%`, "g"), value);
  
    });
  
    return str;
  
}
  
export const partial = function(v: number) {
  
    let sum = 0;
    let schema = [4, 4, 4, 4, 1, 1], result = [], wrong_ex = 0, wrong_th = 0;
  
    for (let i = 0; i < schema.length; i++) {
      if (sum + schema[i] > v) {
        if (i < 4) wrong_ex += 1;
        else wrong_th += 1;
        result.push(0);
        continue;
      } else {
        result.push(schema[i]);
      }
  
      sum += schema[i];
    }
  
    if (sum != v) {
      return null;
    }
  
    return { result, wrong_ex, wrong_th };
  
}