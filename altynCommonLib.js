// TODO
//	1. Remove jquery dependency (e.g. $.ajax, $.each)
//	2. Remove React dependency (e.g. PropTypes)

import React from 'react';

// TODO разобраться с headers

function getAjaxRequest(url, type, dataType, successFn, errorFn, data){
	if(window.isMobile && _store._networkFeature){
		return getNetworkFeatureAjaxRequest(url, type, dataType, successFn, errorFn, data)
	}
	else {
		return getJqueryAjaxRequest(url, type, dataType, successFn, errorFn, data)
	}
}

var callStack = [];

function getNetworkFeatureAjaxRequest(url, type, contentType, successFn, errorFn, data){

	var params = (!window.isAndroid)
		? `{"url": "${url}", "type": "${type}", "contentType": "${contentType}", "data": ` + (data?data:'{}') + '}'
		: "{'url': '" + url + "','type': '" + type + "','contentType': '" + contentType + "','data': '"+ data +"'}";

	function success (data){
		successFn(data);
		callStack.shift();
		nextCall();
	}
	function error (data){
		errorFn(data);
		callStack.shift();
		nextCall();
	}
	function nextCall(){
		var call = callStack[0];
		if(call){
			_store._networkFeature.getAJAX(call.params).then(
				function(data){call.successFn(data);},
				function(data){call.errorFn(data);}
			);
		}
	}
	callStack.push({params:params, successFn:success, errorFn:error})
	if (callStack.length == 1){
		nextCall();
	}
}
function getJqueryAjaxRequest(url, type, contentType, successFn, errorFn, data){
	let obj = {
		statusCode: {
			302: function(jqXHR, textStatus, errorThrown) {
				if (this.crossDomain === false) {
					// We got redirect from our server. Trust it to be logout redirect.
					window.location.reload();
				}
			}
		}
	};

	(function(send) {
		XMLHttpRequest.prototype.send = function() {
			this.addEventListener("readystatechange", function() {
				if (this.responseURL && this.readyState == 4 && ( (this.responseURL.indexOf('login.sbr.at-consulting.ru') > -1)
						|| (this.responseURL.indexOf('login.altyn-i.kz') > -1)
						|| (this.responseURL.indexOf('uat-login.altyn-i.kz') > -1))) {
					console.log('responseURL', this.responseURL);
					location.href = "/portalserver/altyn/inner_page";
				}
			}, false);
			send.apply(this, arguments);
		};
	})(XMLHttpRequest.prototype.send);

	switch (type){
		case "GET":
		case "PUT":
			Object.assign(obj, {url: url, type: type, success: successFn, error: errorFn});
			break;
		case "POST":
		case "DELETE":
			Object.assign(obj, {url: url, type: type, contentType: contentType, data: data, success: successFn, error: errorFn});
			break;
		default:
			console.error("Type " + type + "not supported!");
	}
	return $.ajax(obj);
}

//	'Empty' function
function noop() {
}

//clear console.log for prod
if (!window.altyn.debugmode) {
	if(!window.console) window.console = {};

	var methods = ["log", "debug", "warn", "info"];

	for(var i=0;i<methods.length;i++){
		window.console[methods[i]] = function(){};
	}
}

//	Function that returns first argument, unchanged
function fallThrough(arg) {
	return arg;
}

//	Function that makes a list if arg is not array, for streamlining APIs
function makeList(arg) {
	if (typeof(arg) === "undefined" || arg === null) return null;

	return (Array.isArray(arg)) ? arg : [arg];
}

//>> getLocale()
//<< "ru-RU"
var getLocale = (typeof(document) !== "undefined")
	? function () {
	return document.cookie.replace(/(?:(?:^|.*;\s*)altyn\.locale\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "ru-RU";
}
	: function () {
	return "ru-RU";
}

var getDesign = (typeof(document) !== "undefined")
	? function () {
	return document.cookie.replace(/(?:(?:^|.*;\s*)altyn\.design\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "design_1";
}
	: function () {
	return "design_1";
}

var getUserAgent = (function () {
	var obj = {},
		ua = navigator.userAgent;

	if( ua.match(/Android/i)) {
		obj.os = "android"
	} else if (ua.match(/iPhone/i)
		|| ua.match(/iPad/i)
		|| ua.match(/iPod/i)) {
		obj.os = "ios"
	} else {
		obj.os = "desktop"
	}

	if ( ua.match(/MSIE/)) {
		obj.browser = "ie"
	} else if (ua.match(/Firefox/)) {
		obj.browser = "firefox"
	} else if (ua.match(/Opera/)) {
		obj.browser = "opera"
	} else if (ua.match(/Chrome/)) {
		obj.browser = "chrome"
	} else if (ua.match(/Safari/)) {
		obj.browser = "safari"
	}

	obj.ua = navigator.userAgent;

	return obj;

})();

// (Not in lib; temporary function) To obfuscate card number.
function hiddenCardNumber(argument) {
	return argument.slice(0, 7) + ' **** ' + argument.slice(-4);
}

//>> toTitleCase("иванов петров")
//<< "Иванов Петров"
function toTitleCase(str) {
	return str.replace(/[а-яА-ЯёЁa-zA-Z]\S*/g, (txt) => {
		return txt.charAt(0).toLocaleUpperCase() + txt.substr(1).toLowerCase()
	})
}

const numberSeparator = {
	'ru-RU': {
		decimalSeparator: '.',
		integerSeparator: ' '
	},
	'en-US': {
		decimalSeparator: ',',
		integerSeparator: ' '
	},
	'kk-KZ': {
		decimalSeparator: '.',
		integerSeparator: ' '
	},
	'default': {
		decimalSeparator: '.',
		integerSeparator: ' '
	}
};
//>> formatNumber(1045.9)
//<< "1 045.90"
function formatNumber(number, precision = 2) {
	var number = toPrecision(+number, precision)

	var string = "" + number,
		separators = numberSeparator[getLocale()] || numberSeparator["default"],
		decimalSeparator = separators["decimalSeparator"],
		integerSeparator = separators["integerSeparator"];

	var floatPoint = (string.indexOf(".") !== -1) ? (string.indexOf(".")) : (string.length + 1),
		leftPart = string.slice(0, (floatPoint)),
		rightPart = string.slice(floatPoint + 1),
		leftResult = leftPart.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, "$1" + integerSeparator),
		total = "";

	if (rightPart.length === 0) {
		rightPart = "00"
	} else if (rightPart.length === 1) {
		rightPart = rightPart + "0";
	}

	rightPart = rightPart.slice(0, precision);
	if (precision === 0) {
		decimalSeparator = "";
	}

	total = "" + leftResult + decimalSeparator + rightPart;

	return total;
}

function toPrecision(num, precision = 2) {

	if (typeof(num) !== "number" || typeof(precision) !== "number") {
		throw new TypeError("Non-number(s) provided to 'toPrecision' function")
	}
	return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
}
// http://stackoverflow.com/a/2880929
//>> getUrlParams() // at example.com?a=12&b&c=hey%20
//<< {a: "12", b: "", c: "hey "}
var getUrlParams = function (query = window.location.search.substring(1)) {
	var match,
		pl = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) {
			return decodeURIComponent(s.replace(pl, " "));
		};

	var urlParams = {};
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);

	return urlParams;
};
var createQueryString = function (paramMap) {
	let params = [];
	for (let key in paramMap) {
		let value = paramMap[key];
		if (typeof(value) === "string" || typeof(value) === "number") {
			params.push(key + "=" + value);
		}
	}
	let str = params.join("&");
	return (str.length) ? "?" + str : "";
}


// Google Analytics code for getting cookies
//>> getCookie("altyn.debug.pingInterval")
//<< "3000"
var getCookie = function c(a) {
	var d = [],
		e = document.cookie.split(";");
	a = RegExp("^\\s*" + a + "=\\s*(.*?)\\s*$");
	for (var b = 0; b < e.length; b++) {
		var f = e[b].match(a);
		f && d.push(f[1])
	}
	return d
}

function sortArrayByProperty(arr, prop) {
	let sortFunc =  (property) => {
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a,b) {
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		}
	}

	return arr.sort(sortFunc(prop))
}

//
//	Translate stuff. You can configure global translate with
//		some function (e.g. angular translate), and get translator function
//		that utilizes some passed translations in addition to global translate.
//
let _translate = fallThrough;
function configureTranslate(newTranslate) {
	if (typeof(newTranslate) !== "function") {
		throw new Error("Not valid function passed to configureTranslate");
	}

	_translate = newTranslate;
}
function translate(toTranslate) {
	//console.log("toTranslate", toTranslate)
	return _translate(toTranslate);
}
function getTranslatorWithAdditional(translations) {
	//console.log("libs translations" , translations)

	return function (toTranslate) {
		let locale = getLocale();
		return (Object.keys(translations).length != 0
		&& translations[locale][toTranslate]) ? translations[locale][toTranslate] : translate(toTranslate);
	}
}

//
//	Card number validity
//	Allows for different types of cards (configurable only in lib yet)

//>> isCardNumberValid("1111111111111111")
//<< false
//

//https://github.com/PawelDecowski/jQuery-CreditCardValidator/
let card_types = [
	{
		name: 'amex',
		niceName: "American Express",
		pattern: /^3[47]/,
		valid_length: [15]
	}, {
		name: 'diners_club_carte_blanche',
		pattern: /^30[0-5]/,
		valid_length: [14]
	}, {
		name: 'diners_club_international',
		pattern: /^36/,
		valid_length: [14]
	}, {
		name: 'jcb',
		pattern: /^35(2[89]|[3-8][0-9])/,
		valid_length: [16]
	}, {
		name: 'laser',
		pattern: /^(6304|670[69]|6771)/,
		valid_length: [16, 17, 18, 19]
	}, {
		name: 'visa_electron',
		niceName: "Visa Electron",
		pattern: /^(4026|417500|4508|4844|491(3|7))/,
		valid_length: [16]
	}, {
		name: 'visa',
		niceName: "Visa Classic",
		pattern: /^4/,
		valid_length: [16]
	}, {
		name: 'mastercard',
		niceName: "MasterCard Standard",
		pattern: /^5[1-5]/,
		valid_length: [16]
	}, {
		name: 'maestro',
		niceName: "MasterCard Maestro",
		pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
		valid_length: [12, 13, 14, 15, 16, 17, 18, 19]
	}, {
		name: 'discover',
		pattern: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/,
		valid_length: [16]
	}
];

function getCardType(cardNumber) {
	if (typeof(cardNumber) !== "string") {
		throw new Error("getCardType('cardNumber') - 'cardNumber' should be string");
	}
	for (let i in card_types) {
		if (cardNumber.match(card_types[i].pattern)) {
			return card_types[i];
		}
	}
	return null;
}
function isCardNumberValid(cardNumber) {
	if (typeof(cardNumber) !== "string") {
		throw new Error("isCardNumberValid('cardNumber') - 'cardNumber' should be string");
	}

	//Type
	let cardType = getCardType(cardNumber);
	if (!cardType) {
		return false;
	}

	//Length
	if (cardType.valid_length.indexOf(cardNumber.length) === -1) {
		return false;
	}

	// Luhn
	//https://sites.google.com/site/abapexamples/javascript/luhn-validation
	let ca, sum = 0, mul = 1;
	let len = cardNumber.length;
	while (len--) {
		ca = parseInt(cardNumber.charAt(len), 10) * mul;
		sum += ca - (ca > 9) * 9;// sum += ca - (-(ca>9))|9
		// 1 <--> 2 toggle.
		mul ^= 3; // (mul = 3 - mul);
	}
	;
	return (sum % 10 === 0) && (sum > 0);
}


//
//	Debouncer - calls callback with delay, if debouncer is
//		repeatedly called - reinitialize delay
//
//	Usage:
//	_debounce("internalTransfer.getSpecificData", () => {
//		$.ajax({
//			url: "someUrl",
//			success: (result) => {
//				//...do something with result.
//			}
//		});
//	});
//
function isTimeout(smth) { //Simplistic check
	return (typeof(smth) === "number");
}
function isAbortable(smth) {
	return (smth && typeof(smth["abort"]) === "function");
}
let _debounceCalls = {};
function _debounce(callerId, callback = noop, interval = 300) {
	if (typeof(callerId) !== "string" || !callerId.length) {
		throw new TypeError("Invalid 'callerId' supplied to _debounce");
	}
	if (typeof(interval) !== "number" || interval < 10) {
		throw new TypeError("Invalid 'interval' supplied to _debounce");
	}
	if (callback === noop) {
		console.warn("No 'callback' supplied to _debounce; using noop");
	}


	let currCall = _debounceCalls[callerId];
	if ( isTimeout(currCall) ) {
		window.clearTimeout(currCall);
	}
	else if ( isAbortable(currCall) ) {
		currCall.abort();
	}

	_debounceCalls[callerId] = window.setTimeout(()=>{
		let resp = callback();
		if (isAbortable(resp)) {
			_debounceCalls[callerId] = resp;
		}
		else {
			delete _debounceCalls[callerId];
		}
	}, interval);
}

/*

 Data stores


 */
