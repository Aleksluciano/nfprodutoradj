sap.ui.define([
	"nfprodutoradj_ui/BaseController",
	'sap/ui/model/json/JSONModel',
	'nfprodutoradj_ui/myLib/oData',
	'nfprodutoradj_ui/myLib/utils',
	'sap/m/MessageToast',
	"sap/m/MessageBox"
], function (BaseController, JSONModel, oData, utils, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("nfprodutoradj_ui.Page", {

		onTable: function () {
			this.getRouter().navTo("appTable");
		},

		onPress: function () {
			console.log("NfidValue", oData.NfidValue);
			var dateReg = /^\d{2}([./-])\d{2}\1\d{4}$/;
			var view = this.getView();
			if (oData.SelectedCompany == 0 || oData.SelectedBranch == 0 || oData.SelectedBranch2 == 0) {
				MessageBox.warning("Campo obrigatório sem preenchimento ou inválido");
				return;
			}
			if (oData.SelectedBranch > oData.SelectedBranch2) {
				MessageBox.warning("Valor inicial do range de estabelecimento maior que o final!");
				return;
			}
			if (!oData.SelectedPeriod.match(dateReg)) {
				MessageBox.warning("Formato de período incorreto, use o seletor para definir o período");
				return;
			}
			if (!oData.SelectedPeriod2.match(dateReg)) {
				MessageBox.warning("Formato de período incorreto, use o seletor para definir o período");
				return;
			}
 
			let newdate1 = new Date(oData.SelectedPeriod.slice(6), oData.SelectedPeriod.slice(3, 5), oData.SelectedPeriod.slice(0, 2));
			let newdate2 = new Date(oData.SelectedPeriod2.slice(6), oData.SelectedPeriod2.slice(3, 5), oData.SelectedPeriod2.slice(0, 2))
			if (newdate1.getTime() > newdate2.getTime()) {
				MessageBox.warning("Período inicial maior que final");
				return;
			}
			let diff = utils.daysBetween(newdate1, newdate2);
			console.log(diff);
			if (diff > 92) {
				MessageBox.warning("Período não deve ser maior que 3 meses");
				return;
			}
	
			oData.Results = [];
			var oModel = new JSONModel(oData);
			view.setModel(oModel);

				var oDialog = this.byId("BusyDialog");
			oDialog.open();

			var company = utils.find(oData.SelectedCompany, oData.CompanyCollection);
			var branch = utils.find(oData.SelectedBranch, oData.BranchCollection);
			var branch2 = utils.find(oData.SelectedBranch2, oData.BranchCollection2);
	

			var xhttp = new XMLHttpRequest();
				xhttp.open("POST", "/nfprodutor/change", true);
				xhttp.setRequestHeader('content-type', 'application/json');

			var content = {
				simulation: oData.Simulation,
				company: company,
				branch: branch,
				branch2: branch2,
				period: oData.SelectedPeriod,
				period2: oData.SelectedPeriod2,
				nfid: oData.NfidValue
			};
			xhttp.send(JSON.stringify(content));
			var msg = '';
			xhttp.onreadystatechange = function () {
				if (this.readyState === 4 && this.status === 200) {
				var response = JSON.parse(this.responseText);
					oDialog.close();

					var oTableCte = view.byId("tableChv");

					var t = 0;
					while (t < response.result.length) {
						if (response.result[t].STATUS && oData.Simulation) response.result[t].STATUS = 'Simulado';
						if (response.result[t].STATUS && !oData.Simulation) response.result[t].STATUS = 'Processado';
						if (!response.result[t].STATUS) response.result[t].STATUS = '';
						t++;
					}

					oTableCte.setModel(new JSONModel({
						CHV: response.result
					}));

				
					if (response.result.length > 0) {
						msg = 'Processado com sucesso!!';
					} else {
						msg = 'Nenhum registro encontrado';
					}

			
					MessageToast.show(msg);
				} else {
					oDialog.close();
					if (this.status === 401) {
						window.location.reload();
					} else if (this.readyState === 3 && this.status >= 500) {
						MessageBox.error(this.response);
					}
				}
			};

		},

		changeCompany: function () {
			var allData = this.getView().getModel().getData();

			oData.SelectedBranch = 0;
			oData.SelectedBranch2 = 0;
			oData.BranchCollection = [];
			oData.BranchCollection2 = [];

			oData.BranchCollection = allData.Branchs.filter(function (a) {
				if (a.IdCompany == oData.SelectedCompany || a.Id == 0) {
					return true;
				} else {
					return false;
				}
			});
			oData.BranchCollection2 = oData.BranchCollection;

		}

	});

});