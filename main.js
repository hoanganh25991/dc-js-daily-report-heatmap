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
		let closureTime = closure.closed_timestamp;
		/**
		 * @WARN try on modified_timestamp
		 */
		if(!closureTime){
			closureTime =  closure.modified_timestamp;
		}

		if(!closureTime){
			console.error('Closure closed_timestamp: null');
			throw closure;
		}

		let momentObj = moment(closureTime, 'YYYY-MM-DD HH:mm:ss').utcOffset(timezone);
		closure.timestamp = momentObj.unix();
		closure.momentObj = momentObj;
	});
	/**
	 * @Debug
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
	// Get out year from ONE CLOSURE
	let year = closures[0].momentObj.year();
	//Loop through 12 months
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

	let weekDim = ndx.dimension(closure => {
		let dayOfWeek = closure.momentObj.isoWeekday(); //1-7
		let weekOfYear = closure.momentObj.isoWeek(); //1-53
		return [dayOfWeek, weekOfYear];
	});

	/**
	 * @DEBUG
	 */
	window.weekDim = weekDim;
		
	let countTotal = weekDim.group().reduce(
		//add
		function (p, v){
			p.total += formatTwoDecimalPlace(v.total);
			p.momentObj = v.momentObj;
			return p;
		},
		//remove
		function (p, v){
			p.total -= formatTwoDecimalPlace(v.total);
			p.momentObj = v.momentObj;
			return p;
		},
		//init
		function (){
			return {
				momentObj: {},
				total: 0
			};
		}
	);
	/**
	 * @DEBUG
	 */
	window.countTotal = countTotal;

	// let objWithMaxTotal = countTotal.top(1)[0]; //bcs top return array
	let objWithMaxTotal = countTotal.all().reduce((x, y) => {
		return x.value.total > y.value.total ? x : y;
	});
	// console.log("max value", objWithMaxTotal.value.total);

	// let totalRange = [0, objWithMaxTotal.value.total];

	// const heatColorMapping = function(d){
	// 	if(d > totalRange[1])
	// 		return endColor;

	// 	if(d <= 0)
	// 		return "white";

	// 	return d3.scale.linear().domain(totalRange).range([startColor, endColor])(d);
	// };

	// heatColorMapping.domain = function(){
	// 	return totalRange;
	// };

	let width = 900;
	let height = 175;

	width = (45 * 53 + 80);
	height = (45 * 7 + 40)

	let dailyReportChart = dc.heatMap('#daily-report-heatmap');
	/**
	 * @DEBUG
	 */
	window.dailyReportChart = dailyReportChart;
	dailyReportChart
		.width(width)
		.height(height)
		.xBorderRadius(0)
		.yBorderRadius(0)
		.dimension(weekDim)
		.group(countTotal)
		.keyAccessor(function(d){
			return d.key[1];
		})
		.valueAccessor(function(d){
			return d.key[0];
		})
		.colorAccessor(function(d){
			return d.value.total;
		})
		.title(function(d){
			return "Σ Total: " + d.value.total;
		})
		// .colors(heatColorMapping)
		.colors(["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"])
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

	/**
	 * Handle click on cell ~ single day
	 */
	// dailyReportChart
	// 	.boxOnClick(function (countTotalObj) {
	// 		console.log('I here you');
	// 		console.log(countTotalObj);

	// 		let closureMomentObj = countTotalObj.value.momentObj;
	// 		let closureDate = closureMomentObj.format('YYYY-MM-DD');
	// 		let currentURL = window.location.href;
	// 		if(!currentURL.endsWith("/")){
	// 			currentURL += "/";
	// 		}
	// 		let dailyReportDetail = currentURL + closureDate; //bcs currentURL has end slash "/"
	// 		// window.location.href = dailyReportDetail;
			
	// 		// var filter = countTotalObj.key;
	// 		// dc.events.trigger(function () {
	// 		// 	dailyReportChart.filter(filter);
	// 		// 	dailyReportChart.redrawGroup();
	// 		// });
	// 	});

	dc.renderAll();
});

/**
 * Support function
 */

/**
 * Make sure number with 2 decimal place
 */
function formatTwoDecimalPlace(val){
	// return Number(Number(val).toFixed(2));
	return Number(val);
}