Brief description of main methods
=================================


calculateTransaction
--------------------

Service dataStore.calculateTransaction() is used to easily calculate bunch of 
data relevant to most types of transactions. (By 'easily' we mean transparent 
control flow and automatic exchange rates and commission handling).


#### Main usage example:

	dataStore.calculateTransaction({
		fromCurrency: "KZT", 
			// Source currency (e.g. client's account/card currency)


		toCurrency: "USD", 
			// Target currency (e.g. friend's account currency, or 
			// service provider accepted currency, etc...)

		toAmount: 100, 
			// Amount that should come to target account, in target currency. In
			// this example we say "100 USD should come to my friend's account, 
			// from my KZT account" 


		commission: "TRA01", // Or ["TRA01", "TRA03", ...]. 
			// Commission code or array of commission codes, that should be 
			// applied to transaction.

		callerId: "exampleTransaction", 
			// This uniquely identifies transaction on web page. Web page can 
			// have several ongoing transaction calculations. For them 
			// not to mess up, attach 'callerId'. 
			// ATTENTION: For forms in BPUI, this is attached automatically. For
			// widgets, supply your own 'callerId'.


		callback: (result) => {
			/* 
				Called with resulting object, containing calculated data, incl.
				commissions, exchange rates, totals.
				
				Will be called on EACH update (with respect to debounce). Can be
				partially calculated, with 'loading' === 'true'. Fully 
				calculated when 'loading' status is 'false'. 

				See example below.
			*/
		},
	});


#### Result example:
			
	{
		"from": {
			"currency": "KZT",
			"amount": 30855,			// Calculated using exchange rates. This is how much we spend 'from.currency' to buy 'to.amount' of 'to.currency' 
			"loading": false
		},
		"to": {
			"currency": "USD",
			"amount": 100,
			"loading": false
		},
		"exchangeRate": {
			"fromCurrency": "KZT",
			"toCurrency": "USD",
			"rate": 308.55,				// Calculated.
			"loading": false
		},
		"commission": {					// Calculated for each commission code separately. For total commission, see 'total' field below, 'commission' subfield.
			"TRA01": {
				"fee": 0,
				"feePercent": 0,
				"feeCurrency": "KZT",
				"feeInAccountCurrency": 0,
				"feeInPaymentCurrency": 0,
				"loading": false
			}
		},
		"total": {						// (mostly) Calculated totals.
			"commission": {				
				"from": 0,				// Total commission in 'from' currency.
				"to": 0,				// Total commission in 'to' currency.
				"loading": false		// 'False' when all commissions are loaded/calculated.
			},
			"from": {
				"currency": "KZT",
				"amount": 30855,		// Main result, kind of. How much will be deducted from source account. Includes commissions.
				"loading": false		// 'False' when all result components are loaded/calculated, including 'from.amount' and 'total.commission.from'
			},
			"to": {
				"currency": "USD",
				"amount": 100,
				"loading": false
			}
		}
	}

