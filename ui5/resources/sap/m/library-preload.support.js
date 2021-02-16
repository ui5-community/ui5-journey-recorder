/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Adds support rules of the sap.m library to the support infrastructure.
 */
sap.ui.predefine('sap/m/library.support',[
	"sap/ui/support/library",
	"./rules/Breadcrumbs.support",
	"./rules/Button.support",
	"./rules/CheckBox.support",
	"./rules/Dialog.support",
	"./rules/IconTabBar.support",
	"./rules/Image.support",
	"./rules/Input.support",
	"./rules/Link.support",
	"./rules/Panel.support",
	"./rules/Select.support",
	"./rules/SelectDialog.support",
	"./rules/Table.support",
	"./rules/Title.support",
	"./rules/Tokenizer.support"
],
	function(
		SupportLib,
		BreadcrumbsSupport,
		ButtonSupport,
		CheckBoxSupport,
		DialogSupport,
		IconTabBarSupport,
		ImageSupport,
		InputSupport,
		LinkSupport,
		PanelSupport,
		SelectSupport,
		SelectDialogSupport,
		TableSupport,
		TitleSupport,
		TokenizerSupport
	) {
	"use strict";

	return {
		name: "sap.m",
		niceName: "UI5 Main Library",
		ruleset: [
			BreadcrumbsSupport,
			ButtonSupport,
			CheckBoxSupport,
			DialogSupport,
			IconTabBarSupport,
			ImageSupport,
			InputSupport,
			LinkSupport,
			PanelSupport,
			SelectSupport,
			SelectDialogSupport,
			TableSupport,
			TitleSupport,
			TokenizerSupport
		]
	};

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Select control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Breadcrumbs.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity, // Low, Medium, High
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/**
	 * Checks if the Breadcrumbs control is placed in OverflowToolbar
	 */
	var oBreadcrumbsRule = {
		id : "breadcrumbsInOverflowToolbar",
		audiences: [Audiences.Control],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.34",
		title: "Breadcrumbs in OverflowToolbar",
		description: "The Breadcrumbs should not be placed inside an OverflowToolbar",
		resolution: "Place breadcrumbs in another container.",
		resolutionurls: [{
			text: "SAP Fiori Design Guidelines: Breadcrumbs",
			href: "https://experience.sap.com/fiori-design-web/breadcrumb/#guidelines"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Breadcrumbs")
				.forEach(function(oElement) {

					var sElementId = oElement.getId(),
						sElementName = oElement.getMetadata().getElementName();

					if (oElement.getParent() instanceof sap.m.OverflowToolbar) {
						oIssueManager.addIssue({
							severity: Severity.Medium,
							details: "Breadcrumbs '" + sElementName + "' (" + sElementId + ") is placed inside an OverflowToolbar.",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	return [oBreadcrumbsRule];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Button control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Button.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/**
	 *Checks, if a button consisting of only an icon has a tooltip (design guideline)
	 */
	var oButtonRule = {
		id : "onlyIconButtonNeedsTooltip",
		audiences: [Audiences.Control],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.28",
		title: "Button: Consists of only an icon, needs a tooltip",
		description: "A button without text needs a tooltip, so that the user knows what the button does",
		resolution: "Add a value to the tooltip property of the button",
		resolutionurls: [{
			text: "SAP Fiori Design Guidelines: Button",
			href: "https://experience.sap.com/fiori-design-web/button/#guidelines"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Button")
				.forEach(function(oElement) {
					if (oElement.getProperty("icon")
						&& !oElement.getProperty("text")
						&& !oElement.getAggregation("tooltip")) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.Medium,
							details: "Button '" + sElementName + "' (" + sElementId + ") consists of only an icon but has no tooltip",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	return [oButtonRule];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the CheckBox control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/CheckBox.support',["sap/ui/support/library"],
	function(SupportLib) {
		"use strict";

		var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
			Severity = SupportLib.Severity, // Low, Medium, High
			Audiences = SupportLib.Audiences; // Control, Internal, Application

		//**********************************************************
		// Rule Definitions
		//**********************************************************

		/**
		* Checks if the control is <code>enabled</code>, when the <code>editable</code> property is true.
		*/
		var oCheckBoxRule = {
			id : "checkBoxDisabledAndEditable",
			audiences: [Audiences.Control],
			categories: [Categories.Functionality],
			enabled: true,
			minversion: "-",
			title: "CheckBox: the control is editable, while the control is disabled",
			description: "Disabled control can`t be edited",
			resolution: "Either set enabled to true ot set editable to false",
			resolutionurls: [{
				text: "API Reference: sap.m.CheckBox",
				href: "https://sapui5.hana.ondemand.com/#/api/sap.m.CheckBox"
			}],
			check: function (oIssueManager, oCoreFacade, oScope) {
				oScope.getElementsByClassName("sap.m.CheckBox")
					.forEach(function(oElement) {
						var sElementId,
							sElementName;

						if (oElement.getEditable() && !oElement.getEnabled()) {
								sElementId = oElement.getId();
								sElementName = oElement.getMetadata().getElementName();

								oIssueManager.addIssue({
									severity: Severity.Low,
									details: "CheckBox '" + sElementName + "' (" + sElementId + ") is editable, but disabled",
									context: {
										id: sElementId
									}
								});
							}
						});
			}
		};

		return [oCheckBoxRule];

	}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Dialog control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Dialog.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	//shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	var oDialogRuleForJaws = {
		id: "dialogAriaDescribedBy",
		audiences: [Audiences.Application],
		categories: [Categories.Accessibility],
		enabled: true,
		minversion: "*",
		title: "Dialog: The content will not be read unless ariaDescribedBy is set",
		description: "When the Dialog is opened and ariaDescribedBy is not set, JAWS will read only the title of the Dialog and the focused element",
		resolution: "Add ariaDescribedBy for the Dialog, with value - IDs of the controls which are inside the Dialog content",
		resolutionurls: [{
			text: "API Referance: sap.m.Dialog #ariaDescribedBy",
			href: "https://ui5.sap.com/#/api/sap.m.Dialog/associations"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Dialog")
				.forEach(function(oElement) {
					if (!oElement.getAssociation("ariaDescribedBy")) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.High,
							details: "Dialog '" + sElementName + "' (" + sElementId + ") has no ariaDescribedBy association set",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	return [oDialogRuleForJaws];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the IconTabBar control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/IconTabBar.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	var oIconTabBarRuleHDesign = {
		id: "iconTabFilterWithHorizontalDesingShouldHaveIcons",
		audiences: [Audiences.Application],
		categories: [Categories.FioriGuidelines],
		enabled: true,
		minversion: "*",
		title: "IconTabBar: tab filters with horizontal design should always have icons",
		description: "According to Fiori guidelines tab filters with horizontal design shall always have icons",
		resolution: 'Add icons to all tabs \n Note: There is one exception - if "showAll" is set to true, icon may not be set',
		resolutionurls: [{
			text: "SAP Fiori Design Guidelines: IconTabBar",
			href: "https://experience.sap.com/fiori-design-web/icontabbar/#guidelines"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.IconTabFilter")
				.forEach(function(oElement) {
					if (oElement.getProperty("design") === sap.m.IconTabFilterDesign.Horizontal
						&& !oElement.getProperty("icon")
						&& !oElement.getProperty("showAll")) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.High,
							details: "IconTabFilter '" + sElementName + "' (" + sElementId + ") consists only of text, icon needs to be set",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	var oIconTabBarRuleIcons = {
		id: "iconTabBarIconsRule",
		audiences: [Audiences.Application],
		categories: [Categories.FioriGuidelines],
		enabled: true,
		minversion: "*",
		title: "IconTabBar: Icons rule for tabs",
		description: 'Either all tabs should have icons or none of them. Note: There is one exception - There is one exception - if "showAll" is set to true, icon may not be set',
		resolution: "Make all tabs the same type",
		resolutionurls: [{
			text: "SAP Fiori Design Guidelines: IconTabBar",
			href: "https://experience.sap.com/fiori-design-web/icontabbar/#guidelines"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.IconTabBar")
				.forEach(function(oElement) {
					var aIconTabFilters = oElement.getItems();
					var bHasIconFirstTab;
					var bHasIconSomeTab;
					var bHasDifference = false;
					var bFirstCheckedTab = true;

					for (var index = 0; index < aIconTabFilters.length; index++) {
						if (aIconTabFilters[index].isA('sap.m.IconTabFilter') && !aIconTabFilters[index].getProperty("showAll")) {
							if (bFirstCheckedTab) {
								bHasIconFirstTab = !!aIconTabFilters[index].getIcon();
								bFirstCheckedTab = false;
							} else {
								bHasIconSomeTab = !!aIconTabFilters[index].getIcon();
								if (bHasIconFirstTab !== bHasIconSomeTab) {
									bHasDifference = true;
									break;
								}
							}
						}
					}

					if (bHasDifference) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.High,
							details: "In one IconTabBar '" + sElementName + "' (" + sElementId + ") all tabs should have icons or all tabs shouldn't have icons",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	var oIconTabBarRuleIconsLongCount = {
		id: "iconTabFilterWithIconsAndLongCount",
		audiences: [Audiences.Application],
		categories: [Categories.FioriGuidelines],
		enabled: true,
		minversion: "*",
		title: "IconTabBar: IconTabFilters with icons and long count number should have horizontal design",
		description: "Note: All filters in one IconTabBar should have the same design",
		resolution: "Change the design property to horizontal for all tabs in the IconTabBar",
		resolutionurls: [{
			text: "SAP Fiori Design Guidelines: IconTabBar",
			href: "https://experience.sap.com/fiori-design-web/icontabbar/#guidelines"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.IconTabFilter")
				.forEach(function(oElement) {
					if (oElement.getProperty("design") === sap.m.IconTabFilterDesign.Vertical
						&& oElement.getProperty("icon")
						&& oElement.getProperty("count").length > 4) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.High,
							details: "IconTabFilter '" + sElementName + "' (" + sElementId + ") has long count and should have horizontal design",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};


	return [oIconTabBarRuleHDesign, oIconTabBarRuleIcons, oIconTabBarRuleIconsLongCount];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Image control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Image.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity, // Low, Medium, High
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/**
	 * Warns about the impact of the <code>densityAware</code> property of <code>sap.m.Image</code>
	 */
	var oImageRule = {
		id : "densityAwareImage",
		audiences: [Audiences.Control],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.28",
		title: "Image: Density awareness enabled",
		description: "One or more requests will be sent trying to get the density perfect version of the image. These extra requests will impact performance, if the corresponding density versions of the image do not exist on the server",
		resolution: "Either ensure the corresponding density versions of the image exist on the backend server or disable density awareness",
		resolutionurls: [{
			text: "API Refrence for sap.m.Image",
			href: "https://sapui5.hana.ondemand.com/#/api/sap.m.Image"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Image")
				.forEach(function(oElement) {
					if (oElement.getDensityAware()) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.Low,
							details: "Image '" + sElementName + "' (" + sElementId + ") is density aware",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	return [oImageRule];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the List, Table and Tree controls of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Input.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/**
	 * Input field needs to have a label association
	 */
	var oInputNeedsLabelRule = {
		id: "inputNeedsLabel",
		audiences: [Audiences.Control],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.28",
		title: "Input field: Missing label",
		description:"An input field needs a label",
		resolution: "Define a sap.m.Label for the input field in the xml view and set the labelFor property to this input field Id.",
		resolutionurls: [{
			text: "SAP Fiori Design Guidelines: Input field",
			href:"https://experience.sap.com/fiori-design-web/input-field/#guidelines"
		}],
		check: function (issueManager, oCoreFacade, oScope) {

			var aInputIds = oScope.getElementsByClassName("sap.m.Input")
				.map(function(oInput) {
					return oInput.getId();
				});

			oScope.getElementsByClassName("sap.m.Label")
				.forEach(function (oLabel){
					var sLabelFor = oLabel.getLabelFor();
					if (aInputIds.indexOf(sLabelFor) > -1) {
						var iIndex = aInputIds.indexOf(sLabelFor);
						aInputIds.splice(iIndex, 1);
					}
				});

			if (aInputIds.length > 0) {
				aInputIds.forEach(function(sInputId) {
					issueManager.addIssue({
						severity: Severity.Medium,
						details: "Input field" + " (" + sInputId + ") is missing a label.",
						context: {
							id: sInputId
						}
					});
				});
			}
		}
	};

	return [oInputNeedsLabelRule];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Link control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Link.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/**
	 *Checks, if a link with attached press handler has no href property set
	 */
	var oLinkRule = {
		id : "linkWithPressHandlerNoHref",
		audiences: [Audiences.Control],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.28",
		title: "Link: If a press handler is attached, the href property should not be set",
		description: "If a JavaScript action should be triggered using the press event, the href property should not be set",
		resolution: "Remove the href property of the link",
		resolutionurls: [{
			text: "API Reference: sap.m.Link",
			href: "https://sapui5.hana.ondemand.com/#/api/sap.m.Link"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Link")
				.forEach(function(oElement) {
					if (oElement.getProperty("href")
						&& oElement.mEventRegistry.hasOwnProperty("press")) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.Medium,
							details: "Link '" + sElementName + "' (" + sElementId + ") has both press handler attached and href property set",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	return [oLinkRule];

}, true);
/* eslint-disable linebreak-style */
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Panel control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Panel.support',["sap/ui/support/library"],
	function(SupportLib) {
		"use strict";
		// shortcuts
		var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
			Severity = SupportLib.Severity,	// Hint, Warning, Error
			Audiences = SupportLib.Audiences; // Control, Internal, Application

		//**********************************************************
		// Rule Definitions
		//**********************************************************

		/**
		 *Checks if a panel has a title or a header toolbar with a title
		 */
		var oPanelNeedHeaderRule = {
			id : "panelWithheaderTextOrWithHeaderToolbarWithTitle",
			audiences: [Audiences.Control],
			categories: [Categories.Usability],
			enabled: true,
			minversion: "1.28",
			title: "Panel: Header text is missing",
			description: "According to the SAP Fiori Guidelines, a panel needs a header text or a header toolbar.",
			resolution: "Add a title directly to the panel or use a headerToolbar with title element",
			resolutionurls: [{
				text: "SAP Fiori Design Guidelines: Panel",
				href: "https://experience.sap.com/fiori-design-web/panel/#components",
				text2: "Explored Sample",
				href2: "https://openui5beta.hana.ondemand.com/#/sample/sap.m.sample.Panel/preview"
			}],
			check: function (oIssueManager, oCoreFacade, oScope) {
				oScope.getElementsByClassName("sap.m.Panel")
					.forEach(function(oElement) {
						if (!jQuery.isEmptyObject(oElement.getAggregation("Title text"))
							|| !jQuery.isEmptyObject(oElement.getAggregation("Toolbar"))) {

							var sElementId = oElement.getId(),
								sElementName = oElement.getMetadata().getElementName();

							oIssueManager.addIssue({
								severity: Severity.Medium,
								details: "Panel '" + sElementName + "' (" + sElementId + ") does not have a title or a toolbar aggregation",
								context: {
									id: sElementId
								}
							});
						}
					});
			}
		};

		return [oPanelNeedHeaderRule];

	}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Select control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Select.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity, // Low, Medium, High
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	// const
	var DEFAULT_MODEL_SIZE_LIMIT = 100;

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/**
	 *Checks if the 'items' aggregation binding of sap.m.Select is limited to 100 items
	 */
	var oSelectRule = {
		id : "selectItemsSizeLimit",
		audiences: [Audiences.Control],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.28",
		title: "Select: Items have size limit of 100",
		description: "The 'items' model imposes a default size limit of 100",
		resolution: "Use the sap.ui.model.Model.prototype.setSizeLimit to adjust the size limit of the 'items' model if you expect more than 100 items",
		resolutionurls: [{
			text: "API Reference for sap.ui.model.Model",
			href: "https://sapui5.hana.ondemand.com/#/api/sap.ui.model.Model"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Select")
				.forEach(function(oElement) {

					var oBinding = oElement.getBinding("items"),
						oModel = oBinding && oBinding.oModel;

					if (oModel && (oModel.iSizeLimit === DEFAULT_MODEL_SIZE_LIMIT)) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.Low,
							details: "Select '" + sElementName + "' (" + sElementId + ") model has a default limit of 100 items",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};

	return [oSelectRule];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the SelectDialog control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/SelectDialog.support',["sap/ui/support/library"],
	function(SupportLib) {
		"use strict";

		// shortcuts
		var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
			Severity = SupportLib.Severity,	// Hint, Warning, Error
			Audiences = SupportLib.Audiences; // Control, Internal, Application

		//**********************************************************
		// Rule Definitions
		//**********************************************************

		/**
		 *Checks, if a selectDialog does not contain inactive list items
		 */
		var oSelectDialogNonActiveItem = {
			id : "noContainInactiveItemsInSelectDialog",
			audiences: [Audiences.Control],
			categories: [Categories.Usability],
			enabled: true,
			minversion: "1.28",
			title: "SelectDialog: Select Dialog should not contain inactive items",
			description: "All items in a Select Dialog should be interactable/selectable",
			resolution: "Make all items interactable/selectable or remove the inactive ones",
			resolutionurls: [{
				text: "SAP Fiori Design Guidelines: SelectDialog",
				href: "https://experience.sap.com/fiori-design-web/select-dialog/#behavior-and-interaction"
			}],
			check: function (oIssueManager, oCoreFacade, oScope) {
				oScope.getElementsByClassName("sap.m.SelectDialog")
					.forEach(function(oElement) {
						var aListItems = oElement.getItems(),
							sListOfInactiveItems = "";

						aListItems.forEach(function(oListItem){
							if (oListItem.getType() === sap.m.ListType.Inactive) {
								var sListItemId = oListItem.getId(),
									sListItemName = oListItem.getMetadata().getElementName();

								sListOfInactiveItems += sListItemName + " (" + sListItemId + "); ";

							}
						});

						if (sListOfInactiveItems) {
							var sElementId = oElement.getId(),
								sElementName = oElement.getMetadata().getElementName();

							oIssueManager.addIssue({
								severity: Severity.Medium,
								details: "SelectDialog '" + sElementName + "' (" + sElementId + ") contains one or more items of type 'Inactive' : " + sListOfInactiveItems,
								context: {
									id: sElementId
								}
							});
						}
					});
			}
		};

		return [oSelectDialogNonActiveItem];

	}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Link control of sap.m Table.
 */
sap.ui.predefine('sap/m/rules/Table.support',["sap/ui/support/library"],
	function(SupportLib) {
		"use strict";

		// shortcuts
		var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
			Severity = SupportLib.Severity,	// Hint, Warning, Error
			Audiences = SupportLib.Audiences; // Control, Internal, Application

		//**********************************************************
		// Rule Definitions
		//**********************************************************

		/**
		 *Checks, if a link with attached press handler has no href property set
		 */
		var oTableRule = {
			id: "definingColumnWidths",
			audiences: [Audiences.Control],
			categories: [Categories.Usability],
			enabled: true,
			minversion: "1.28",
			title: "Table: Defining column widths",
			description: "Defining column widths",
			resolution: "Configure at least 1 column with width=auto or do not configure the width at all",
			resolutionurls: [{
				text: "Documentation: Defining Column Widths",
				href: "https://sapui5.hana.ondemand.com/#/topic/6f778a805bc3453dbb66e246d8271839"
			}],
			check: function (oIssueManager, oCoreFacade, oScope) {
				var count = 0;
				oScope.getElementsByClassName("sap.m.Table").forEach(function (oTable) {
					var aColumn = oTable.getColumns();
					aColumn.forEach(function (oColumn) {
						var sWidth = oColumn.getWidth();
						if (sWidth !== "auto" || sWidth !== "") {
							count++;
						}
					});
					if (count === aColumn.length) {
						oIssueManager.addIssue({
							severity: Severity.Medium,
							details: "All the columns are configured with a width. This should be avoided.",
							context: {
								id: oTable.getId()
							}
						});
					}
				});
			}
		};

		return [oTableRule];
	}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Title control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Title.support',["sap/ui/support/library"],
	function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	var oTitleRule = {
		id: "titleLevelProperty",
		audiences: [Audiences.Internal],
		categories: [Categories.FioriGuidelines],
		enabled: true,
		minversion: "*",
		title: "Title: It is recommended to set the level property",
		description: "Level defines the semantic level of the title. This information is used by assistive technologies like screen readers to create a hierarchical site map for faster navigation.",
		resolution: "Add value to the level property",
		resolutionurls: [
		{
			text: "SAP Fiori Design Guidelines: Title",
			href: "https://experience.sap.com/fiori-design-web/title/#guidelines"
		},
		{
			text: "API Reference: Title",
			href: "https://ui5.sap.com/#/api/sap.m.Title/controlProperties"
		}],
		check: function (oIssueManager, oCoreFacade, oScope) {
			oScope.getElementsByClassName("sap.m.Title")
				.forEach(function(oElement) {
					if (oElement.getProperty("level") === sap.ui.core.TitleLevel.Auto) {

						var sElementId = oElement.getId(),
							sElementName = oElement.getMetadata().getElementName();

						oIssueManager.addIssue({
							severity: Severity.Low,
							details: "Title '" + sElementName + "' (" + sElementId + ") has no level property set",
							context: {
								id: sElementId
							}
						});
					}
				});
		}
	};


	return [oTitleRule];

}, true);
/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines support rules of the Tokenizer control of sap.m library.
 */
sap.ui.predefine('sap/m/rules/Tokenizer.support',["sap/ui/support/library"],
function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		Severity = SupportLib.Severity,	// Hint, Warning, Error
		Audiences = SupportLib.Audiences; // Control, Internal, Application

	var oTokenizerParentRule = {
			id : "tokenizerParentRule",
			audiences: [Audiences.Application],
			categories: [Categories.Usage],
			enabled: true,
			minversion: "1.28",
			title : "Tokenizer: Tokenizer parent control",
			description : "The tokenizer can only be used as part of MultiComboBox, MultiInput or ValueHelpDialog.",
			resolution : "Do not use the Tokenizer control standalone.",
			check : function(oIssueManager, oCoreFacade, oScope) {
				var oTokenizers = oScope.getElementsByClassName("sap.m.Tokenizer"),
					bParent,
					sParentControlName,
					oParent;
				oTokenizers.forEach(function (oTokenizer) {
					oParent = oTokenizer.getParent();
					sParentControlName = oParent && oParent.getMetadata().getName();
					bParent = oParent && sParentControlName === "sap.m.MultiInput" ||
								sParentControlName === "sap.m.MultiComboBox" ||
								// Value Help Dialog uses the tokenizer in a vertical layout
								(sParentControlName === "sap.ui.layout.VerticalLayout" &&
								oParent.hasStyleClass("compVHTokenizerHLayout"));

					if (!bParent) {
						oIssueManager.addIssue({
							severity: Severity.High,
							details: "Tokenizer with id: " + oTokenizer.getId() + " is not inside a MultiComboBox, MultiInput or ValueHelpDialog",
							context: {
								id: oTokenizer.getId()
							}
						});
					}
				});
			}
		};

	return [oTokenizerParentRule];
}, true);
//# sourceMappingURL=library-preload.support.js.map