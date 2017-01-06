const timezone = 8 * 60; //data from SING

fetch('data.json').then(res =>{
// 	console.log(res.json());
	return Promise.resolve(res.json());
}).then(closures =>{
	var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	let clousreSample = {
		sql_timestamp: '',
		total: 0,
		num_of_order: 0,
		pax: 0,
		net_total: 0,
		gross_total: 0,
		discount: 0
	};

	/**
	 * Fullfill each day of year with default value to draw
	 */
	//Loop through 12 months
	let today = moment().utcOffset(timezone);
	let year = today.year();
	for(let month = 1; month <= 12; month++){
		let firstDayOfMonth = moment(`${year}-${month}-1`, 'YYYY-M-D').utcOffset(timezone);
		let lastDayOfMonth = firstDayOfMonth.clone().endOf('month');

		let start = firstDayOfMonth.date(), end = lastDayOfMonth.date();

		for(let day = start; day <= end; day++){
			let current = moment(`${year}-${month}-${day}`, 'YYYY-M-D').utcOffset(timezone);
			let sql_timestamp = current.format('YYYY-MM-DD HH:mm:s');
			let closure = Object.assign({}, clousreSample);
			closure.sql_timestamp = sql_timestamp;
			closures.push(closure);
		}
	}
});