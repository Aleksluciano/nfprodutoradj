/*eslint no-console: 0, no-unused-vars: 0, no-undef:0, no-process-exit:0*/
/*eslint-env node, es6 */
"use strict";

module.exports = (app, server) => {
	app.use("/node", require("./routes/myNode")());
	app.use("/data", require("./routes/myData")());
 	app.use("/change", require("./routes/myChange")());
	app.use("/tiponf/add", require("./routes/tiponf/add")());
	app.use("/tiponf/alldata", require("./routes/tiponf/alldata")());
	app.use("/tiponf/delete", require("./routes/tiponf/delete")());
		app.use("/tiponf/edit", require("./routes/tiponf/edit")());
	app.use((err, req, res, next) => {
		console.error(JSON.stringify(err));
		res.status(500).send(`System Error ${JSON.stringify(err)}`);
	});

};