//
//	urlResolver used to resolve portal placeholders, incl. "$(resourceRoot)" for
//		mobile application.
//
let _store = {
	entities: {},
	_generated: false
};
let _entitiesConfig = [
	{
		"name": "cards",
		"url": "$(contextRoot)/services/rest/esb/cards",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/cards.json",
/*		"expected": React.PropTypes.shape({
			customerCardList: React.PropTypes.shape({
				card: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						blockFlag: React.PropTypes.string.isRequiredNonEmpty,
						cardCode: React.PropTypes.string, // Card can be without number if not emitted
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						embossedName: React.PropTypes.string.isRequiredNonEmpty,
						fromDate: React.PropTypes.number, // Card can be without fromDate
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string,//.isRequiredNonEmpty, // not really required, human-readable text
						tariffId: React.PropTypes.string.isRequiredNonEmpty,
						toDate: React.PropTypes.number, // Card can be without toDate
						account: React.PropTypes.shape({
							balance: React.PropTypes.number.isRequired,
							branchCode: React.PropTypes.string,
							branchName: React.PropTypes.string,
							currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
							currName: React.PropTypes.string,
							customerId: React.PropTypes.string.isRequiredNonEmpty,
							firstname: React.PropTypes.string,
							iban: React.PropTypes.string.isRequiredNonEmpty,
							lastMove: React.PropTypes.number,
							lastname: React.PropTypes.string,
							operBalance: React.PropTypes.number.isRequired,
							productCode: React.PropTypes.string.isRequiredNonEmpty,
							productName: React.PropTypes.string,
							regDate: React.PropTypes.number,
							status: React.PropTypes.string.isRequiredNonEmpty,
							statusCode: React.PropTypes.string,//.isRequiredNonEmpty, // not really required, human-readable text
							title: React.PropTypes.string,
							type: React.PropTypes.string
						}).isRequired
					}).isRequired
				).isRequired//NonEmpty
			}).isRequired
		}).isRequired, */
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				cardData: React.PropTypes.shape({
					blockFlag: React.PropTypes.string.isRequiredNonEmpty,
					cardCode: React.PropTypes.string, /* Card can be without number if not emitted */
					customerId: React.PropTypes.string.isRequiredNonEmpty,
					embossedName: React.PropTypes.string.isRequiredNonEmpty,
					fromDate: React.PropTypes.number, /* Card can be without fromDate */
					status: React.PropTypes.string.isRequiredNonEmpty,
					statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
					tariffId: React.PropTypes.string.isRequiredNonEmpty,
					toDate: React.PropTypes.number, /* Card can be without toDate */
					account: React.PropTypes.shape({
						balance: React.PropTypes.number.isRequired,
						branchCode: React.PropTypes.string.isRequiredNonEmpty,
						branchName: React.PropTypes.string,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currName: React.PropTypes.string,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						firstname: React.PropTypes.string,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						lastMove: React.PropTypes.number,
						lastname: React.PropTypes.string,
						operBalance: React.PropTypes.number.isRequired,
						productCode: React.PropTypes.string.isRequiredNonEmpty,
						productName: React.PropTypes.string,
						regDate: React.PropTypes.number,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
						title: React.PropTypes.string,
						type: React.PropTypes.string
					}).isRequired
				}).isRequired,
				cardType: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired,
		"dataTransformer": function (data) {
			let result = data//["customerCardList"]["card"]
				.filter(function (cardWrapped) {
					return (cardWrapped["cardData"]["statusCode"] === "DELIVERED");
				})
				.map(function (cardWrapped) {
					var card = cardWrapped["cardData"],
						type = cardWrapped["cardType"];
					return {
						balanceTrue: card.account.balance,
						balance: card.account.operBalance,
						iban: card.account.iban,
						id: card.cardCode,
						type: type,//getCardType(card.cardCode).niceName || getCardType(card.cardCode).name,
						currency: card.account.currAlfaCode,
						branchCode: card.account.branchCode
					}
				});
			return result;
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				balance: React.PropTypes.number.isRequired,
				iban: React.PropTypes.string.isRequiredNonEmpty,
				id: React.PropTypes.string.isRequiredNonEmpty, /* For filtered cards we always have its number */
				type: React.PropTypes.string.isRequiredNonEmpty,
				currency: React.PropTypes.string.isRequiredNonEmpty,
			}).isRequired
		).isRequired
	},
	{
		"name": "cardsAllStatuses6",
		"url": "$(contextRoot)/services/rest/esb/cards6",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				cardData: React.PropTypes.shape({
					blockFlag: React.PropTypes.string.isRequiredNonEmpty,
					cardCode: React.PropTypes.string, /* Card can be without number if not emitted */
					customerId: React.PropTypes.string.isRequiredNonEmpty,
					embossedName: React.PropTypes.string.isRequiredNonEmpty,
					fromDate: React.PropTypes.number, /* Card can be without fromDate */
					status: React.PropTypes.string.isRequiredNonEmpty,
					statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
					tariffId: React.PropTypes.string.isRequiredNonEmpty,
					toDate: React.PropTypes.number, /* Card can be without toDate */
					account: React.PropTypes.shape({
						balance: React.PropTypes.number.isRequired,
						branchCode: React.PropTypes.string.isRequiredNonEmpty,
						branchName: React.PropTypes.string,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currName: React.PropTypes.string,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						firstname: React.PropTypes.string,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						lastMove: React.PropTypes.number,
						lastname: React.PropTypes.string,
						operBalance: React.PropTypes.number.isRequired,
						productCode: React.PropTypes.string.isRequiredNonEmpty,
						productName: React.PropTypes.string,
						regDate: React.PropTypes.number,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
						title: React.PropTypes.string,
						type: React.PropTypes.string
					}).isRequired
				}).isRequired,
				cardType: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired,
		"dataTransformer": function (data) {
			let result = data//["customerCardList"]["card"].map(function (card) {
					.map(function (cardWrapped) {
						var card = cardWrapped["cardData"],
							type = cardWrapped["cardType"];
						return {
							balance: card.account.operBalance,
							balanceTrue: card.account.balance,
							iban: card.account.iban,
							id: card.cardCode || "",
							type: type,//getCardType(card.cardCode).niceName || getCardType(card.cardCode).name,
							currency: card.account.currAlfaCode,
							status: card.status,
							_raw: card, /* (Almost) Raw server data */
							branchCode: card.account.branchCode
						}
					});
			return result;
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				balance: React.PropTypes.number.isRequired,
				iban: React.PropTypes.string.isRequiredNonEmpty,
				id: React.PropTypes.string.isRequired,
				type: React.PropTypes.string,
				currency: React.PropTypes.string.isRequiredNonEmpty,
				status: React.PropTypes.string.isRequiredNonEmpty,
				_raw: React.PropTypes.shape({
					blockFlag: React.PropTypes.string.isRequiredNonEmpty,
					cardCode: React.PropTypes.string, /* Card can be without number if not emitted */
					customerId: React.PropTypes.string.isRequiredNonEmpty,
					embossedName: React.PropTypes.string.isRequiredNonEmpty,
					fromDate: React.PropTypes.number, /* Card can be without fromDate */
					status: React.PropTypes.string.isRequiredNonEmpty,
					statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
					tariffId: React.PropTypes.string.isRequiredNonEmpty,
					toDate: React.PropTypes.number, /* Card can be without toDate */
					account: React.PropTypes.shape({
						balance: React.PropTypes.number.isRequired,
						branchCode: React.PropTypes.string,
						branchName: React.PropTypes.string,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currName: React.PropTypes.string,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						firstname: React.PropTypes.string,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						lastMove: React.PropTypes.number,
						lastname: React.PropTypes.string,
						operBalance: React.PropTypes.number.isRequired,
						productCode: React.PropTypes.string.isRequiredNonEmpty,
						productName: React.PropTypes.string,
						regDate: React.PropTypes.number,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
						title: React.PropTypes.string,
						type: React.PropTypes.string
					}).isRequired
				}).isRequired
			}).isRequired
		).isRequired
	},
	{
		"name": "cardsAllStatuses",
		"url": "$(contextRoot)/services/rest/esb/cards",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/cards.json",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				cardData: React.PropTypes.shape({
					blockFlag: React.PropTypes.string.isRequiredNonEmpty,
					cardCode: React.PropTypes.string, /* Card can be without number if not emitted */
					customerId: React.PropTypes.string.isRequiredNonEmpty,
					embossedName: React.PropTypes.string.isRequiredNonEmpty,
					fromDate: React.PropTypes.number, /* Card can be without fromDate */
					status: React.PropTypes.string.isRequiredNonEmpty,
					statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
					tariffId: React.PropTypes.string.isRequiredNonEmpty,
					toDate: React.PropTypes.number, /* Card can be without toDate */
					account: React.PropTypes.shape({
						balance: React.PropTypes.number.isRequired,
						branchCode: React.PropTypes.string.isRequiredNonEmpty,
						branchName: React.PropTypes.string,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currName: React.PropTypes.string,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						firstname: React.PropTypes.string,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						lastMove: React.PropTypes.number,
						lastname: React.PropTypes.string,
						operBalance: React.PropTypes.number.isRequired,
						productCode: React.PropTypes.string.isRequiredNonEmpty,
						productName: React.PropTypes.string,
						regDate: React.PropTypes.number,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
						title: React.PropTypes.string,
						type: React.PropTypes.string
					}).isRequired
				}).isRequired,
				cardType: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired,
