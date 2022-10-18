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
	app.delete("/", async(req, res) => {

		const {
			company,
			branch,
			period,
			tiponf
		} = req.body;

		let client = req.db;

		const query_delete_tipo_nf =
			`delete from "nfprodutoradj.nfprodutoradj_db.data::TIPO_NF" 
				where EMPRESA = ? AND FILIAL = ? AND SYS_TIPO_NF = ? AND DT_INI = ?`;
		try {
			let tipo_nf_deleted = await client.exec(query_delete_tipo_nf, [company, branch, tiponf, period]);
			let msg = '';
			console.log(tipo_nf_deleted);
			if (tipo_nf_deleted == 1) {
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