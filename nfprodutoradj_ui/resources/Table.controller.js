sap.ui.define([
	"nfprodutoradj_ui/BaseController",
	"nfprodutoradj_ui/myLib/oData",
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageBox",
	"nfprodutoradj_ui/myLib/utils",
	'sap/m/MessageToast'
], function (BaseController, oData, JSONModel, MessageBox, utils, MessageToast) {
	"use strict";
	const oData2 = utils.deepClone(oData);
	return BaseController.extend("nfprodutoradj_ui.Table", {
		onInit: function () {

			var xhttp = new XMLHttpRequest();
			var view = this;

			xhttp.open("GET", "/nfprodutor/tiponf/alldata", true);
			xhttp.send();
			xhttp.onreadystatechange = function () {
				//	console.log(this.responseText);
				if (this.readyState === 4 && this.status === 200) {
					var response = JSON.parse(this.responseText);
					oData2.CompanyCollection = response.emp;
					oData2.Companies = response.emp;
					oData2.BranchCollection = response.estab;
					oData2.Branchs = response.estab;
					var tiponf = {
						TIPOS: response.tiponf
					}
					var oModelTipoNf = new JSONModel(tiponf);
					view.byId('tableTipoNf').setModel(oModelTipoNf);

					var oModel = new JSONModel(oData2);
					view.byId('AddDialog').setModel(oModel);

				} else {
					if (this.status === 401) {
						window.location.reload();
					} else if (this.readyState === 3 && this.status >= 500) {
						MessageBox.error(this.response);
					}

				}
			};

			var oModel = new JSONModel(oData2);
			this.getView().byId('AddDialog').setModel(oModel);
		},
		changeCompany: function () {
			var allData = this.getView().byId('AddDialog').getModel().getData();

			oData2.SelectedBranch = 0;
			oData2.BranchCollection = [];

			oData2.BranchCollection = allData.Branchs.filter(function (a) {
				if (a.IdCompany == oData2.SelectedCompany || a.Id == 0) {
					return true;
				} else {
					return false;
				}
			});

		},
		save: function () {
			var viewTable = this.getView();
			var dateReg = /^\d{2}([./-])\d{2}\1\d{4}$/;
			var view = this.getView().byId('AddDialog');
			if (oData2.SelectedCompany == 0 || oData2.SelectedBranch == 0 || oData2.SelectedTipo == 0) {
				MessageBox.warning("Campo obrigatório sem preenchimento ou inválido");
				return;
			}

			if (!oData2.SelectedPeriod.match(dateReg)) {
				MessageBox.warning("Formato de período incorreto, use o seletor para definir o período");
				return;
			}
			if (!oData2.SelectedPeriod2.match(dateReg)) {
				MessageBox.warning("Formato de período incorreto, use o seletor para definir o período");
				return;
			}

			let newdate1 = new Date(oData2.SelectedPeriod.slice(6), oData2.SelectedPeriod.slice(3, 5), oData2.SelectedPeriod.slice(0, 2));
			let newdate2 = new Date(oData2.SelectedPeriod2.slice(6), oData2.SelectedPeriod2.slice(3, 5), oData2.SelectedPeriod2.slice(0, 2))
			if (newdate1.getTime() > newdate2.getTime()) {
				MessageBox.warning("Período inicial maior que final");
				return;
			}

			var xhttp = new XMLHttpRequest();
			xhttp.open("POST", "/nfprodutor/tiponf/add", true);
			xhttp.setRequestHeader('content-type', 'application/json');

			var company = utils.find(oData2.SelectedCompany, oData2.CompanyCollection);
			var branch = utils.find(oData2.SelectedBranch, oData2.BranchCollection);
			var tiponf = utils.find(oData2.SelectedTipo, oData2.TipoCollection);
			console.log(oData2.SelectedPeriod, oData2.SelectedPeriod2)
			var content = {
				company: company,
				branch: branch,
				period: oData2.SelectedPeriod,
				period2: oData2.SelectedPeriod2,
				tiponf: tiponf
			};

			xhttp.send(JSON.stringify(content));
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4 && this.status === 200) {
					var response = JSON.parse(this.responseText);

					if (response.result == 'Ok') {
						view.close();
						MessageToast.show('Adicionado com sucesso!');
						updateTable(viewTable);
					}
					console.log(response.result);
				} else {

					if (this.status === 401) {
						window.location.reload();
					} else if (this.readyState === 3 && this.status >= 500) {
						MessageBox.error(this.response);
					}

				}

			}
		},
		save2: function () {
			var viewTable = this.getView();
			var dateReg = /^\d{2}([./-])\d{2}\1\d{4}$/;
			var view = this.getView().byId('EditDialog');
			var data = this.getView().byId('EditDialog').getModel().getData();

			if (!data.DT_FIN.match(dateReg)) {
				MessageBox.warning("Formato de período incorreto, use o seletor para definir o período");
				return;
			}

			let newdate1 = new Date(data.DT_INI.slice(6), data.DT_INI.slice(3, 5), data.DT_INI.slice(0, 2));
			let newdate2 = new Date(data.DT_FIN.slice(6), data.DT_FIN.slice(3, 5), data.DT_FIN.slice(0, 2))
			if (newdate1.getTime() > newdate2.getTime()) {
				MessageBox.warning("Período inicial maior que final");
				return;
			}

			var xhttp = new XMLHttpRequest();
			xhttp.open("PATCH", "/nfprodutor/tiponf/edit", true);
			xhttp.setRequestHeader('content-type', 'application/json');

			var content = {
				company: data.EMPRESA,
				branch: data.FILIAL,
				period: data.DT_INI,
				period2: data.DT_FIN,
				tiponf: data.TIPO_NF
			};

			xhttp.send(JSON.stringify(content));
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4 && this.status === 200) {
					var response = JSON.parse(this.responseText);

					if (response.result == 'Ok') {
						view.close();
						MessageToast.show('Atualizado com sucesso!');
						updateTable(viewTable);
					}
					console.log(response.result);
				} else {

					if (this.status === 401) {
						window.location.reload();
					} else if (this.readyState === 3 && this.status >= 500) {
						MessageBox.error(this.response);
					}

				}

			}
		},
		onDelete: function (e) {
			var view = this.getView();
			var sPath = e.getSource('TIPOS').getBindingContext();
			var oModel = this.getView().byId('tableTipoNf').getModel();
			var oRowData = oModel.getProperty(sPath.sPath);
			console.log(oRowData);
			var xhttp = new XMLHttpRequest();
			xhttp.open("DELETE", "/nfprodutor/tiponf/delete", true);
			xhttp.setRequestHeader('content-type', 'application/json');

			var content = {
				company: oRowData.EMPRESA,
				branch: oRowData.FILIAL,
				period: oRowData.DT_INI,
				tiponf: oRowData.SYS_TIPO_NF
			};
			xhttp.send(JSON.stringify(content));
			xhttp.onreadystatechange = function () {
				if (this.readyState == 4 && this.status === 200) {
					var response = JSON.parse(this.responseText);

					if (response.result == 'Ok') {
						MessageToast.show('Removido com sucesso!');
						updateTable(view);

					}
				}
			}
		},
		add: function () {
			var month = (new Date().getMonth() + 1).toString();
			var year = (new Date().getFullYear()).toString();

			if (month.length < 2) {
				month = '0' + month;
			}
			var date = '01' + '/' + month + '/' + year;
			var date2 = '01' + '/' + month + '/' + year;

			oData2.NfidValue = "";
			oData2.SelectedCompany = 0;
			oData2.SelectedBranch = 0;
			oData2.SelectedTipo = 0;
			oData2.SelectedPeriod = date;
			oData2.SelectedPeriod2 = date2;

			var oModel = new JSONModel(oData2);
			this.getView().byId('AddDialog').setModel(oModel);

			var oDialog = this.byId("AddDialog");
			oDialog.open();
		},
		onEdit: function (e) {
			var view = this.getView();
			var sPath = e.getSource('TIPOS').getBindingContext();
			var oModel = this.getView().byId('tableTipoNf').getModel();
			var oRowData = oModel.getProperty(sPath.sPath);
		//	console.log(oRowData.DT_INI,oRowData.DT_FIN);
		var date1 = oRowData.DT_INI.slice(6) + '/' + oRowData.DT_INI.slice(4,6) + '/' + oRowData.DT_INI.slice(0,4);
		var date2 = oRowData.DT_FIN.slice(6) + '/' + oRowData.DT_FIN.slice(4,6) + '/' + oRowData.DT_FIN.slice(0,4);
			var obj = {
				EMPRESA: oRowData.EMPRESA,
				FILIAL: oRowData.FILIAL,
				DT_INI: date1,
				TIPO_NF: oRowData.SYS_TIPO_NF,
				DT_FIN: date2
			}

			var oModel = new JSONModel(obj);
			this.getView().byId('EditDialog').setModel(oModel);

			var oDialog = this.byId("EditDialog");
			oDialog.open();
		},
		onClose: function () {
			var oDialog = this.byId("AddDialog");
			oDialog.close();
		},
		onClose2: function () {
			var oDialog = this.byId("EditDialog");
			oDialog.close();
		}

	});

	function updateTable(view) {
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", "/nfprodutor/tiponf/alldata", true);
		xhttp.send();
		xhttp.onreadystatechange = function () {
			//console.log(this.responseText);
			if (this.readyState === 4 && this.status === 200) {
				var response = JSON.parse(this.responseText);
				var tiponf = {
					TIPOS: response.tiponf
				}
				var oModelTipoNf = new JSONModel(tiponf);
				view.byId('tableTipoNf').setModel(oModelTipoNf);

				//console.log(response.result);
			} else {

				if (this.status === 401) {
					window.location.reload();
				} else if (this.readyState === 3 && this.status >= 500) {
					MessageBox.error(this.response);
				}
			}

		}
	}
});