/*		"expected": React.PropTypes.shape({
			customerCardList: React.PropTypes.shape({
				card: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						blockFlag: React.PropTypes.string.isRequiredNonEmpty,
						cardCode: React.PropTypes.string, // Card can be without number if not emitted
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						embossedName: React.PropTypes.string.isRequiredNonEmpty,
						fromDate: React.PropTypes.number, // Card can be without fromDate
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string,//.isRequiredNonEmpty, // not really required, human-readable text
						tariffId: React.PropTypes.string.isRequiredNonEmpty,
						toDate: React.PropTypes.number, // Card can be without toDate
						account: React.PropTypes.shape({
							balance: React.PropTypes.number.isRequired,
							branchCode: React.PropTypes.string,
							branchName: React.PropTypes.string,
							currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
							currName: React.PropTypes.string,
							customerId: React.PropTypes.string.isRequiredNonEmpty,
							firstname: React.PropTypes.string,
							iban: React.PropTypes.string.isRequiredNonEmpty,
							lastMove: React.PropTypes.number,
							lastname: React.PropTypes.string,
							operBalance: React.PropTypes.number.isRequired,
							productCode: React.PropTypes.string.isRequiredNonEmpty,
							productName: React.PropTypes.string,
							regDate: React.PropTypes.number,
							status: React.PropTypes.string.isRequiredNonEmpty,
							statusCode: React.PropTypes.string,//.isRequiredNonEmpty, // not really required, human-readable text
							title: React.PropTypes.string,
							type: React.PropTypes.string
						}).isRequired
					}).isRequired
				).isRequired//NonEmpty
			}).isRequired
		}).isRequired,*/
		"dataTransformer": function (data) {
			let result = data//["customerCardList"]["card"].map(function (card) {
					.map(function (cardWrapped) {
						var card = cardWrapped["cardData"],
							type = cardWrapped["cardType"];
						return {
							balance: card.account.operBalance,
							balanceTrue: card.account.balance,
							iban: card.account.iban,
							id: card.cardCode || "",
							type: type,//getCardType(card.cardCode).niceName || getCardType(card.cardCode).name,
							currency: card.account.currAlfaCode,
							status: card.status,
							_raw: card, /* (Almost) Raw server data */
							branchCode: card.account.branchCode
						}
					});
			return result;
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				balance: React.PropTypes.number.isRequired,
				iban: React.PropTypes.string.isRequiredNonEmpty,
				id: React.PropTypes.string.isRequired,
				type: React.PropTypes.string,
				currency: React.PropTypes.string.isRequiredNonEmpty,
				status: React.PropTypes.string.isRequiredNonEmpty,
				_raw: React.PropTypes.shape({
					blockFlag: React.PropTypes.string.isRequiredNonEmpty,
					cardCode: React.PropTypes.string, /* Card can be without number if not emitted */
					customerId: React.PropTypes.string.isRequiredNonEmpty,
					embossedName: React.PropTypes.string.isRequiredNonEmpty,
					fromDate: React.PropTypes.number, /* Card can be without fromDate */
					status: React.PropTypes.string.isRequiredNonEmpty,
					statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
					tariffId: React.PropTypes.string.isRequiredNonEmpty,
					toDate: React.PropTypes.number, /* Card can be without toDate */
					account: React.PropTypes.shape({
						balance: React.PropTypes.number.isRequired,
						branchCode: React.PropTypes.string,
						branchName: React.PropTypes.string,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currName: React.PropTypes.string,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						firstname: React.PropTypes.string,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						lastMove: React.PropTypes.number,
						lastname: React.PropTypes.string,
						operBalance: React.PropTypes.number.isRequired,
						productCode: React.PropTypes.string.isRequiredNonEmpty,
						productName: React.PropTypes.string,
						regDate: React.PropTypes.number,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
						title: React.PropTypes.string,
						type: React.PropTypes.string
					}).isRequired
				}).isRequired
			}).isRequired
		).isRequired
	},
	{
		"name": "currency",
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/currency?code=KZT,RUB,USD,EUR,GBP",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/currency.json",
		"expected": React.PropTypes.shape({
			rateList: React.PropTypes.shape({
				rate: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currIsoCode: React.PropTypes.string.isRequired,
						currSaleAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currSaleIsoCode: React.PropTypes.string.isRequired,
						rateType: React.PropTypes.oneOf(["BUY", "SELL"]).isRequired,
						value: React.PropTypes.number.isRequired,
					}).isRequired
				).isRequiredNonEmpty
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			let allRates = data["rateList"]["rate"],
				resultRates = {},
				currList = [],
				currKeys = {},
				resultRatesUpper= {};

			allRates.forEach((rate)=> {
				let fromCurrency = rate.currAlfaCode,
					toCurrency = rate.currSaleAlfaCode;

				if (rate.rateType === "SELL") {
					resultRates[fromCurrency] = resultRates[fromCurrency] || {};
					resultRatesUpper[fromCurrency] = resultRatesUpper[fromCurrency] || {};
					resultRates[fromCurrency][toCurrency] = rate["value"];
					resultRatesUpper[fromCurrency][toCurrency] = rate["value"];



				}
				else { //BUY
					[fromCurrency, toCurrency] = [toCurrency, fromCurrency];
					resultRates[fromCurrency] = resultRates[fromCurrency] || {};
					resultRates[fromCurrency][toCurrency] = 1/rate["value"];
					resultRatesUpper[fromCurrency] = resultRatesUpper[fromCurrency] || {};
					resultRatesUpper[fromCurrency][toCurrency] = rate["value"];

				}

				if (!currKeys[rate.currAlfaCode]) {
					currKeys[rate.currAlfaCode] = true;
					currList.push({id: rate.currAlfaCode, text: rate.currAlfaCode});
				}
			});

			if (!currKeys["KZT"]) {
				currList.unshift({id: "KZT", text: "KZT"});
			}
			currList.forEach(function (curr) {
				resultRates[curr.id][curr.id] = 1;
				resultRatesUpper[curr.id][curr.id] = 1;
			});


			return {
				currencyList: currList,
				exchangeRates: resultRates,
				exchangeRatesUpper: resultRatesUpper
			};
		},

		"produced": React.PropTypes.shape({
			currencyList: React.PropTypes.arrayOf(
				React.PropTypes.shape({
					id: React.PropTypes.string.isRequiredNonEmpty,
					text: React.PropTypes.string.isRequiredNonEmpty,
				}).isRequired
			).isRequiredNonEmpty,
			exchangeRates: React.PropTypes.objectOf(
				React.PropTypes.objectOf(
					React.PropTypes.number.isRequired
				).isRequired
			).isRequired,
			exchangeRatesUpper: React.PropTypes.objectOf(
				React.PropTypes.objectOf(
					React.PropTypes.number.isRequired
				).isRequired
			).isRequired
		})
	},
	{
		"name": "getCountryUsages",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/getCountryUsages.json",
		"expected": React.PropTypes.shape({
			countryList: React.PropTypes.shape({
				country: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						code: React.PropTypes.string.isRequired,
						longName: React.PropTypes.string.isRequired,
					}).isRequired
				).isRequired
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			let result = data["countryList"]["country"];
			return result;
		}
	},
	{
		"name": "KZTcurrencyRates",
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/currency?code=KZT,RUB,USD,EUR,GBP",
		//"url": "$(resourceRoot)/static/altyn-bundle/mocks/currency.json",
		"expected": React.PropTypes.shape({
			rateList: React.PropTypes.shape({
				rate: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currIsoCode: React.PropTypes.string.isRequired,
						currSaleAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						currSaleIsoCode: React.PropTypes.string.isRequired,
						rateType: React.PropTypes.oneOf(["BUY", "SELL"]).isRequired,
						value: React.PropTypes.number.isRequired,
					}).isRequired
				).isRequiredNonEmpty
			}).isRequired
		}).isRequired,
		"dataTransformer": function (response) {
			let result = {
				"BUY": {},
				"SELL": {}
			};

			let data = response.rateList.rate.filter(function (item) {
				return item["currSaleAlfaCode"] === "KZT"
			})

			data.map(function (item) {
				(item["rateType"] === "BUY")
					? (result["BUY"][item.currAlfaCode] = item.value)
					: (result["SELL"][item.currAlfaCode] = item.value)
			})

			return result;
		}
	},
	{
		"name": "documents",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/documents.json",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				id: React.PropTypes.string.isRequiredNonEmpty,
				text: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired
	},
	{
		"name": "customerDeposits",
		"url": "$(contextRoot)/services/rest/esb/customerDeposits",
		"expected": React.PropTypes.shape({
			depositList: React.PropTypes.shape({
				deposit: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						amount: React.PropTypes.number,
						beginDate: React.PropTypes.number,
						capital: React.PropTypes.number,
						contructNum: React.PropTypes.string,
						currency: React.PropTypes.string,
						departmentId: React.PropTypes.string,
						endDate: React.PropTypes.number,
						iban: React.PropTypes.string,
						isAdPayment: React.PropTypes.number,
						isEarlyTermination: React.PropTypes.number,
						isPartialFund: React.PropTypes.number,
						isPartialReward: React.PropTypes.number,
						payPeriod: React.PropTypes.string,
						percent: React.PropTypes.number,
						prolonPermit: React.PropTypes.number,
						rewardAmount: React.PropTypes.number,
						sdclCode: React.PropTypes.string,
						status: React.PropTypes.string,
						statusCode: React.PropTypes.string
					}).isRequired
				).isRequired/*NonEmpty*/
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data;
		},
	},
	{
		"name": "shortDeposits",
		"url": "$(contextRoot)/services/rest/esb/shortDeposits",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/shortDeposits.json",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				endDate: React.PropTypes.string,
				amount: React.PropTypes.string,
				rewardAmount: React.PropTypes.string,
				nonRemovableResidue: React.PropTypes.string,
				contractNum: React.PropTypes.string,
				currency: React.PropTypes.string,
				percent: React.PropTypes.number,
				status: React.PropTypes.string,
				statusCode: React.PropTypes.string,
				departmentId: React.PropTypes.string
				//balance: React.PropTypes.string.isRequired,
				//withdrawalAmount: React.PropTypes.string.isRequired
			}).isRequired
		).isRequired,
		"dataTransformer": function (data) {
			return data;
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				endDate: React.PropTypes.string,
				amount: React.PropTypes.string,
				rewardAmount: React.PropTypes.string,
				nonRemovableResidue: React.PropTypes.string,
				contractNum: React.PropTypes.string,
				currency: React.PropTypes.string,
				percent: React.PropTypes.number,
				status: React.PropTypes.string,
				statusCode: React.PropTypes.string,
				departmentId: React.PropTypes.string
			}).isRequired
		).isRequired,
	},
	{
		"name": "currencyOperation",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/currencyOperationCode.json",
		"expected": React.PropTypes.shape({
			operationList: React.PropTypes.shape({
				operation: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequired,
						text: React.PropTypes.string.isRequired
					}).isRequired
				).isRequiredNonEmpty
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data["operationList"]["operation"]
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				id: React.PropTypes.string.isRequiredNonEmpty,
				text: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired
	},
	{
		"name": "tmpls",
//		"url": "$(resourceRoot)/static/altyn-bundle/mocks/tmpls.json",
		"url": "$(contextRoot)/services/rest/esb/templates",
		"expected": React.PropTypes.shape({
			errorCode: React.PropTypes.oneOf(["0"]),
			errorMessage: React.PropTypes.string,
			templateList: React.PropTypes.shape({
				template: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						name: React.PropTypes.string.isRequiredNonEmpty,
						description: React.PropTypes.string.isRequired,
						fields: React.PropTypes.string.isRequiredNonEmpty,
						uid: React.PropTypes.string.isRequiredNonEmpty,

						bpmId: React.PropTypes.string.isRequired,
						bpmName: React.PropTypes.string,
						createDate: React.PropTypes.number,
						creator: React.PropTypes.string,
						iin: React.PropTypes.string,
						updateDate: React.PropTypes.number,
					}).isRequired
				).isRequired/*NonEmpty*/
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data["templateList"]["template"]
				.map(function (tmpl) {
					let {
						name,
						description,
						bpmName,
						fields,
						uid } = tmpl;
					return {uid, name, description, bpmName, fields: JSON.parse(fields)};
				});
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				uid: React.PropTypes.string.isRequiredNonEmpty,
				name: React.PropTypes.string.isRequiredNonEmpty,
				description: React.PropTypes.string.isRequired,
				fields: React.PropTypes.shape({
					paymentData: React.PropTypes.shape({
						payerId: React.PropTypes.string.isRequiredNonEmpty,
						payerType: React.PropTypes.oneOf(["card", "account"]),
						paymentCurrency: React.PropTypes.string.isRequiredNonEmpty,
						paymentFee: React.PropTypes.number, // Not required
						paymentSum: React.PropTypes.number.isRequired,
					}),
				}).isRequired
			}).isRequired
		).isRequired
	},
	{
		"name": "accounts",
		"url": "$(contextRoot)/services/rest/esb/accounts",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/accounts.json",
		"expected": React.PropTypes.shape({
			accountList: React.PropTypes.shape({
				account: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						blockFlag: React.PropTypes.string.isRequiredNonEmpty,
						branchCode: React.PropTypes.string.isRequiredNonEmpty,
						balance: React.PropTypes.number.isRequired,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						title: React.PropTypes.string.isRequiredNonEmpty,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
					}).isRequired
				).isRequiredNonEmpty
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data["accountList"]["account"]
				.filter(function (account) {
					return (account["status"] === "OPENED");
				})
				.map(function (account) {
					let {
						blockFlag: isBlocked,
						branchCode,
						operBalance,
						balance,
						currAlfaCode,
						customerId,
						iban,
						title } = account,
						balanceTrue;

					isBlocked = Boolean(+isBlocked);
					balanceTrue = balance;
					balance = operBalance;

					return {isBlocked, branchCode, balance, operBalance, currAlfaCode, customerId, iban, title};
				});
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				isBlocked: React.PropTypes.bool.isRequiredNonEmpty,
				branchCode: React.PropTypes.string.isRequiredNonEmpty,
				balance: React.PropTypes.number.isRequired,
				currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
				customerId: React.PropTypes.string.isRequiredNonEmpty,
				iban: React.PropTypes.string.isRequiredNonEmpty,
				title: React.PropTypes.string.isRequiredNonEmpty,
			}).isRequired
		).isRequiredNonEmpty
	},
	{
		"name": "accountsAllStatuses",
		"url": "$(contextRoot)/services/rest/esb/accounts",
		//"url": "$(resourceRoot)/static/altyn-bundle/mocks/accounts.json",
		"expected": React.PropTypes.shape({
			accountList: React.PropTypes.shape({
				account: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						balance: React.PropTypes.number.isRequired,
						blockFlag: React.PropTypes.string.isRequiredNonEmpty,
						branchCode: React.PropTypes.string.isRequiredNonEmpty,
						currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
						customerId: React.PropTypes.string.isRequiredNonEmpty,
						iban: React.PropTypes.string.isRequiredNonEmpty,
						title: React.PropTypes.string.isRequiredNonEmpty,
						status: React.PropTypes.string.isRequiredNonEmpty,
						statusCode: React.PropTypes.string/*.isRequiredNonEmpty*/, /* not really required, human-readable text*/
						type: React.PropTypes.string.isRequiredNonEmpty,
						regDate: React.PropTypes.number.isRequired,
						firstname: React.PropTypes.string,
						lastname: React.PropTypes.string,
						middlename: React.PropTypes.string,
					}).isRequired
				).isRequiredNonEmpty
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data["accountList"]["account"]
				.map(function (account) {
					let {
						balance,
						operBalance,
						blockFlag: blockedCount,
						blockFlag: isBlocked,
						branchCode,
						currAlfaCode,
						customerId,
						iban,
						title,
						status,
						type,
						regDate,
						firstname,
						lastname,
						middlename
					} = account,
						balanceTrue;

					// blockedCount = blockFlag;
					isBlocked = Boolean(+isBlocked);
					balanceTrue = balance;
					balance = operBalance;
					return {
						balance,
						balanceTrue,
						blockedCount,
						operBalance,
						branchCode,
						isBlocked,
						currAlfaCode,
						customerId,
						iban,
						title,
						status,
						type,
						regDate,
						firstname,
						lastname,
						middlename
					};
				});
		},
		"produced": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				balance: React.PropTypes.number.isRequired,
				isBlocked: React.PropTypes.bool.isRequiredNonEmpty,
				branchCode: React.PropTypes.string.isRequiredNonEmpty,
				currAlfaCode: React.PropTypes.string.isRequiredNonEmpty,
				customerId: React.PropTypes.string.isRequiredNonEmpty,
				iban: React.PropTypes.string.isRequiredNonEmpty,
				title: React.PropTypes.string.isRequiredNonEmpty,
				status: React.PropTypes.string.isRequiredNonEmpty,
				type: React.PropTypes.string.isRequiredNonEmpty,
				regDate: React.PropTypes.number.isRequired,
				firstname: React.PropTypes.string,
				lastname: React.PropTypes.string,
				middlename: React.PropTypes.string
			}).isRequired
		).isRequiredNonEmpty
	},
	{
		"name": "client",
		"url": "$(contextRoot)/services/rest/esb/client",
//		"url": "$(resourceRoot)/static/altyn-bundle/mocks/client.json",
		"expected": React.PropTypes.shape({
			result: React.PropTypes.object,
			client: React.PropTypes.shape({
				inn: React.PropTypes.string.isRequiredNonEmpty,
				mobilePhone: React.PropTypes.string.isRequired,
				addressList: React.PropTypes.shape({
					address: React.PropTypes.arrayOf(
						React.PropTypes.shape({
							fullAddress: React.PropTypes.string.isRequiredNonEmpty,
							isDelivery: React.PropTypes.oneOf(["Y", "N"]).isRequired,
						})
					).isRequired
				}).isRequired,
				lastName: React.PropTypes.string.isRequiredNonEmpty,
				firstName: React.PropTypes.string.isRequiredNonEmpty,
				middleName: React.PropTypes.string.isRequired,
				dateOfB: React.PropTypes.number.isRequired,
				customerId: React.PropTypes.string.isRequiredNonEmpty,
				clientLogin: React.PropTypes.string.isRequiredNonEmpty,
				fatca: React.PropTypes.string,
				sex: React.PropTypes.oneOf(["Ж", "М"]).isRequired,
				email: React.PropTypes.string,
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			//Clearing data: fix wrong iin key, fix cyrillic values for switches,
			//	flatten addresses, change char to bool for boolean switch
			data["client"]["iin"] = data["client"]["inn"];
			delete data["client"]["inn"];
			data["client"]["sex"] = (data["client"]["sex"] === "Ж") ? "f" : "m";
			data["client"]["addressList"] = data["client"]["addressList"]["address"].map(function (address) {
				address["isDelivery"] = (address["isDelivery"] === "Y");
				return address;
			});
			data["client"]["addressList"] = sortArrayByProperty(data["client"]["addressList"], "-createdDate")
			return data["client"];
		},
		"produced": React.PropTypes.shape({
			iin: React.PropTypes.string.isRequiredNonEmpty,
			mobilePhone: React.PropTypes.string.isRequired,
			addressList: React.PropTypes.arrayOf(
				React.PropTypes.shape({
					fullAddress: React.PropTypes.string.isRequiredNonEmpty,
					isDelivery: React.PropTypes.bool.isRequired,
				})
			).isRequired,
			lastName: React.PropTypes.string.isRequiredNonEmpty,
			firstName: React.PropTypes.string.isRequiredNonEmpty,
			middleName: React.PropTypes.string.isRequired,
			dateOfB: React.PropTypes.number.isRequired,
			customerId: React.PropTypes.string.isRequiredNonEmpty,
			clientLogin: React.PropTypes.string.isRequiredNonEmpty,
			fatca: React.PropTypes.string,
			sex: React.PropTypes.oneOf(["f", "m"]).isRequired,
			email: React.PropTypes.string,
		}).isRequired
	},
	{
		"name": "countries",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/countries.json",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				id: React.PropTypes.string.isRequiredNonEmpty,
				text: React.PropTypes.string.isRequiredNonEmpty,
				type: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired
	},
	{
		"name": "transferType",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/transferType.json",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				id: React.PropTypes.string.isRequiredNonEmpty,
				text: React.PropTypes.string.isRequiredNonEmpty,
				type: React.PropTypes.string.isRequiredNonEmpty
			}).isRequired
		).isRequired
	},
	{
		"name": "categoriesSuppliers",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/categoriesSuppliersWithoutSuppliers.json",
		"expected": React.PropTypes.arrayOf(
			React.PropTypes.shape({
				id: React.PropTypes.string.isRequiredNonEmpty,
				text: React.PropTypes.string.isRequiredNonEmpty,
				suppliers: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequiredNonEmpty,
						text: React.PropTypes.string.isRequiredNonEmpty,
					})
				)
			})
		)
	},
	{
		"name": "products",
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/products.json",
		"expected": React.PropTypes.shape({
			productList: React.PropTypes.shape({
				product: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequired,
						text: React.PropTypes.string.isRequired,
						type: React.PropTypes.string.isRequired,
						paymentSystem: React.PropTypes.string.isRequired,
						kind: React.PropTypes.string.isRequired,
						currency: React.PropTypes.array.isRequired,
						design: React.PropTypes.array.isRequired,
						costIssue: React.PropTypes.number.isRequired,
						costDelivery: React.PropTypes.number.isRequired,
						costSelfDelivery: React.PropTypes.number.isRequired
					}).isRequired
				).isRequired
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			let result = data["productList"]["product"];
			return result;
		}
	},
	{
		"name": "getCountry",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/getCountry.json",
		"url": "$(contextRoot)/services/rest/esb/countries",
		"expected": React.PropTypes.shape({
			countryList: React.PropTypes.shape({
				country: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequired,
						code: React.PropTypes.string.isRequired,
						longName: React.PropTypes.string.isRequired,
					}).isRequired
				).isRequired
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			let result = data["countryList"]["country"];
			return result;
		}
	},
	{
		"name": "getRegion",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/getRegion.json",
		"url": "$(contextRoot)/services/rest/esb/regions",
		"expected": React.PropTypes.shape({
			regionList: React.PropTypes.shape({
				region: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequired,
						longName: React.PropTypes.string.isRequired,
					}).isRequired
				).isRequired
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			let result = data["regionList"]["region"];
			return result;
		}
	},
	{
		"name": "getCity",
		// "url": "$(resourceRoot)/static/altyn-bundle/mocks/getCity.json",
		"url": "$(contextRoot)/services/rest/esb/cities",
		"expected": React.PropTypes.shape({
			cityList: React.PropTypes.shape({
				city: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequired,
						longName: React.PropTypes.string.isRequired,
					}).isRequired
				).isRequired
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			let result = data["cityList"]["city"];
			return result;
		}
	},
	{
		"name": "getCountryKorona",
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/koronaOnlinePayMap",
		//"url": "$(contextRoot)/services/rest/esb/countries",
		"expected": React.PropTypes.shape({
			bankInf: React.PropTypes.arrayOf().isRequired,
			cityInf: React.PropTypes.arrayOf().isRequired,
			country: React.PropTypes.arrayOf(
				React.PropTypes.shape({
					countryISO: React.PropTypes.string.isRequired,
					countryName: React.PropTypes.string.isRequired
				}).isRequired
			).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data["country"];
		}
	},
	{
		"name": "getInfoCardByNumber",
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/cardsProductCatalogData",
		"dataTransformer": function (data) {
			return data;
		}
	},
	{
		"name": "getInfoCardByNumber6",
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/cardsProductCatalogData6",
		"dataTransformer": function (data) {
			return data;
		}
	},
	{
		"name": "getNotifications",
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/notifications?onlyNotSeenFlg=true",
		"expected": React.PropTypes.shape({
			inn: React.PropTypes.string.isRequiredNonEmpty,
			notifications: React.PropTypes.shape({
				notification: React.PropTypes.arrayOf(
					React.PropTypes.shape({
						id: React.PropTypes.string.isRequiredNonEmpty,
						code: React.PropTypes.string.isRequiredNonEmpty,
						processId: React.PropTypes.string.isRequiredNonEmpty,
						title: React.PropTypes.string.isRequiredNonEmpty,
						text: React.PropTypes.string.isRequiredNonEmpty,
						isSeen: React.PropTypes.bool.isRequiredNonEmpty,
						seenDate: React.PropTypes.number.isRequired,
						smsChanelFlg: React.PropTypes.bool.isRequiredNonEmpty,
						pushChanelFlg: React.PropTypes.bool.isRequiredNonEmpty,
						emailChanelFlg: React.PropTypes.bool.isRequiredNonEmpty,
						userLogin: React.PropTypes.string.isRequiredNonEmpty
					}).isRequired
				).isRequiredNonEmpty
			}).isRequired
		}).isRequired,
		"dataTransformer": function (data) {
			return data['notifications'] ? data['notifications']['notification'] : [];
		}
	}

];

