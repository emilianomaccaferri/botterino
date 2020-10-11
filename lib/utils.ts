import * as fs from 'fs-extra'
import { Exams, Solution, GitHubTreeNode } from "./typings"
import { Reply, Variable } from "./typings/messages.d";
import axios, { AxiosResponse, AxiosError } from "axios";
import cheerio from 'cheerio'
import qs from 'qs'
import db from './db'

export interface Status{
    is_verified: boolean,
    user_id: number,
    name?: string
}

axios.defaults.headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
  'Referer': 'https://www.esse3.unimore.it/LoginInfo.do?menu_opened_cod=',
  'Content-Type': 'application/x-www-form-urlencoded'
}

export const verifyUser = async(user: any, name: string): Promise<Status> => {

    try{
        
        let query = await db.query("SELECT * FROM users WHERE telegram_id = ?", [user.id]);
        
        if(query.results.length > 0)
            return {
                is_verified: true,
                user_id: user.id
            };
        else return {
            is_verified: false,
            user_id: user.id,
            name
        };

    }catch(err){

        console.log(err);
        return {
            is_verified: false,
            user_id: user.id
        }
    }

}

export const messages = JSON.parse(fs.readFileSync('./messages.json').toString());

export const fetchSolutions = async function(subject: string, solution_name?: string): Promise<Solution[] | AxiosError>{

    try{

        let response = await axios({
            method: 'GET',
            url: `https://api.github.com/repos/unimoreinginfo/${subject}/git/trees/master?recursive=1`
        });

        let sols = response.data.tree;
        let result: Solution[] = new Array(); 

        switch(subject){

            case 'esami-fdi1':
            case 'esami-fdi2':

                let filter: RegExp = /esame-\d+$/;

                if(solution_name)
                    filter = new RegExp(`esame-\\d+\/([a-z-0-9-_]*${solution_name}[a-z-0-9-_]*\/)$`);

                let filtered: Solution[] = new Array();
                sols.forEach((solution: GitHubTreeNode) => {

                    let to_filter = solution.path;
                    if(solution_name)
                        to_filter = solution.path + '/'

                    if(filter.test(to_filter)){

                        let s: string = "";
                        if(solution_name)
                            s = filter.exec(to_filter)![1];

                        let exam_name: string = solution.path.split("/")[0],
                            solution_url: string = `https://github.com/unimoreinginfo/${subject}/tree/master/${exam_name}/${s || ""}`     

                        filtered.push({
                            name: solution.path,
                            url: solution_url
                        })
                    }

                })

                result = filtered;                    

            break;

        }
        
        return result;

    }catch(err){

        console.log("asassaasass");
        
        return Promise.reject(err);
    
    }

}

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