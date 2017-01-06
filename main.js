/**
 * Timezone of closure, currently in SING
 */
const timezone = 8 * 60;

/**
 * Config heatmap color
 */
const startColor = '#03A9F4';
const endColor = '#01579B';

fetch('data.json').then(res =>{
// 	console.log(res.json());
	return Promise.resolve(res.json());
}).then(closures =>{
	var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	/**
	 * Format closure to timestamp
	 */
	closures.forEach(closure => {
		let momentObj = moment(closure.closed_timestamp, 'YYYY-MM-DD HH:mm:ss').utcOffset(timezone);
		closure.timestamp = momentObj.unix();
		closure.momentObj = momentObj;
	});
	/**
	 * For debug
	 */
	window.closures = closures;

	let clousreSample = {
		closed_timestamp: '',
		timestamp: 0,
		momentObj: {},
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
			let sql_timestamp = current.format('YYYY-MM-DD HH:mm:ss');
			let timestamp = current.unix();
			let closure = Object.assign({}, clousreSample);
			closure.closed_timestamp = sql_timestamp;
			closure.timestamp = timestamp;
			closure.momentObj = current;
			closures.push(closure);
		}
	}

	/**
	 * Create dimenstion on date
	 */
	let ndx = crossfilter(closures);

	let dayOfYearDim = ndx.dimension(closure => {
		let dayOfWeek = closure.momentObj.isoWeekday(); //0-6
		let weekOfYear = closure.momentObj.isoWeek(); //1-53
		return [dayOfWeek, weekOfYear];
	});
	
	let countTotal = dayOfYearDim.group().reduceSum(function(closure){
		return formatTwoDecimalPlace(closure.total);
	});
	
	let totalRange = [0, 4000];

	const heatColorMapping = function(d){
		// console.log(d);
		if(d > totalRange[1])
			return endColor;
		if(d <= 0)
			return "white";
		// console.log(d3.scale.linear().domain(countDeviceRange).range([startColor, endColor])(d));
		return d3.scale.linear().domain(totalRange).range([startColor, endColor])(d);
	};

	heatColorMapping.domain = function(){
		return totalRange;
	};

	let width = 713;
	let height = 200;

	width = 900;
	height = 175;

	let monthlyReportChart = dc.heatMap('#daily-report-heatmap');
	monthlyReportChart
		.width(width)
		.height(height)
		.xBorderRadius(0)
		.yBorderRadius(0)
		.dimension(dayOfYearDim)
		.group(countTotal)
		.keyAccessor(function(d){
			return d.key[1];
		})
		.valueAccessor(function(d){
			return d.key[0];
		})
		.colorAccessor(function(d){
			return +d.value;
		})
		.title(function(d){
			return " Σ Devices: " + d.value;
		})
		.colors(heatColorMapping)
		.calculateColorDomain()
	;

	// monthlyReportChart.colsLabel(function(d){//d = 16782
	// 	var timestamp = d * (86400); // d * (24 * 60 * 60);
	// 	var date = new Date(timestamp * 1000);
	// 	return monthNames[date.getMonth()] + '-' + date.getDate();
	// });

	// monthlyReportChart.rowsLabel(function(d){//d = 16782
	// 	let colLabel = '';
	// 	if(d % 12 == 0)
	// 		colLabel = d/12 + 'h';
	// 	return colLabel;
	// });

	// monthlyReportChart.colsLabel(function(d){//d = 16782
	// 	let date = new Date(d * 86400 * 1000);
	// 	return date.getDate();
	// });

	dc.renderAll();
});

/**
 * Support function
 */

/**
 * Make sure number with 2 decimal place
 */
function formatTwoDecimalPlace(val){
	return Number(Number(val).toFixed(2));
}