let _servicesConfig = {
	"exchange": {
		"timeout": 300
	},
	"getCommission": {
		"url": "$(contextRoot)/services/rest/calculate/servicePayFee",
		"timeout": 300
	},
	"getInterestAmount": {
		"url": "$(contextRoot)/services/rest/calculate/interest",
		"timeout": 300
	},
	"getServiceProviders": {
		"url": "$(contextRoot)/services/rest/calculate/servicePayProviders"
	},
	"calculateTransaction": {
		// Format of settings received by service, not server data format
		"expected": React.PropTypes.oneOfType([
			React.PropTypes.shape({
//				fromAmount: React.PropTypes.number.isRequired,
				fromCurrency: React.PropTypes.string.isRequiredNonEmpty,
				toAmount: React.PropTypes.number.isRequired,
				toCurrency: React.PropTypes.string.isRequiredNonEmpty,
				commission: React.PropTypes.oneOfType([
					React.PropTypes.string,
					React.PropTypes.arrayOf([
						React.PropTypes.string,
					])
				]),
				callerId: React.PropTypes.string.isRequiredNonEmpty,
				callback: React.PropTypes.func,
			}).isRequired,
			React.PropTypes.shape({
				fromAmount: React.PropTypes.number.isRequired,
				fromCurrency: React.PropTypes.string.isRequiredNonEmpty,
//				toAmount: React.PropTypes.number.isRequired,
				toCurrency: React.PropTypes.string.isRequiredNonEmpty,
				commission: React.PropTypes.oneOfType([
					React.PropTypes.string,
					React.PropTypes.arrayOf([
						React.PropTypes.string,
					])
				]),
				callerId: React.PropTypes.string.isRequiredNonEmpty,
				callback: React.PropTypes.func,
			}).isRequired,
		])
	},
	"changePassword": {
		"url": "$(contextRoot)/services/rest/esb/setUserPassword?newPassword=",
	},
	"getCountryTransferData": {
		"url": "$(resourceRoot)/static/altyn-bundle/mocks/$(countryId).json",
	},
	"clientByIban": {
		"url": "$(contextRoot)/services/rest/esb/account?iban=",
	},
	"clientByPhone": {
		"url": "$(contextRoot)/services/rest/esb/clientByPhoneWrapped?phone=",
	},
	"clientByFacebook": {
		"url": "$(contextRoot)/services/rest/esb/clientByFacebookWrapped?facebookLogin=",
	},
	"getBankBySWIFT": {
		"url": "$(contextRoot)/services/rest/esb/swiftName?swiftCode=",
	},
	"checkIIN": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/checkIin?checkIin=",
	},
	"checkVIN": {
		"url": "$(contextRoot)/services/rest/kis/getTFBOY?aVIN=",
	},
	"structIIN": {
		"url": "$(contextRoot)/services/rest/kis/byRNNBOYStructIIN?searchIin=",
	},
	"getItemsAltynStruct": {
		"url": "$(contextRoot)/services/rest/kis/getItemsAltynStruct?dictionary=",
	},
	"setClientAltyn": {
		"url": "$(contextRoot)/services/rest/kis/setClientsAltyn",
	},
	"ecmDocumentList": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents"
	},
	"ecmDocumentPreview": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents/$(documentId)/thumb"
	},
	"getDepositContractById": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents/$(documentId)/content"
	},
	"getDepositContractByIban": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents/?DocumentType=DOG_VKL&DocumentNumber=$(iban)"
	},
	"ecmDocumentThumbExisting": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents/$(documentId)/thumbexisting"
	},
	"ecmDocumentDownload": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=download&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents/$(documentId)/content?fileName=$(documentName)"
	},
	"ecmDocumentUpload": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents"
	},
	"ecmDocumentUpdate": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=file&url=",
		"encodedUrl": "http://localhost/ecmapi/json/documents/$(documentId)"
	},
	"saveTemplate": {
		"url": "$(contextRoot)/services/rest/esb/createTemplate"
	},
	"updateTemplate": {
		"url": "$(contextRoot)/services/rest/esb/updateTemplate"
	},
	"updateClient": {
		"url": "$(contextRoot)/services/rest/esb/client"
	},
	"checkRefsExists": {
		"url": "$(contextRoot)/services/rest/ecm/refsExists?iin=$(iin)&docNumber=$(docNumber)"
	},
	"checkVacantUser": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/checkVacantUser"
	},
	"getOperations": {
		"url": "$(contextRoot)/services/rest/esb/operations"
	},
	"getDocCertificates": {
		"url": "$(contextRoot)/services/rest/ecm/accounts"
	},
	"getDepositCertificates": {
		"url": "$(contextRoot)/services/rest/ecm/deposits"
	},
	"getDocRequisites": {
		"url": "$(contextRoot)/services/rest/ecm/requisites"
	},
	"getDocCurrent": {
		"url": "$(contextRoot)/services/rest/ecm/operations"
	},
	"getDocDeposit": {
		"url": "$(contextRoot)/services/rest/ecm/depositOperations"
	},
	"dataCapUpload": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=services&url=",
		"encodedUrl": "http://localhost:9094/altyn-services/services/rest/ecm/dataCapUpload"
	},
	"getBatchAttrDataCap": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/ecm/getBatchAttrDataCap?queueId=$(queueId)"
	},
	"getDataCapFile": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/ecm/getDataCapFile?filename=$(fileName)&queueId=$(queueId)&batchId=$(batchId)"
	},
	"sendSmsWithTemporaryCode": {
		"url": "$(contextRoot)/services/rest/portalInternal/sendSmsWithTemporaryCode?phone="
	},
	"checkTemporaryCode": {
		"url": "$(contextRoot)/services/rest/portalInternal/checkTemporaryCode?code="
	},
	"getPublicProcesses": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/bpm/instance/public"
	},
	"getActiveProcesses": {
		"url": "$(contextRoot)/services/rest/bpm/instances/query"
	},
	"getUnauthorizedFeedbackCase": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/feedbackCase"
	},
	"getP2POrder": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/createKazkomOrder",
//		"url": "$(resourceRoot)/static/altyn-bundle/mocks/p2porder.json",
	},
	"getAllBills": {
		"url": "$(contextRoot)/services/rest/ecm/allBills"
	},

	// Facebook
	"fbTokenStatus": {
		"url": "$(contextRoot)/services/rest/facebook/hasFacebookAccessToken"
	},
	"generateFBToken": {
		"url": "$(contextRoot)/services/rest/facebook/extendAccessToken?accessToken="
	},
	"fbHost": { // For direct calls with short token
		"url": "https://graph.facebook.com/v2.5"
	},
	"fbProxy": { // Principal way to call FB api, with long tokens stored on server
		"url": "$(contextRoot)/services/rest/facebook/proxy/v2.5"
	},
	"fbMe": {
		"url": "/me"
	},
	"fbFriends": {
		"url": "/me/friends?fields=id,name,picture"
	},
	"fbPermissions": {
		"url": "/me/permissions"
	},
	// End facebook
	"translationTaskName": {
		"url": "$(contextRoot)/proxy$(zonePrefix)?pipe=cached-services&url=",
		"encodedUrl": "http://localhost:9094/altyn-services/services/rest/esb/translation?formId=$(taskName)"
	},
	"getBankByIbanAccCode": {
		"url": "$(contextRoot)/services/rest/esb/bankByIbanAccCode?ibanAccCode="
	},
	"getDesignCard": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/productCatalog?type=Card"
	},
	"getAccountProductCode": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/productCatalog?type=Account"
	},
	"getCitiesKorona": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/koronaOnlinePayMap?countryISO="
	},
	"getCurrenciesKorona": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/koronaOnlinePayMap?cityId="
	},
	"saveColvirClient": {
		"url": "$(contextRoot)/services/rest/esb/colvirClient"
	},
	"koronaTariffCalculation": {
		"url": "$(contextRoot)/services/rest$(zonePrefix)/esb/koronaTariffCalculation"
	},
	"deleteTemplate": {
		"url": "$(contextRoot)/services/rest/esb/deleteTemplate?id=",
	},
	//Notifications
	"getNotifications": {
		"url": "$(contextRoot)/services/rest/esb/notifications?onlyNotSeenFlg=",
	},
	closeNotification: {
		"url": "$(contextRoot)/services/rest/esb/markAsSeen?notificationId=",
	},
	openProcessByProcessId: {
		"url": "$(contextRoot)/services/rest/bpm/instance/",
	}
};



