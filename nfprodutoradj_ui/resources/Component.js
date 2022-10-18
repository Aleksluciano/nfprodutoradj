sap.ui.define(['sap/ui/core/UIComponent',
		'sap/ui/model/json/JSONModel',
		'nfprodutoradj_ui/myLib/oData',
		'nfprodutoradj_ui/myLib/utils',
		'sap/m/MessageBox'
	],
	function (UIComponent, JSONModel, oData, utils, MessageBox) {
		"use strict";
		const newoData = utils.deepClone(oData);
		const date2 = utils.deepClone(oData.SelectedPeriod);

		return UIComponent.extend("nfprodutoradj_ui.Component", {

			metadata: {
				manifest: "json"
			},

			init: function () {
				UIComponent.prototype.init.apply(this, arguments);
				sap.ui.getCore().getConfiguration().setLanguage("pt-BR");
				jQuery.sap.includeStyleSheet("css/style.css");
		

				var xhttp = new XMLHttpRequest();
				var view = this;

				oData.Simulation = true;
				oData.StateList = {
					highlight: "Success",
					info: "Processado"
				};
				oData.CSV = [];
				oData.Results = [];
				oData.Companies = [];
				oData.NfidValue = "";
				oData.Branchs = [];
				oData.SelectedCompany = 0;
				oData.SelectedBranch = 0;
				oData.SelectedBranch2 = 0;
				oData.SelectedPeriod = newoData.SelectedPeriod;
				oData.SelectedPeriod2 = date2;
				oData.CompanyCollection = [];
				oData.BranchCollection = [];

				xhttp.open("GET", "/nfprodutor/data", true);
				xhttp.send();
				xhttp.onreadystatechange = function () {
					if (this.readyState === 4 && this.status === 200) {
						var response = JSON.parse(this.responseText);
						oData.CompanyCollection = response.emp;
						oData.Companies = response.emp;
						oData.BranchCollection = response.estab;
						oData.Branchs = response.estab;
						oData.BranchCollection2 = JSON.parse(JSON.stringify(response.estab));

						var oModel = new JSONModel(oData);
						view.setModel(oModel);

					} else {
						if (this.status === 401) {
							window.location.reload();
						} else if (this.readyState === 3 && this.status >= 500) {
							MessageBox.error(this.response);
						}

					}
				};

				var oModel = new JSONModel(oData);
				this.setModel(oModel);
		       this.getRouter().initialize();
			}

		});

	});