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
	app.post("/", async(req, res) => {

		const {
			company,
			branch,
			branch2,
			period,
			period2,
			simulation,
			nfid
		} = req.body;

		const period1f = period.slice(6) + period.slice(3, 5) + period.slice(0, 2);
		const period2f = period2.slice(6) + period2.slice(3, 5) + period2.slice(0, 2);

		//validações
		if (!company) return res.type("text/plain").status(500).send(`Filtro de empresa faltando`);
		if (!branch) return res.type("text/plain").status(500).send(`Filtro de filial faltando`);
		if (!branch2) return res.type("text/plain").status(500).send(`Filtro de filial faltando`);
		
		const numberPattern = /\d+/g;
		if (period1f.match(numberPattern)[0].length != 8 || period2f.match(numberPattern)[0].length != 8)return res.type("text/plain").status(500).send(`Período com formatação incorreta`);

		let client = req.db;

		const query_select_nf_tipo =
			`select EMPRESA, FILIAL, SYS_TIPO_NF, DT_INI, DT_FIN from "nfprodutoradj.nfprodutoradj_db.data::TIPO_NF" 
                              where EMPRESA = ? AND FILIAL BETWEEN ? AND ?  
                              order by "EMPRESA","FILIAL"`;
		const query_select_v_emp_fed =
			`SELECT "MANDT_TDF" FROM "adejo.view::/TMF/V_EMP_FED" ('PLACEHOLDER' = ('$$P_DT_INI$$', '${period1f}' ), 'PLACEHOLDER' = ('$$P_DT_FIN$$', '${period2f}' ) ) WHERE EMPRESA =  ? AND EH_MATRIZ = 'X'`;
	//	const query_select_columns_table =
		//	`SELECT COLUMN_NAME from TABLE_COLUMNS where SCHEMA_NAME = 'SAPABAP1' and TABLE_NAME = '/TMF/D_NF_DOC'`;
	//	const query_select_columns_view =
		//	`SELECT COLUMN_NAME from VIEW_COLUMNS where SCHEMA_NAME = 'NFPRODUTORADJ_HDI_NFPRODUTORADJ_DB_1' and VIEW_NAME = 'ZBRFIVW_CHVNFE'`;
		const query_select_d_nf_doc = `SELECT "MANDT", "NF_ID" FROM "adejo.table::/TMF/D_NF_DOC" WHERE MANDT = ? AND NF_ID = ?`;
		const query_update_d_nf_doc =
			`UPDATE "adejo.table::/TMF/D_NF_DOC" SET CHV_NFE = ?, COD_SIT = ? WHERE MANDT = ? AND NF_ID = ?`;
		const resultAll = [];
		let item = 0;

		//SQL EXEC
		try {

			let nf_tipo_table = await client.exec(query_select_nf_tipo, [company, branch, branch2]);
			if (nf_tipo_table < 1) throw Error('Tipo de nota not configured for period');

			let v_emp_fed_table = await client.exec(query_select_v_emp_fed, [company]);

			let query_select_zbrfivw_chvnfe = '';
			if (!nfid)
				query_select_zbrfivw_chvnfe =
				`SELECT * FROM "adejo.view::ZBRFIVW_CHVNFE"
                                                       ('PLACEHOLDER' = ('$$P_MANDT$$', '${v_emp_fed_table[0].MANDT_TDF}' ),
														'PLACEHOLDER' = ('$$P_EMPRESA$$', '${company}' ), 
														'PLACEHOLDER' = ('$$P_DT_INI$$', '${period1f}' ),
														'PLACEHOLDER' = ('$$P_DT_FIN$$', '${period2f}' )) where FILIAL BETWEEN ? AND ? 
														order by "EMPRESA","FILIAL","NF_ID"
														`;
			if (nfid)
				query_select_zbrfivw_chvnfe =
				`SELECT * FROM "adejo.view::ZBRFIVW_CHVNFE"
                                                       ('PLACEHOLDER' = ('$$P_MANDT$$', '${v_emp_fed_table[0].MANDT_TDF}' ),
														'PLACEHOLDER' = ('$$P_EMPRESA$$', '${company}' ), 
														'PLACEHOLDER' = ('$$P_DT_INI$$', '${period1f}' ),
														'PLACEHOLDER' = ('$$P_DT_FIN$$', '${period2f}' )) where NF_ID = ? AND FILIAL BETWEEN ? AND ? 
														order by "EMPRESA","FILIAL","NF_ID"
														`;
			let zbrfivw_chvnfe_table = '';
			if (!nfid)
				zbrfivw_chvnfe_table = await client.exec(query_select_zbrfivw_chvnfe, [branch, branch2]);
			if (nfid)
				zbrfivw_chvnfe_table = await client.exec(query_select_zbrfivw_chvnfe, [nfid, branch, branch2]);

			const uniqueIds = new Set();

			const unique_chvnfe = zbrfivw_chvnfe_table.filter(element => {
				const id = element.EMPRESA + element.FILIAL + element.NF_ID;
				const isDuplicate = uniqueIds.has(id);

				uniqueIds.add(id);

				if (!isDuplicate) {
					return true;
				}

				return false;
			});
			if (simulation === true) {
				for (const chvnfe of unique_chvnfe) {
					if (!chvnfe.MANDT || !chvnfe.NF_ID) continue;
					let chave = '';
					let textos = zbrfivw_chvnfe_table.filter(a => a.EMPRESA == chvnfe.EMPRESA && a.FILIAL == chvnfe.FILIAL && a.NF_ID == chvnfe.NF_ID).map(
						a => a.TXT).join("");
					try {
						chave = textos.replace(/[^\d]/g, " ").split(' ').filter(a => a.length == 44)[0];
					} catch (e) {
						//
					}
					if (chave && chave.length == 44) {
						const update_d_nf_doc = {
							MANDT: chvnfe.MANDT,
							NF_ID: chvnfe.NF_ID,
							NUM_DOC: chvnfe.NUM_DOC,
							DT_E_S: chvnfe.DT_E_S,
							EMPRESA: chvnfe.EMPRESA,
							FILIAL: chvnfe.FILIAL,
							CHV_NFE: chave,
							COD_SIT: '08',
							STATUS: true
						}
						item++;
						resultAll.push({... {
								item
							},
							...update_d_nf_doc
						});
					}
				}
			}
			if (simulation === false) {
				for (const chvnfe of unique_chvnfe) {
					if (!chvnfe.MANDT || !chvnfe.NF_ID) continue;
					let chave = '';
					let textos = zbrfivw_chvnfe_table.filter(a => a.EMPRESA == chvnfe.EMPRESA && a.FILIAL == chvnfe.FILIAL && a.NF_ID == chvnfe.NF_ID).map(
						a => a.TXT).join("");
					try {
						chave = textos.replace(/[^\d]/g, " ").split(' ').filter(a => a.length == 44)[0];
					} catch (e) {
						//
					}
					if (chave && chave.length == 44) {
						let d_nf_doc_table = await client.exec(query_select_d_nf_doc, [chvnfe.MANDT, chvnfe.NF_ID]);
						let status = false;
						if (d_nf_doc_table.length > 0) {

							const cod_sit = '08';
							let d_nf_doc_updated = await client.exec(query_update_d_nf_doc, [chave, cod_sit, chvnfe.MANDT, chvnfe.NF_ID]);
							if (d_nf_doc_updated == 1) status = true;
						} else {
						    let columns = '';
							let values = '';
							chvnfe.CHV_NFE = chave;
							chvnfe.COD_SIT = '08';
							for (const [key, value] of Object.entries(chvnfe)) {
								if (key == 'DOCUMENT_STATUS') continue;
								if (key == 'TXT') continue;
								if (value) {
									columns = columns + ` ${key},`;
									values = values + ` '${value}',`;
								}
							}

							columns = columns.slice(0, columns.length - 1);
							values = values.slice(0, values.length - 1);
							const query_insert_d_nf_doc = `INSERT INTO "adejo.table::/TMF/D_NF_DOC" (${columns}) VALUES (${values})`;

							let d_nf_doc_inserted = await client.exec(query_insert_d_nf_doc);
							if (d_nf_doc_inserted == 1) status = true;
						}
						const update_d_nf_doc = {
							MANDT: chvnfe.MANDT,
							NF_ID: chvnfe.NF_ID,
							NUM_DOC: chvnfe.NUM_DOC,
							DT_E_S: chvnfe.DT_E_S,
							EMPRESA: chvnfe.EMPRESA,
							FILIAL: chvnfe.FILIAL,
							CHV_NFE: chave,
							COD_SIT: status ? '08' : chvnfe.COD_SIT,
							STATUS: status
						}
						item++;
						resultAll.push({... {
								item
							},
							...update_d_nf_doc
						});
					}
				}
			}

			return res.type("application/json").status(200).send({
				result: resultAll
			});

		} catch (err) {
			console.log(err)
			if(!err.code)err.code = '9999';
			return res.type("text/plain").status(500).send(`ERROR: code: ${err.code} message: ${err.message}`);
		}

	});

	return app;
};