let _generateEntity = function (entityConfig) {
	let {name, url, expected, produced, dataTransformer = fallThrough} = entityConfig;

	// Simplest case
	let entity = {
		name: name,
		meta: {
			data: null,
			isLoading: false,
			loadingError: false,
			lastLoadAttempt: -1,
			lastSuccessfulLoad: -1,
		},
		xhr: null,
		_callbacks: [],
	};
	entity["_retriever"] = function () {
		entity["meta"].isLoading = true;

		function onSuccess(data, textStatus, xhr) {
			let loadTime = (new Date()).getTime();
			if (typeof(expected) === "function") {
				let err = expected({"data": data}, "data", "entity._retriever 'expected'", "prop");
				if (err instanceof Error) {
					// Got data of unexpected shape; counted as error
					onError(xhr, textStatus, err);
					return;
				}
			}
			let finalData = dataTransformer(data);
			if (typeof(produced) === "function") {
				let err = produced({"data": finalData}, "data", "entity._retriever 'produced'", "prop");
				if (err instanceof Error) {
					// Produced data of unexpected shape; counted as error
					onError(xhr, textStatus, err);
					return;
				}
			}
			entity["meta"] = {
				data: finalData,
				isLoading: false,
				loadingError: false,
				lastLoadAttempt: loadTime,
				lastSuccessfulLoad: loadTime,
			};

			(entity["_callbacks"] || []).forEach(function (callback) {
				callback(entity);
			});
		}

		function onError(xhr, ajaxOptions, thrownError) {
			let loadTime = (new Date()).getTime();
			entity["meta"] = {
				data: null,
				isLoading: false,
				loadingError: thrownError,
				lastLoadAttempt: loadTime,
				lastSuccessfulLoad: entity["meta"].lastSuccessfulLoad, //copy from previous
			};

			(entity["_callbacks"] || []).forEach(function (callback) {
				callback(entity);
			});
		}

		// Finally make an ajax request

		entity["xhr"] = getAjaxRequest(url,"GET","json",onSuccess,onError);
	};

	return entity;
};

