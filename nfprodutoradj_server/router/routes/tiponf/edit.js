/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
var express = require("express");

function pad(n) {
	return n < 10 ? '0' + n : n;
}

module.exports = () => {
	var app = express.Router();

	//HANA DB Client 
	app.patch("/", async(req, res) => {

		const {
			company,
			branch,
			period,
			period2,
			tiponf
		} = req.body;
		
		const period1f = period.slice(6) + period.slice(3, 5) + period.slice(0, 2);
		const period2f = period2.slice(6) + period2.slice(3, 5) + period2.slice(0, 2);
		let client = req.db;

		const query_edit_tipo_nf =
			`UPDATE "nfprodutoradj.nfprodutoradj_db.data::TIPO_NF" SET DT_FIN = ?
				where EMPRESA = ? AND FILIAL = ? AND SYS_TIPO_NF = ? AND DT_INI = ?`;
		try {
			let tipo_nf_edited = await client.exec(query_edit_tipo_nf, [period2f, company, branch, tiponf, period1f]);
			let msg = '';
			console.log(tipo_nf_edited);
			if (tipo_nf_edited == 1) {
				msg = 'Ok'
			} else {
				msg = 'Error'
			}
			return res.type("application/json").status(200).send({
				result: msg
			});
		} catch (err) {
			console.log(err)
			return res.type("text/plain").status(500).send(`ERROR: code${err.code} message:${err.message}`);
		}

	});

	return app;
};