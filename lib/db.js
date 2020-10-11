"use strict";
exports.__esModule = true;
exports.debufferize = exports.core = void 0;
var mysql_1 = require("mysql");
var Db = /** @class */ (function () {
    function Db() {
        this.pool = undefined;
        this.config = undefined;
    }
    Db.prototype.init = function (config) {
        if (this.pool !== undefined)
            return;
        this.config = config;
        this.pool = mysql_1.createPool({
            host: this.config.host,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            multipleStatements: true
        });
    };
    Db.prototype.query = function (query, options, buffered_results) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (buffered_results === void 0) { buffered_results = false; }
        return new Promise(function (resolve, reject) {
            _this.pool.query(query, options, function (err, results, fields) {
                if (err)
                    return reject(err);
                if (buffered_results)
                    results = exports.debufferize(results);
                return resolve({
                    results: results,
                    fields: fields
                });
            });
        });
    };
    return Db;
}());
exports["default"] = new Db();
exports.core = mysql_1["default"];
exports.debufferize = function (rows) {
    var new_rows = rows.map(function (result) {
        var keys = Object.keys(result);
        keys.forEach(function (key) {
            if (result[key] instanceof Buffer)
                result[key] = result[key].toString();
        });
        return result;
    });
    return new_rows;
};
