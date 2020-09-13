import { Exams, Exam, Solution } from './typings/index'
import { CmdArgs, Result, Commands } from './typings/messages'
import {
    messages,
    tokenize,
    partial,
    fetchExams,
    fetchSolutions
} from "./utils"

let solutions: {[index: string]: string} = {
    "fdi1": "esami-fdi1",
    "fdi2": "esami-fdi2"
}

const commands: Commands = {
    "soluzioni":{
        "desc": "soluzioni delle esercitazioni/esami che abbiamo fatto",
        exec: async(arg): Promise<Result> => {


            let args = arg!.command_args!;
            let solution_type = args[0];

            if(!args.length)
                return {
                    text: tokenize(<string>messages.syntax_error.join("\n"), [{
                        "syntax": "!soluzioni nome_materia nome_soluzione (opzionale)"
                    }])
                }

            if(!(solution_type in solutions))
                return {
                    text: `Materia non trovata.\nLa lista delle materie disponibili è: <b>${Object.keys(solutions).join(", ")}</b>`
                }
            
            try{

                let sol = (await fetchSolutions(solutions[solution_type], args[1])) as Solution[];
                let text = (sol.length  > 0) ? `Soluzioni per la ricerca <b>${solutions[solution_type]}</b>:\n` : "Nessuna soluzione trovata."

                sol.forEach((solution: Solution) => {

                    text +=  `<a href="${solution.url}">${solution.name}</a>, `

                })

                text = text.slice(0, -2)
                if(args[1]) text += '\n\nNon ti sembra quello che cercavi? Prova ad usare "-" al posto degli spazi!'

                return {
                    text
                }
            
            }catch(err){

                return {
                    text: `Qualcosa è andato storto durante il recupero delle soluzioni... Probabilmente ho ecceduto il rate limit di GitHub, ci sarà da aspettare un po'.`
                }

            }

        }
    },
    "about": {
        "desc": "un po' di cose su di me",
        exec: (): Result => {

            return {
                text: messages.about_me.join("\n")
            }

        }
    },
    "brainlet": {
        "desc": "manda il grande brainlet",
        exec: (): Result => {

            return {
                text: "https://static.emilianomaccaferri.com/brainlet.jpg"
            }

        }
    },
    "esami": {
        "desc": "mostra gli esami programmati",
        exec: async(args): Promise<Result> => {

            let cmd_args = args!.command_args!;
            try{

                let exams = await fetchExams();
                let list: string = "";
                if(cmd_args.length == 0){

                    Object.keys(exams)
                        .forEach(item => {
                        
                            list += `- <b>${item}</b>\n`

                        })

                    return { text: `Esami disponibili:\n${list}` };
                }

                let keywords = cmd_args;
                    // building an AND regex 
                    // all the keywords must appear in the subject name
                    // it works well actually and it's pretty fast 
                keywords = keywords
                    .map(kw => {
                        return kw = `(?=.*${kw.toLowerCase()})`
                    })

                let regex = new RegExp(keywords.join(""));
                let validExams: Exams = {};
                Object.keys(exams)
                    .forEach((item: string) => {

                        if(regex.test(item.toLowerCase())){
                            validExams[item] = (<Exams>exams)[item];
                        }

                    })
                
                if(!Object.keys(validExams).length)
                    return { text: "Non ho trovato alcun esame a riguardo"}

                let m = "Esami trovati: \n\n";

                for(let subject in validExams){
                            
                    m += `- <b>${subject}</b>\nInsegnante/i: ${validExams[subject][0].teacher}\n\n`
                    validExams[subject].forEach((e: Exam) => {

                        m += `<b>${e.date}</b>\n`
                        m += `Tipo d'esame: ${e.type}\n`
                        m += `Finestra di iscrizione: ${e.available}\n`
                        m += `Numero iscritti: ${e.part}\n\n`

                    })

                    m += '\n'

                }
                
                return { text: m }

            }catch(err){

                return { text: "C'è stato un errore durante il recupero degli esami. Non è colpa mia, ma di Esse3!"}

            }            

        }
    },
    "cringe": {
        "desc": "mostra el faciun del cringe",
        exec: (): Result => { return { text: "https://static.emilianomaccaferri.com/faccia_del_cringe.jpg" } }
    },
    "statistica": {
        "desc": "che voto hai preso in statistica?",
        exec: (args): Result => {

            let cmd_args = args!.command_args!;
            
            if(cmd_args.length < 2){
                return {
                    text: tokenize(<string>messages.syntax_error.join("\n"), [{
                        "syntax": "!statistica voto/18 voto/18.\nControlla, ovviamente, che il voto sia compreso fra 0 e 18."
                    }])
                }
            }

            let vote_string = cmd_args.join(" ");
            let parsed = /^(\d{1,2})\/18 (\d{1,2})\/18$/.exec(vote_string);
            
            if(!parsed){ 
                return {
                    text: tokenize(<string> messages.syntax_error.join("\n"), [{
                        "syntax":
                        "!statistica voto/18 voto/18.\nControlla, ovviamente, che il voto sia compreso fra 1 e 18.",
                    }]),
                };
            }

            const first_vote: number = parseInt(parsed[1]);
            const second_vote = parseInt(parsed[2]);

            if ((first_vote > 18 || first_vote < 1) || (second_vote > 18 || second_vote < 1)) {
                return {
                    text: tokenize(<string> messages.syntax_error.join("\n"), [{
                        "syntax":
                        "!statistica voto/18 voto/18.\nControlla, ovviamente, che il voto sia compreso fra 0 e 18.",
                    }])
                };
            }

            const result = [partial(first_vote), partial(second_vote)]
            if(!result[0] || !result[1])
            return {
                text: `Il punteggio che hai inserito non è ottenibile nella prova di statistica`
            }
            
            let final_vote = 0;

            result.forEach(item => {
                item = item!;
                for(let i = 0; i < item.result.length; i++){

                    if(final_vote >= 24 && item.result[i] == 4)
                        continue;
                    
                    final_vote += item.result[i];

                }

            })
            
            return {
                text: tokenize(<string>messages.stat.join("\n"), [{
                        "vote": final_vote.toString()},
                        {"wrong_ex_1": result[0].wrong_ex.toString()},
                        {"wrong_ex_2": result[1].wrong_ex.toString()},
                        {"wrong_th_1": result[0].wrong_th.toString()},
                        {"wrong_th_2": result[1].wrong_th.toString()}
                    ]
                )
            }
        }
    },
    "help": {
        "desc": "mostra la lista di comandi disponibili",
        exec: (): Result => {

            let message: string[] = ["ecco una lista di comandi disponbili:"]

            Object.keys(commands)
                .forEach(cmd => {

                    message.push(`- <b>!${cmd}</b>: ${commands[cmd].desc}`)

                })

            return {
                text: message.join("\n")
            }

        }
    }
}

export const execute = async(cmd: string, args: CmdArgs): Promise<Result> => {

    console.log(cmd, args.command_args);
    
    if(!commands.hasOwnProperty(cmd))
        return {text: "comando non trovato, scrivi !help per una lista di comandi"};
    
    return commands[cmd].exec(args);

}