function getDataStore(urlResolver = fallThrough, networkFeature = null) {
	if (_store._generated && _store._urlResolver !== urlResolver) {
		throw new Error("DataStore already generated with different urlResolver");
	}
	//
	//	Generate new store from config
	//
	if (!_store._generated) {
		_entitiesConfig.forEach(function (entityConfig) {
			if (entityConfig["name"] && entityConfig["url"]) {
				entityConfig["url"] = urlResolver(entityConfig["url"]);
				_store.entities[entityConfig["name"]] = _generateEntity(entityConfig);
			}
			else {
				throw new Error("Invalid config for entity", entityConfig);
			}
		});
		$.each(_servicesConfig, function (serviceName, serviceConfig) {
			if (typeof(serviceConfig["url"]) === "string") {
				serviceConfig["url"] = urlResolver(serviceConfig["url"]);
			}
		});
		_store._urlResolver = urlResolver;
		_store._networkFeature = networkFeature;
		_store._generated = true;
		_store._fbAllowed = false;

		_handleFb();

	}

	//
	//	Save Facebook token and optionally link FB account to client
	//
	function _handleFb() {
		let shortToken;
		if (window.location.hash) {

			console.log("window.location", window.location);

				let accessTokenMatch = window.location.hash.match(/access_token\=([a-zA-Z0-9]+)/);
			console.log("accessTokenMatch ", accessTokenMatch);

			if (accessTokenMatch && accessTokenMatch[1]) {
				shortToken = accessTokenMatch[1];
			}
		}

		// console.log("_handleFb ");
		// console.log("shortToken ", shortToken);

		if (shortToken) {
			// We came here from Facebook redirect, with a token
			if (getUrlParams()["accountLinking"]) {
				_getFBMeWithShortToken({
					shortToken,
					callback: function(data) {

						console.log("_getFBMeWithShortToken data", data);
						//console.log('updating', data)
						updateClient({"facebookLogin": data["id"]}, function(d, e) {
							console.log('updated!');
							console.log(d, e);

							_generateFBToken({
								shortToken,
								callback: function(data) {

									console.log()
									if (data && data["value"] === "ok") {
										_store._fbAllowed = true;
									}
								}
							});
						});
					}
				});
				// Clear query parameter from address bar
				window.setTimeout(function() {
					history.pushState("", document.title, window.location.pathname);
				}, 0);
			}
			else {
				_generateFBToken({
					shortToken,
					callback: function(data) {
						if (data && data["value"] === "ok") {
							_store._fbAllowed = true;
						}
					}
				});
			}
		}
		else {
			if(window.altyn.zonePrefix === ""||(window.isMobile && window.altyn.zonePrefix =="/open")){
				//Just came on page, need to get token status
				_getFBTokenStatus(function(response) {
					if (response && response["value"] === true) {
						_store._fbAllowed = true;
					}
				});
			}

		}
	}

	//
	//	Define interface to subscribe/unsubscribe to a single entity change
	//
	function subscribe(entityName, callback) {
		let callbackList = _store.entities[entityName]._callbacks;
		callbackList.push(callback);
	}

	function unsubscribe(entityName, callback) {
		let callbackList = _store.entities[entityName]._callbacks,
			index = callbackList.indexOf(callback);
		if (index !== -1) {
			callbackList.splice(index, 1);
		}
	}

	//
	//	Define interface to initialize some entity - make request if no
	//		data available
	//

	// TODO this

	//
	//	Define interface to ask for a list of entities and receive update on
	//		each change; and to unsubscribe from receiving updates.
	//
	let _getEntitiesCalls = {"default": []};

	function getEntities(ent, cback, callerId) {
		if (!callerId) {
			throw new Error("callerId not supplied for getEntities call");
		}

		let callback = cback || noop,
			entities = makeList(ent);
		if (!Array.isArray(_getEntitiesCalls[callerId])) {
			_getEntitiesCalls[callerId] = [];
		}

		let result = {
			entities: {},
			isLoading: false,
			loadingError: false,
			lastLoadAttempt: -1,
			lastSuccessfulLoad: -1,
		};

		entities.forEach(function (entityName) {
			if (!_store.entities[entityName]) {
				var e = new Error("Requested entity '" + entityName + "' could not be found in store config; check spelling");
				e.name = entityName;
				throw e;
			}
			else {
				result.entities[entityName] = _store.entities[entityName].meta;
			}
		});

		// Will update result for requested list of entities, inc. loading status
		function updateResult(changedEntity = null) {
			if (changedEntity && changedEntity["meta"]) {
				result.entities[changedEntity["name"]] = changedEntity["meta"];
			}

			result.isLoading = false;
			result.loadingError = false;
			entities.forEach(function (entityName) {
				let entityMeta = _store.entities[entityName].meta
				result.isLoading = result.isLoading || entityMeta.isLoading;
				result.loadingError = result.loadingError || entityMeta.loadingError;
				result.lastLoadAttempt = Math.max(result.lastLoadAttempt, entityMeta.lastLoadAttempt);
				result.lastSuccessfulLoad = Math.max(result.lastSuccessfulLoad, entityMeta.lastSuccessfulLoad);
			});

			callback(result); // Return full result to the caller of getAll
		}

		// 	Initialize data retrieval for each entity in list (e.g. refresh from
		//		server) and subscribe to result(s).
		entities.forEach(function (entityName) {
			_getEntitiesCalls[callerId].push({entityName: entityName, callback: updateResult});
			subscribe(entityName, updateResult);

			let entityRetriever = _store.entities[entityName]._retriever;
			entityRetriever(); //initialize data request
		});

		// Collect data syncronyously, via callback
		updateResult();
	}

	function stopGettingEntities(callerId) {
		if (!callerId) {
			throw new Error("callerId not supplied for stopGettingEntities call");
		}
		if (!Array.isArray(_getEntitiesCalls[callerId])) {
			console.warn("Specified callerId not registered", callerId);
			return false;
		}

		_getEntitiesCalls[callerId].forEach(function (obj) {
			unsubscribe(obj.entityName, obj.callback);
		});
	}

	//
	//	Define interface to ask for a list of entities and receive update on
	//		successful load/update of all of them.
	//
	function getAll(ent, cback, callerId) {
		let callback = cback || noop,
			entities = makeList(ent);

		getEntities(entities, function (result) {
			if (!result.isLoading && !result.loadingError) {
				let resultProcessed = {};
				$.each(result["entities"], function (key, value) {
					resultProcessed[key] = value.data;
				});
				callback(resultProcessed);
			}
		}, callerId);
	}


	//
	//	Define interface for currency exchange service (sync + 2 x async).
	//	Callback is called twice: with client-side calc, and then with server-
	//	-side calc.
	//		callback(result, initialSettings, isServerSideCalculated)
	//
	function exchange(settings) {
		let currency = _store.entities["currency"];
		if (currency["meta"]["lastSuccessfulLoad"] <= 0) {
			exchange.stack.push(settings);
		}
		else {
			exchangeInner(settings, currency["meta"]["data"]["exchangeRates"]);
		}
	}

	exchange.stack = [];

	subscribe("currency", function oneTimeExchangeRateSubscription(changedEntity) {
		//if success - call stack and unsubscribe
		if (changedEntity["meta"]["lastSuccessfulLoad"] > 0) {
			exchange.stack.forEach((settings) => {
				exchangeInner(settings, changedEntity["meta"]["data"]["exchangeRates"]);
			});

			unsubscribe("currency", oneTimeExchangeRateSubscription);
		}
	});
	_store.entities["currency"]["_retriever"]();

	function exchangeInner(settings, exchangeRates) {
		let {fromCurrency, toCurrency, amount,
			fromAmount = amount, toAmount = null, precision,
			callback = noop, callerId = "default",
			debounceTime = _servicesConfig["exchange"]["timeout"],
			calculateOnlyOnClient = false} = settings;

		let hasFromAmount = (typeof(fromAmount) === "number" && fromAmount >= 0),
			hasToAmount = (typeof(toAmount) === "number" && toAmount >= 0);


		if (!fromCurrency || !toCurrency) {
			throw new Error("Field 'fromCurrency' or 'toCurrency' not supplied to exchange service call");
		}
		if (!hasFromAmount && !hasToAmount) {
			throw new Error("Valid field 'fromAmount' or 'toAmount' not supplied to exchange service call");
		}
		if (hasFromAmount && hasToAmount) {
			console.warn("Both 'fromAmount' and 'toAmount' provided; will ignore 'fromAmount'");
		}
		if (typeof(amount) !== "undefined") {
			console.warn("'amount' is deprecated and will be removed. Use 'fromAmount' or 'toAmount'");
		}


		function calculateSync() {
			if (hasToAmount) {
				return toPrecision(toAmount / exchangeRates[fromCurrency][toCurrency], precision)
			}
			else {
				return toPrecision(exchangeRates[fromCurrency][toCurrency] * fromAmount, precision)
			}
		}


		function serverCall() {
			// Service does not exist yet
			/*
			return $.ajax({
				url: "invalidExchangeUrl",
				type: "GET",
				dataType: "json",
				success: function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error: function(xhr, ajaxOptions, thrownError) {
					console.error("Failed to call exchange server service", thrownError);
				},
			});
			*/

			return callback(calculateSync(), settings, true); //fake
		}


		// finally - callback with sync calculation, debounce async
		let syncResult = calculateSync();

		callback(syncResult, settings, false);
		if (!calculateOnlyOnClient) {
			_debounce("exchange." + callerId, serverCall, debounceTime);
		}
	}



	//
	//	Define interface for getting country data for
	//	money transfers (2 x async)
	//		callback(result, countryId, isServerSideCalculated)
	//
	let _countryTransferDataCache = {}; //Possibly move this somewhere...
	function getCountryTransferData(countryId, callback) {
		if (_countryTransferDataCache[countryId]) {
			callback(_countryTransferDataCache[countryId], countryId, false);
		}
		var url =  _servicesConfig["getCountryTransferData"]["url"].replace("$(countryId)", countryId),
			success = function (data, textStatus, xhr) {
			_countryTransferDataCache[countryId] = data;
			callback(data, countryId, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
			console.error("Failed to call getCountryTransferData service", thrownError);
			};
		getAjaxRequest(url, "GET", "json", success, error);
	}

	//
	//	  Define interface for getting client data for transfer money to phone number
	//			  callback(result, phoneNumber, isServerSideReturnData)
	//

	function clientByIban(beneficiaryNumber, callback) {
		function serverCall() {
			var url =  _servicesConfig["clientByIban"]["url"] + beneficiaryNumber,
				success = function (data, textStatus, xhr) {
					callback(data, beneficiaryNumber, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call clientByIban service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("clientByIban", serverCall);
	}


	function clientByPhone(phoneNumber, callback) {
		function serverCall() {
			var url =  _servicesConfig["clientByPhone"]["url"] + phoneNumber,
				success = function (data, textStatus, xhr) {
					callback(data, phoneNumber, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call clientByPhone service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("clientByPhone", serverCall);
	}




	//	  Define interface for getting client data for transfer money to facebook number
	//			  callback(result, number, isServerSideReturnData)
	//

	function clientByFacebook (number, callback) {
		function serverCall() {
			var url =  _servicesConfig["clientByFacebook"]["url"] + number,
				success = function (data, textStatus, xhr) {
					callback(data, number, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call clientByFacebook service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("clientByFacebook", serverCall);
	}

	//	  Define interface for getting bank name by SWIFT code
	//			  callback(result, number, isServerSideReturnData)
	//

	function getBankBySWIFT (number, callback) {
		function serverCall() {
			var url =  _servicesConfig["getBankBySWIFT"]["url"] + number,
				success = function (data, textStatus, xhr) {
					callback(data, number, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call getBankBySWIFT service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("getBankBySWIFT", serverCall);
	}

	//	  Define interface for setting new password for user
	//			  callback(result, isServerSideReturnData)
	//

	function changePassword (str, callback) {
		function serverCall() {
			var url =  _servicesConfig["changePassword"]["url"] + str,
				success = function (data, textStatus, xhr) {
					callback(data, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call changePassword service", thrownError);
					callback(thrownError, false)
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("changePassword", serverCall);
	}

	//
	//	  Define interface for sending sms to confirm user
	//			  callback(result, phoneNumber, isServerSideReturnData)
	//

	function sendSmsWithTemporaryCode(phoneNumber, callback) {
		var url =  _servicesConfig["sendSmsWithTemporaryCode"]["url"] + phoneNumber,
			success = function (data, textStatus, xhr) {
				callback(data, phoneNumber, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call sendSmsWithTemporaryCode service", thrownError);
			};
		getAjaxRequest(url, "GET", "json", success, error);

	}

	//
	//	  Define interface for confirming user by sms code
	//			  callback(result, code, isServerSideReturnData)
	//

	function checkTemporaryCode(code, callback) {
		var url =  _servicesConfig["checkTemporaryCode"]["url"] + code,
			success = function (data, textStatus, xhr) {
				callback(data, code, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call checkTemporaryCode service", thrownError);
			};
		getAjaxRequest(url, "GET", "json", success, error);

	}

	//
	//	  Define interface for getting active processes for user in public area
	//			  callback(result, isServerSideReturnData)
	//

	function getPublicProcesses(callback) {
		var url =  _servicesConfig["getPublicProcesses"]["url"],
			success = function (data, textStatus, xhr) {
				callback(data, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call getPublicProcesses service", thrownError);
			};
		getAjaxRequest(url, "GET", "json", success, error);

	}

	//
	//	  Define interface for getting active processes for user in private area
	//			  callback(result, isServerSideReturnData)
	//

	function getActiveProcesses(param) {
		let {
			offset, //начало
			size, //количество(1000)
			processStatus,
			callback //статус запрашиваемых процессов
		} = param;

		var url =  _servicesConfig["getActiveProcesses"]["url"] +
			`?offset=${offset}&size=${size}`
			+ ((processStatus) ? ("&processStatus=" + encodeURIComponent(processStatus)) : ''),
			success = function (data, textStatus, xhr) {
				callback(data, param, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call getActiveProcesses service", thrownError);
			};
		getAjaxRequest(url, "GET", "json", success, error);

	}


	//
	//	Define interface for documentList.

	function ecmShowDocumentList({processId, documentType, documentNumber, documentId, iin, callback}) {

		let correctUrl = _servicesConfig["ecmDocumentList"]["url"]
			+ encodeURIComponent(
				_servicesConfig["ecmDocumentList"]["encodedUrl"]
				+ ((processId || documentType || documentId) ? "?" : "")
				+ [((processId) ? ("ProcessId=" + processId) : ""),
					((documentType) ? ("DocumentType=" + documentType) : ""),
					((documentNumber) ? ("DocumentNumber=" + documentNumber) : ""),
					((documentId) ? ("Id=" + documentId) : ""),
					((iin) ? ("iin=" + iin) : "")] // this parametr is temporary
					.filter((item) => {
						return !!item
					})
					.join("&")
			);


		let encodeUpdateUrl = (dId) => {
			return _servicesConfig["ecmDocumentUpdate"]["url"]
				+ encodeURIComponent(_servicesConfig["ecmDocumentUpdate"]["encodedUrl"].replace("$(documentId)", dId))
		};

		let encodeDownloadUrl = (dId, dName, dExt) => {
			let totalName = dName; // + "." + dExt.slice(dExt.lastIndexOf("/") + 1);

			return _servicesConfig["ecmDocumentDownload"]["url"]
				+ encodeURIComponent(_servicesConfig["ecmDocumentDownload"]["encodedUrl"].replace("$(documentId)", dId).replace("$(documentName)", encodeURIComponent(totalName)))
		};

		let encodePreviewUrl = (dId) => {
			return _servicesConfig["ecmDocumentPreview"]["url"]
				+ encodeURIComponent(_servicesConfig["ecmDocumentPreview"]["encodedUrl"].replace("$(documentId)", dId))
		};

		let success = function (data, xhr) {
				let result = data["documents"];

				//cut curl-braces and add image and download urls

				if (result && result.length != 0) {
					result.forEach((item) => {


						item["id"] = (item["id"]).slice(1, -1);

						item["imageUrl"] = encodePreviewUrl(item["id"]);
						//item["imageUrl"] = null;
						item["downloadUrl"] = encodeDownloadUrl(item["id"], item["fileName"], item['mimeType']);
						item["updateUrl"] = encodeUpdateUrl(item["id"]);
					})
				}

				callback(result, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call ecmShowDocumentList service", thrownError);
			};


			//console.log("correctUrl", correctUrl);
		return getAjaxRequest(correctUrl, "GET", "json", success, error);
	}


	//	  Define interface for getting commission for all processes.
	//			  callback(result, settings, isServerSideCalculated)
	//

	function getCommission(settings) {
		let { amount, accountCurrency, currency = "KZT", providerId,
			callerId = "default", callback,
			debounceTime = _servicesConfig["getCommission"]["timeout"] } = settings;
		if (typeof(accountCurrency) === "undefined" || typeof(amount) !== "number" || !providerId || !callback) {
			throw new Error("Mandatory settings not supplied to payment commission service call");
		}

		function serverCall() {
			let url = _servicesConfig["getCommission"]["url"] +
					`?amount=${settings.amount}&currency=${settings.currency}&accountCurrency=${accountCurrency}&provider=${settings.providerId}`,
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					console.error("Failed to call payment commission server-side service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		// finally - debounce async
		_debounce("getCommission." + callerId, serverCall);
	}

	function getInterestAmount(settings) {
		let {
			currency, //валюта ("KZT", "USD", "EUR")
			amount, //сумма (1000)
			capitalizationType, //период времени (no/day/month/year)
			duration, // колличество дней (180)
			openDate, //дата открытия вклада (01.01.2015)
			productCode = "standart", // hardcode
			callback,
			debounceTime = _servicesConfig["getInterestAmount"]["timeout"]
		} = settings;

		if (typeof(currency) === "undefined" || typeof(amount) !== "number" || !callback || !capitalizationType || typeof(duration) !=="number" || !openDate) {
			throw new Error("Mandatory settings not supplied to payment commission service call");
		}

		function serverCall() {
			let url =_servicesConfig["getInterestAmount"]["url"] +
					`?amount=${settings.amount}&currency=${settings.currency}&capitalizationType=${settings.capitalizationType}&duration=${settings.duration}&openDate=${settings.openDate}&productCode=${settings.productCode}`,
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					console.error("Failed to call payment commission server-side service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		// finally - debounce async
		_debounce("getInterestAmount", serverCall);
	}

	//
	//	Get interface for calculating data about generic financial
	//	operation (transaction), with currency exchange and commission(s).
	//
	//	callback(result {from, to, commission, rate, total}, settings)
	//

	function calculateTransaction(settings) {
		var transaction = {};

		{ // Check settings against type
			let {expected} = _servicesConfig["calculateTransaction"],
				err = expected(settings, "settings", "calculateTransaction", "prop");
			if (err instanceof Error) {
				throw err;
			}
		}

		let {	fromAmount, fromCurrency,
				toAmount, toCurrency,
				commission,
				callerId, callback	} = settings;
		commission = makeList(commission);



		//
		//	We consider 'from amount' calculation case.
		//
		if (typeof(toAmount) !== "number") {
			throw new Error("calculateTransaction with 'fromAmount' not implemented yet; please provide 'toAmount'.");
		}

		let resultFromAmount = () => {
				exchange({
					fromCurrency,
					toCurrency,
					toAmount,
					precision: 2,
					callback: (result, isServerSideCalculated) => {
						//console.log("result", result)
						Object.assign(transaction, {
							from: {
								currency: fromCurrency,
								amount: result,
								loading: (!isServerSideCalculated),
							}
						});
						if (isServerSideCalculated) {
							transaction.total = calculateTransactionTotal(transaction);
							callback(transaction);
						}
					},
					callerId: "calculateTransaction." + callerId + ".fromSum",
				});
			},
			// Result rate currencies are inverted!
			resultRate = () => {
				let currencyUpper = _store.entities["currency"]["meta"]["data"]["exchangeRatesUpper"];

				exchange({
					toAmount: 1,
					fromCurrency,
					toCurrency,
					precision: 7,
					callback: (result, isServerSideCalculated) => {

						Object.assign(transaction, {
							exchangeRate: {
								fromCurrency,
								toCurrency,
								rate: result,
								rateOrigin: currencyUpper[fromCurrency][toCurrency],
								loading: (!isServerSideCalculated),
							}
						});
						if (isServerSideCalculated) {
							callback(transaction);
						}
					},
					callerId: "calculateTransaction." + callerId + ".rate",
				});
			};

		transaction = {
			from: {
				currency: fromCurrency,
				amount: 0,
				loading: true,
			},
			to: {
				currency: toCurrency,
				amount: toAmount,
				loading: false,
			},
			exchangeRate: {
				fromCurrency,
				toCurrency,
				rate: 0,
				loading: true,
			},
		};
		if (commission) {
			transaction.commission = {};
			for (let commId of commission) {
				transaction.commission[commId] = {
					loading: true
				};

				getCommission({
					amount: toAmount,
					currency: toCurrency,
					accountCurrency: fromCurrency,
					providerId: commId,
					callerId: "calculateTransaction." + callerId + ".commission." + commId,
					callback: function(result, settings, isServerSideCalculated) {

						transaction.commission[commId] = Object.assign(result, {loading: false});
						transaction.total = calculateTransactionTotal(transaction);
						callback(transaction);
					}
				});
			}
		}
		resultFromAmount();
		resultRate();

//		transaction.total = calculateTransactionTotal(transaction); // Already called in prev. sync callbacks

		function calculateTransactionTotal(transData) {
			let fromTotal = transData.from.amount,
				fromLoading = transData.from.loading,
				toTotal = transData.to.amount,
				toLoading = transData.to.loading;

			let fromCommission = 0,
				toCommission = 0,
				commissionLoading = false;

			if (commission) {
				for (let commId in transData.commission) {
					let commData = transData.commission[commId];

					fromCommission += (commData.feeInAccountCurrency || 0);
					toCommission += (commData.feeInPaymentCurrency || 0);
					commissionLoading = commissionLoading || commData.loading;
				}
			}

			return {
				commission: {
					from: fromCommission,
					to: toCommission,
					loading: commissionLoading
				},
				from: {
					currency: transData.from.currency,
					amount: transData.from.amount + fromCommission,
					loading: transData.from.loading || commissionLoading,
				},
				to: {
					currency: transData.to.currency,
					amount: transData.to.amount + toCommission,
					loading: transData.to.loading || commissionLoading,
				},
			}
		}

		// First callback, with sync exchange data
//		callback(transaction); // already called
	}


	function uploadFiles({files, documentType, processId, documentNumber, updateUrl, callback, callbackError}) {

		/*validation*/
		var formData = new FormData(),
			url,
			applyTypeDocs = ["PDF", "JPG", "BMP", "PNG"],
			testApplyTypeDocs = ["PDF", "JPEG", "BMP", "PNG"],
			errorSize = "Размер загружаемого файла не должен превышать 5MB",
			errorType;

		var typeFile = (files[0].type).slice((files[0].type).indexOf("/") + 1);

		if (documentType == 'DOC_VH_PER' || documentType == 'DOC_ISH_PER') {
			applyTypeDocs.push("DOC");
			testApplyTypeDocs.push("msword")
		}

		errorType = "Допускается загрузка документов следующих типов : " + applyTypeDocs.join(", ")

		function checkTypeFile(type) {
			for (var i = 0; i < testApplyTypeDocs.length; i++) {
				if (testApplyTypeDocs[i].toLowerCase() == type) {
					return true
				}
			}

			return false
		}

		/*add headers*/
		for (let i = 0, file; file = files[i]; ++i) {
			formData.append("File", file);
			formData.append("DocumentType", documentType);
			formData.append("DocumentNumber", documentNumber);
			processId ? formData.append("ProcessId", processId) : null;
		}

		var xhr = new XMLHttpRequest();

		if (files[0].size > 5242880 && documentType !== 'VEREF') {
			callbackError(errorSize)
		} else if (!checkTypeFile(typeFile) && documentType !== 'VEREF') {
			callbackError(errorType)
		} else {
			//callbackError("")

			if (updateUrl) {
				url = updateUrl;
			} else {
				url = _servicesConfig["ecmDocumentUpload"]["url"]
					+ encodeURIComponent(_servicesConfig["ecmDocumentUpload"]["encodedUrl"]);
			}

			xhr.open('POST', url, true);
			// console.log('this["response"]',this["response"]);

			xhr.onload = function () {
				console.log('this["response"]',this["response"]);
				let item = "";
				if (JSON.parse(this["response"])["id"]) {
					item = (JSON.parse(this["response"])["id"]).slice(1, -1);
				}


				// console.log(JSON.parse(this["response"]))
				// console.log((JSON.parse(this["response"])["id"]))
				if(item !== "") storeInterface.ecmThumbReady(item, callback);
				else console.log('Error ID is empty.');
				//callback(item)
			};

			xhr.onreadystatechange = function (oEvent) {
			    if (xhr.readyState === 4) {
			        if (xhr.status !== 200) {
			        	console.log("Error: ", oEvent.originalTarget.responseText, JSON.parse(oEvent.originalTarget.responseText));
			        	callbackError(JSON.parse(oEvent.originalTarget.responseText).errorDescription);
			        }
			    }
			};

			xhr.send(formData);
		}
	}


	/*!!!!!NOT WORKING - TODO sefimov, update yshpak 01.03.2016*/
	function ecmThumbReady(dId, callback) {

		let urlExisting =_servicesConfig["ecmDocumentThumbExisting"]["url"]
			+ encodeURIComponent(_servicesConfig["ecmDocumentThumbExisting"]["encodedUrl"].replace("$(documentId)", dId));

		console.log('urlExisting:', _servicesConfig["ecmDocumentThumbExisting"]["encodedUrl"], _servicesConfig["ecmDocumentThumbExisting"]["encodedUrl"].replace("$(documentId)", dId));

		let encodePreviewUrl = (dId) => {
			return _servicesConfig["ecmDocumentPreview"]["url"]
				+ encodeURIComponent(_servicesConfig["ecmDocumentPreview"]["encodedUrl"].replace("$(documentId)", dId))
		};

		let success = function (data, xhr) {
				if (!data["isThumbExist"]) {
					setTimeout(function(){
						storeInterface.ecmThumbReady(dId, callback)
					}, 1000);
				} else {
					console.log('encodePreviewUrl(dId):',encodePreviewUrl(dId));
					callback (dId)
				}
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call ecmThumbReady service", thrownError);
			};
		return getAjaxRequest(urlExisting, "GET", "json", success, error);
	}

	function getNormativeDocument(number, outerCallback) {

		storeInterface.ecmShowDocumentList({
			documentType : "RegulatoryDocument",
			documentNumber : number,
			callback : (documents) => { outerCallback(documents[0]["downloadUrl"])}
		})
	}

	function getDocumentById (id, outerCallback) {

		storeInterface.ecmShowDocumentList({
			documentId : id,
			callback : (documents) => { outerCallback(documents[0]["downloadUrl"])}
		})
	}

	function markAsSeen(clientData, callback = noop) {
		let url =_servicesConfig["markAsSeen"]["url"],
			success = function (data, xhr) {
				console.log(data);
				callback(data, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call saveColvirClient service", thrownError);
				callback(thrownError, false);
			},
			data = JSON.stringify(clientData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function saveColvirClient(clientData, callback = noop) {
		let url =_servicesConfig["saveColvirClient"]["url"],
			success = function (data, xhr) {
				console.log(data);
				callback(data, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call saveColvirClient service", thrownError);
				callback(thrownError, false);
			},
			data = JSON.stringify(clientData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function providerByServiceCategory (category, callback) {
		let url = _servicesConfig["getServiceProviders"]["url"]
					+ `?offset=0&size=1000`
					+ ((category) ? ("&category=" + encodeURIComponent(category)) : null),
			success = function (data, textStatus, xhr) {
				callback(data, category, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call providerByServiceCategory service", thrownError);
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}

	function saveTemplate(templateData, callback = noop) {
		let url =_servicesConfig["saveTemplate"]["url"],
			success = function (data, xhr) {
				console.log(data);
				callback(data, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call saveTemplate service", thrownError);
			},
			data = JSON.stringify(templateData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function updateTemplate(templateData, callback = noop) {
		let url =_servicesConfig["updateTemplate"]["url"],
			success = function (data, xhr) {
				console.log(data);
				callback(data, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call updateTemplate service", thrownError);
			},
			data = JSON.stringify(templateData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	//	  Define interface for deleting payment templates
	//			  callback(result, isServerSideReturnData)
	//

	function deleteTemplate (id, callback) {
		function serverCall() {
			var url =  _servicesConfig["deleteTemplate"]["url"] + id,
				success = function (data, textStatus, xhr) {
					callback(data, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call deleteTemplate service", thrownError);
					callback(thrownError, false)
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("deleteTemplate", serverCall);
	}

	//
	//	To link facebook account; possibly temporary solution
	//
	function updateClient(clientData, callback = noop) {

		console.log("updateClient");

		if (Object.keys(clientData).length !== 1 || !clientData["facebookLogin"]) {
			return false;
		}

		let url =_servicesConfig["updateClient"]["url"],
			success = function (data, xhr) {
				console.log(data);
				callback(data, clientData, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call updateClient service", thrownError);
			},
			data = JSON.stringify(clientData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function getOperations(settings) {
		let {
			dateBegin, // дата с (01.01.2015)
			dateEnd, // дата по (01.01.2015)
			start, // индекс начала выборки
			size, // количество операций для выборки
			iban, // iban если есть
			callback
			} = settings;
		if (typeof(start) !== "number" || typeof(size) !== "number" || !callback || !dateBegin || !dateEnd) {
			throw new Error("Mandatory settings not supplied to get operations service call");
			}
		function serverCall() {
			let url =_servicesConfig["getOperations"]["url"] +
					`?dateBegin=${settings.dateBegin}&dateEnd=${settings.dateEnd}&start=${settings.start}&size=${settings.size}`
					+ ((iban) ? ("&iban=" + encodeURIComponent(iban)) : ''),
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					console.error("There is no operation information available for this user", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		// finally - debounce async
		_debounce("getOperations", serverCall);
	}

	function checkVacantUser(callback) {
		function serverCall() {
			let url =_servicesConfig["checkVacantUser"]["url"],
				success = function(data, textStatus, xhr) {
					console.log('data',data);
					callback(data, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					console.error("There is no operation information available for this user", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}
		// finally - debounce async
		_debounce("checkVacantUser", serverCall);
	}

	function checkIIN(settings) {
		let {iin,callback} = settings;

		function serverCall() {
			let url =_servicesConfig["checkIIN"]["url"] + `${settings.iin}`,
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					callback({error: true});
					// console.error("There is no operation information available for this user", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		// finally - debounce async
		_debounce("checkIIN", serverCall);
	}

	function structIIN(settings) {

		let {iin,callback} = settings;
		function serverCall() {
			let url =_servicesConfig["structIIN"]["url"] + `${settings.iin}` + '&residentBOOL=1',
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					callback({error: true});
					// console.error("There is no operation information available for this user", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("structIIN", serverCall);
	}

	function checkVIN(settings) {
		let {vin,
			number,
			nomer,
			callback} = settings;

		function serverCall() {
			let url =_servicesConfig["checkVIN"]["url"]
			+ ((settings.vin) ? (settings.vin) : '') + '&number='
			+ ((settings.number) ? (settings.number) : '') + '&nomer='
			+ ((settings.nomer) ? (settings.nomer) : ''),
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					callback({error: true});
					// console.error("There is no operation information available for this user", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		// finally - debounce async
		_debounce("checkVIN", serverCall);
	}

	function getItemsAltynStruct(settings) {

		let {item,callback} = settings;

		function serverCall() {
			let url =_servicesConfig["getItemsAltynStruct"]["url"] + `${settings.item}`,
				success = function(data, textStatus, xhr) {
					callback(data, settings, true);
				},
				error = function(xhr, ajaxOptions, thrownError) {
					callback({error: true});
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}
		_debounce("getItemsAltynStruct", serverCall);
	}

	function setClientAltyn(clients, callback, errorC) {
		function serverCall() {
			let url =_servicesConfig["setClientAltyn"]["url"],
				success = function (obj, xhr) {
					callback(obj, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					errorC(thrownError)
				},
				data = JSON.stringify(clients);
			return getAjaxRequest(url, "POST", "application/json", success, error, data);
		}
		_debounce("setClientAltyn", serverCall);
	}

	function checkRefsExists(iin,docNumber,callback) {
		let url =_servicesConfig["checkRefsExists"]["url"].replace("$(iin)", iin).replace("$(docNumber)", docNumber),
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call service", thrownError);
			};
		getAjaxRequest(url, "GET","json", success, error);
	}

	function getDocCertificates(rawData, callback, errorC) {

		let url =_servicesConfig["getDocCertificates"]["url"],
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				errorC(thrownError)
			},
			data = JSON.stringify(rawData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function getDepositCertificates(rawData, callback, errorC) {

		let url =_servicesConfig["getDepositCertificates"]["url"],
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				errorC(thrownError)
			},
			data = JSON.stringify(rawData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function getDocRequisites(rawData, callback, errorC) {

		let url =_servicesConfig["getDocRequisites"]["url"],
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				errorC(thrownError)
			},
			data = JSON.stringify(rawData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function getDocCurrent(from, to, issueDate, iban, callback) {

		let url =_servicesConfig["getDocCurrent"]["url"]
			+ ((from) ? ("?from=" + encodeURIComponent(from)) : null)
			+ ((to) ? ("&to=" + encodeURIComponent(to)) : null)
			+ ((issueDate) ? ("&issueDate=" + encodeURIComponent(issueDate)) : null)
			+ ((iban) ? ("&iban=" + encodeURIComponent(iban)) : null),
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call service", thrownError);
			};
		getAjaxRequest(url, "GET","json", success, error);
	}

	function getDocDeposit(from, to, issueDate, iban, callback) {

		let url =_servicesConfig["getDocDeposit"]["url"]
			+ ((from) ? ("?from=" + encodeURIComponent(from)) : null)
			+ ((to) ? ("&to=" + encodeURIComponent(to)) : null)
			+ ((issueDate) ? ("&issueDate=" + encodeURIComponent(issueDate)) : null)
			+ ((iban) ? ("&iban=" + encodeURIComponent(iban)) : null),
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call service", thrownError);
			};
		getAjaxRequest(url, "GET","json", success, error);
	}

	function getDepositContractById(contractId) {
		return _servicesConfig["getDepositContractById"]["url"]
			+ encodeURIComponent(_servicesConfig["getDepositContractById"]["encodedUrl"].replace("$(documentId)", contractId))
	}

	function passportReader(fileName, documentType, files, callback, errorC) {
		console.log('fileName', fileName);
		console.log('documentType', documentType);
	// function passportReader({files, documentType, processId, documentNumber, updateUrl, callback, callbackError}) {

		/*validation*/
		var formData = new FormData(),
			url;

		/*add headers*/
		for (let i = 0, file; file = files[i]; ++i) {
			formData.append("file", file);
			formData.append("fileName", fileName);
			formData.append("docType", documentType);
		}

		var xhr = new XMLHttpRequest();

		url =_servicesConfig["dataCapUpload"]["url"]
			+ encodeURIComponent(_servicesConfig["dataCapUpload"]["encodedUrl"]);

		xhr.open('POST', url, true);
		xhr.onload = function () {


			let item = (JSON.parse(this["response"]));
			// let item = (JSON.parse(this["response"])["id"]).slice(1, -1);
			callback(item)

			// console.log(item);

			// callback(item)
			// returnStatus(this.status);
			if (xhr.status != 200 && xhr.status != 0) {
				errorC(false);
				console.log('first',500);
			}
		};
		xhr.onerror = function() {
			errorC(false);
			console.log('xhr.upload.onerror',500);
		}

		console.log('xhr',xhr);
		if (xhr.status != 200 && xhr.status != 0) {
			errorC(false);
			console.log('second',500);
		}
		if (xhr.status == 504 || xhr.status == 500) {
			errorC(false);
			console.log('last',500);
		}

		xhr.send(formData);

		if (xhr.status != 200 && xhr.status != 0) {
			errorC(false);
			console.log('second',500);
		}
		if (xhr.status == 504 || xhr.status == 500) {
			errorC(false);
			console.log('last',500);
		}

		xhr.onreadystatechange = function() {

		  if (this.status != 200) {
		   	errorC(false);
			console.log('new_ last',500);
		  }

		  // получить результат из this.responseText или this.responseXML
		}
	}

	function getBatchAttrDataCap (queueId, callback, errorC) {
		function serverCall() {
			let url =_servicesConfig["getBatchAttrDataCap"]["url"].replace("$(queueId)", queueId),
				success = function (obj, xhr) {
					callback(obj, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					errorC(thrownError);
					console.error("Failed to call service", thrownError);
				};
			return getAjaxRequest(url, "GET","json", success, error);
		}

		// finally - debounce async
		_debounce("getBatchAttrDataCap", serverCall);

	}

	function getDataCapFile (fileName, queueId, batchId, callback) {
		// "url": "$(contextRoot)/services/rest/ecm/getDataCapFile?fileName=$(fileName)&queueId=$(queueId)&batchId=$(batchId)"

			let url =_servicesConfig["getDataCapFile"]["url"].replace("$(fileName)", fileName).replace("$(queueId)", queueId).replace("$(batchId)", batchId),
				success = function (obj, xhr) {

					// let demoObj = {
					//   "documentNumber": "45 55 666999",
					//   "dateIssue": "12.04.2000",
					//   "authority": "ОФМС",
					//   "dateExpiry": "12.04.2016"
					// }
					// callback(demoObj, true);
					callback(obj, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call service", thrownError);
				};
			getAjaxRequest(url, "GET","json", success, error);
	}

	function getDepositContractByIban(iban , callback) {
		let url =_servicesConfig["getDepositContractByIban"]["url"]
			+ encodeURIComponent(_servicesConfig["getDepositContractByIban"]["encodedUrl"].replace("$(iban)", iban)),
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call service", thrownError);
			};
		getAjaxRequest(url, "GET", "json", success, error);
	}

	function getUnauthorizedFeedbackCase(messageData, callback, errorC) {
		let url = _servicesConfig["getUnauthorizedFeedbackCase"]["url"],
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				errorC(thrownError)
			},
			data = JSON.stringify(messageData);
		getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function getP2POrder({callback}) {

		let url =_servicesConfig["getP2POrder"]["url"],
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call getP2POrder service", thrownError);
			};
		getAjaxRequest(url, "GET","json", success, error);
	}

	function getAllBills(callback) {

		let url = _servicesConfig["getAllBills"]["url"],
			success = function (obj, xhr) {
				callback(obj, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				errorC(thrownError)
			};
		getAjaxRequest(url, "POST", "application/json", success, error, {});
	}


	//
	// Facebook interfaces
	//

	let _fbAppId = window.altyn.fbAppId;

	// Getting url for logging in facebook. No JS redirect! Should be <a> element with href
	function getFBLoginUrl({accountLinking} = {}) {

		console.log("getFBLoginUrl ");
		//TODO security - pass state here and check at _handleRedirectFromFb;
		return "https://www.facebook.com/dialog/oauth" +
				"?client_id=" + _fbAppId +
				"&scope=public_profile,user_friends,email" +
				"&response_type=token" +
				"&redirect_uri=" + encodeURIComponent(
										location.origin +
										location.pathname +
										((accountLinking)
											? "?accountLinking=true"
											: location.search)
									);
	}
	// Getting url for inviting person to Altyn 24. No JS redirect! Should be <a> element with href
	function getFBInviteUrl() {
		console.log("getFBInviteUrl ");

		//TODO security - pass state here and check at _handleRedirectFromFb;
		return "https://www.facebook.com/dialog/send" +
				"?app_id=" + _fbAppId +
				"&link=" + encodeURIComponent(/*location.origin*/"https://www.altyn-i.kz") +
				"&redirect_uri=" + encodeURIComponent(
										location.origin +
										location.pathname +
										location.search
									);
	}

	// Internal call to determine if long token exists
	function _getFBTokenStatus(callback) {

		// console.log("_getFBTokenStatus ");

		let url = _servicesConfig["fbTokenStatus"]["url"],
			success = callback,
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error at getting FB Token Status", thrownError);
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}
	// Internal call to generate long token
	function _generateFBToken({callback, shortToken}) {

		console.log("_generateFBToken ");

		let url = _servicesConfig["generateFBToken"]["url"] + shortToken,
			success = callback,
			error = function(xhr, ajaxOptions, thrownError) {

				console.error("Error at generating long FB Token", thrownError);
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}
	// Internal call to get fb user info, for updating clinet in siebel without long token
	function _getFBMeWithShortToken({callback, shortToken}) {

		console.log("_getFBMeWithShortToken ");

		let url = _servicesConfig["fbHost"]["url"] + _servicesConfig["fbMe"]["url"] + "?access_token=" + shortToken,
			success = callback,
			error = function(xhr, ajaxOptions, thrownError) {

				console.error("Error at getting FB Me with short token" + JSON.stringify(thrownError));
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}

	function canCallFB() {


		console.log("canCallFB ");
		console.log("_store._fbAllowed ", _store._fbAllowed);


		return _store._fbAllowed;
	}

	// Get user profile
	function getFBMe(callback) {

		console.log("getFBMe ");

	// crash facebook fbMe : _servicesConfig["fbProxy"]["url"] + _servicesConfig["fbMe"]["url"] + (!window.FBtestFake ? '23' : '')
	// on error or success set window.FBtestFake = true;
		let url = _servicesConfig["fbProxy"]["url"] + _servicesConfig["fbMe"]["url"],
			success = function(data, textStatus, xhr) {
				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				if(!window.fbCountError) window.fbCountError = 0;
				if(window.fbCountError < 10){
					console.error("Error at getting FB Me" + JSON.stringify(thrownError));
					_handleFb();
					getFBMe(callback);
					window.fbCountError++;
				}
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}

	// Get user friends (with profile pic)
	function getFBFriends(callback) {

		console.log("getFBFriends ");


		let url = _servicesConfig["fbProxy"]["url"] + _servicesConfig["fbFriends"]["url"],
			success = function(data, textStatus, xhr) {

				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error at getting FB Friends", thrownError);
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}

	//Remove application from user (de-authorize)
	function deleteFbApp(callback) {


		console.log("deleteFbApp ");



		let url = _servicesConfig["fbProxy"]["url"] + _servicesConfig["fbPermissions"]["url"],
			success = function(data, textStatus, xhr) {

				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error at deleting FB App", thrownError);
			};
		return getAjaxRequest(url, "DELETE", "json", success, error);
	}

	function saveClientAddress(clientData, callback = noop) {

		console.log("saveClientAddress ");

		let url =_servicesConfig["updateClient"]["url"],
			success = function(data, textStatus, xhr) {
				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error at update client info", thrownError);
			},
			data = JSON.stringify(clientData);
		return getAjaxRequest(url, "POST", "application/json", success, error, data);
	}

	function getProfileData(url, callback) {

		console.log("getProfileData ");

		let success = function(data, textStatus, xhr) {
				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error at update client info", thrownError);
			};
		return getAjaxRequest(url, "GET", "json", success, error);
	}
	function getImageByUrl(url, callback) {

		console.log("getImageByUrl ");

		let success = function(data, textStatus, xhr) {
				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error at update client info", thrownError);
			};
		return getAjaxRequest(url, "GET", "image", success, error);
	}


	//Get translation for current task

	let translationTaskName = (taskName, callback) => {

		var url = _servicesConfig["translationTaskName"]["url"]
				+ encodeURIComponent(_servicesConfig["translationTaskName"]["encodedUrl"].replace("$(taskName)", taskName)),

			success = function (data, textStatus, xhr) {
				callback(data, taskName, true);
			},

			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call translationTaskName service", thrownError);
			};
		return getAjaxRequest(url, "GET", "json", success, error);

	};

	//Get Bank by 3 numbers of iban

	function getBankByIbanAccCode(ibanCode, callback) {
		function serverCall() {
			var url =  _servicesConfig["getBankByIbanAccCode"]["url"] + ibanCode,
				success = function (data, textStatus, xhr) {
					data = data.value;

					callback(data, ibanCode, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call getBankByIbanAccCode service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("getBankByIbanAccCode", serverCall);

	}

	//Get product card list
	function getDesignCard({id, productType, productName, productCode, currency, design, isResident, callback}) {

		let url = _servicesConfig["getDesignCard"]["url"]
			+ ((id || productType || productName || productCode || currency || design || isResident) ? "&" : "")
			+ [((id) ? ("f.id=" + id) : ""),
				((productType) ? ("f.productType=" + productType) : ""),
				((productName) ? ("f.productName=" + productName) : ""),
				((productCode) ? ("f.productCode=" + productCode) : ""),
				((currency) ? ("f.currency=" + currency) : ""),
				((design) ? ("f.design=" + design) : ""),
				((isResident) ? ("f.isResident=" + isResident) : "")]
				.filter((item) => {
					return !!item
				})
				.join("&");

		let success = function(data, textStatus, xhr) {
				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error getDesignCard", thrownError);
			};

		return getAjaxRequest(url, "GET", "json", success, error);
	}


	//Get product account list
	function getAccountProductCode({id, productType, productName, productCode, currency, design, isResident, callback}) {

		let url = _servicesConfig["getAccountProductCode"]["url"]
			+ ((id || productType || productName || productCode || currency || design || isResident) ? "&" : "")
			+ [((id) ? ("f.id=" + id) : ""),
				((productType) ? ("f.productType=" + productType) : ""),
				((productName) ? ("f.productName=" + productName) : ""),
				((productCode) ? ("f.productCode=" + productCode) : ""),
				((currency) ? ("f.currency=" + currency) : ""),
				((design) ? ("f.design=" + design) : ""),
				((isResident) ? ("f.isResident=" + isResident) : "")]
				.filter((item) => {
					return !!item
				})
				.join("&");

		let success = function(data, textStatus, xhr) {
				callback(data, true);
			},
			error = function(xhr, ajaxOptions, thrownError) {
				console.error("Error getAccountProductCode", thrownError);
			};

		return getAjaxRequest(url, "GET", "json", success, error);
	}

	function getCitiesKorona(countryISO, callback) {
		function serverCall() {
			var url =  _servicesConfig["getCitiesKorona"]["url"] + countryISO,
				success = function (data, textStatus, xhr) {
					callback(data, countryISO, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call getCitiesKorona service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("getCitiesKorona", serverCall);

	}


	function getCurrenciesKorona(cityId, callback) {
		function serverCall() {
			var url =  _servicesConfig["getCurrenciesKorona"]["url"] + cityId,
				success = function (data, textStatus, xhr) {
					callback(data, cityId, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call getCurrenciesKorona service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}

		_debounce("getCurrenciesKorona", serverCall);

	}

	function koronaTariffCalculation(settings) {
		let {
				directionID, //- берет из вызова предыдущего сервиса
				amount, //- сумма перевода в копейках/евроцентах/центах
				currency, //- валюта перевода
				payCurrency, //-  валюта оплаты
				callback,
			} = settings;

		function serverCall() {
			var url =  _servicesConfig["koronaTariffCalculation"]["url"] +
					`?amount=${settings.amount}&directionId=${settings.directionID}&currency=${settings.currency}&payCurrency=${settings.payCurrency}`,
				success = function (data, textStatus, xhr) {
					callback(data, true);
				},
				error = function (xhr, ajaxOptions, thrownError) {
					console.error("Failed to call koronaTariffCalculation service", thrownError);
				};
			return getAjaxRequest(url, "GET", "json", success, error);
		}
		_debounce("koronaTariffCalculation", serverCall);
	}


	//Notifications
	function getNotifications(booleanTypeList, callback) {

		var url =  _servicesConfig["getNotifications"]["url"] + booleanTypeList,
			success = function (data, textStatus, xhr) {
				callback(data, booleanTypeList, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call getNotifications service", thrownError);
			};

		return getAjaxRequest(url, "GET", "json", success, error);
	}

	function closeNotification(notificationId, callback) {

		var url =  _servicesConfig["closeNotification"]["url"] + notificationId,
			success = function (data, textStatus, xhr) {
				callback(data, notificationId, xhr)
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call closeNotification service", thrownError);
			};

		return getAjaxRequest(url, "GET", "json", success, error);
	}


	function openProcessByProcessId(processId, callback) {

		var url =  _servicesConfig["openProcessByProcessId"]["url"] + processId,
			success = function (data, textStatus, xhr) {
				callback(data, processId, true);
			},
			error = function (xhr, ajaxOptions, thrownError) {
				console.error("Failed to call openProcessByProcessId service", thrownError);
			};

		return getAjaxRequest(url, "GET", "json", success, error);
	}


	//
	//	Resulting API
	//
	let storeInterface = {

		getEntities,
		stopGettingEntities,
		getAll,

		exchange,
		getCommission,
		getInterestAmount,
		calculateTransaction,
		getCountryTransferData,
		clientByIban,
		clientByPhone,
		changePassword,
		uploadFiles,
		checkIIN,
		structIIN,
		checkVIN,
		getItemsAltynStruct,
		setClientAltyn,
		checkRefsExists,
		checkVacantUser,
		ecmShowDocumentList,
		clientByFacebook,
		getBankBySWIFT,
		getNormativeDocument,
		ecmThumbReady,
		providerByServiceCategory,
		saveTemplate,
		saveColvirClient,
		updateTemplate,
		deleteTemplate,
		updateClient,
		saveClientAddress,
		getDocumentById,
		getDepositContractById,
		getDepositContractByIban,
		getAjaxRequest,
		getOperations,
		getDocCertificates,
		getDepositCertificates,
		getDocRequisites,
		getDocCurrent,
		getDocDeposit,
		getActiveProcesses,
		getUnauthorizedFeedbackCase,
		getP2POrder,
		sortArrayByProperty,
		getProfileData,
		passportReader,
		getBatchAttrDataCap,
		getDataCapFile,
		toTitleCase,
		formatNumber,
		getCardType,
		getBankByIbanAccCode,
		getDesignCard,
		getAccountProductCode,

		// For public services/rest/ecm/allBills
		getAllBills,

		// For public area
		sendSmsWithTemporaryCode,
		checkTemporaryCode,
		getPublicProcesses,
		getImageByUrl,
		// End for public area

		// Facebook
		fbServices: {
			getFBLoginUrl,
			getFBInviteUrl,
			canCallFB,
			getFBMe,
			getFBFriends,
			deleteFbApp,
		},
		// End Facebook
		translationTaskName,

		subscribe,
		unsubscribe,

		getCitiesKorona,
		getCurrenciesKorona,
		koronaTariffCalculation,

		notifications : {
			getNotifications,
			closeNotification,
			openProcessByProcessId
		}
	};

	return storeInterface;
}


export default {
	lib: {
		translate,
		getTranslatorWithAdditional,
		getUserAgent,
		getLocale,
		getDesign,
		formatNumber,
		toPrecision,
		isCardNumberValid,
		toTitleCase,
		getUrlParams,
		createQueryString,
		getCookie,

		noop,
		fallThrough,
		makeList,
	},
	getDataStore: getDataStore,
	configureTranslate,
};
