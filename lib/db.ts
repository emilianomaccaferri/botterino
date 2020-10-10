import mysql, { Pool, createPool, OkPacket } from "mysql";

interface Config{
    host: string,
    database: string,
    user: string,
    password: string
}

class Db {
    pool: Pool | undefined = undefined;
    config: Config | undefined = undefined;
    
    constructor(){}

    init(config: Config) {
        if (this.pool !== undefined) return;

        this.config = config;
        
        this.pool = createPool({
            host: this.config.host,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            multipleStatements: true
        });
    }

    query(query: string, options: any = {}, buffered_results: boolean = false): any {
        return new Promise((resolve, reject) => {
            this.pool!.query(query, options, function (err, results, fields) {
                if (err)
                    return reject(err);
                
                if(buffered_results)
                    results = debufferize(results);

                return resolve({
                    results,
                    fields
                });
            });
        });
    }
}

export default new Db();
export const core = mysql;
export const debufferize = (rows: any[]): any => {

    let new_rows = rows.map(result => {

        let keys = Object.keys(result);
        keys.forEach(key => {

            if(result[key] instanceof Buffer)
                result[key] = result[key].toString();

        })

        return result;
            
    })

    return new_rows;

}