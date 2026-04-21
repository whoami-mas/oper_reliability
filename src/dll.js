/*$(document).ready(function() {
            $('#body-form').on('change', function() {
                receive_data();
                loading_data();
            });
            loading_data();
        });*/

$(window).resize(function() {	reHeightElementsInTd(); });
$(window).load(function() { reHeightElementsInTd(); });
function reHeightElementsInTd() { $('.full-height').each( function(  ) { $(this).css("height", "calc("+$(this).parent('td').css("height")+" - 2px - 2px - 3px)"); }); }

//Parse data

function loading_data(){
	let fields = {};

	if ($("#exchange_field").length)
		if ($('#exchange_field').val()) 
			fields = JSON.parse($("#exchange_field").val());
		
	if (Object.keys(fields).length !== 0) { // no data => no action
		completion_period_value(fields.period);
		completion_risks_value(fields);

		if(fields.risks_value){
			const values = Object.values(fields.risks_value);
			let count_fixed_risks = values.filter(f=> f.is_fixed).length;
			get_plural_form(count_fixed_risks);
		}
	}
}




//Other functions


//Set period
function completion_period_value(period_value){
	$("#quart").text(period_value.quart);
	$("#year").text(period_value.year);
}




//Set mark | remove mark fixed risk
function mark_exceeded_limit(index_risk){
	$("#row_"+index_risk).addClass("marked");
};
function remove_mark_exceeded_limit(index_risk){
	$("#row_"+index_risk).removeClass("marked");
}




//Updating the risk numbering
function reset_number() {
	let elements = $('tr[id^="row_"]');
	let num = 1;	
	
	$(elements).each(function(index, element) {
		if (!$(element).hasClass('hidden')) {
			$(element).children('td').first().text(num);
			num = num + 1;

		}		
	});
}




function get_plural_form(count_risks){
	if(count_risks > 0)
	{
		let word = `зафиксировано ${count_risks}`;
		
		if(count_risks === 1)
			word += " риск-событие";
		else if(count_risks > 1 && count_risks < 5)
			word += " риск-события";
		else
			word += " риск-событий";
		
		$("#count_risks").text(word);	
	}
	else{
		$("#count_risks").text("риск событий не зафиксировано");
	}
}



//Send data to application
function send_json(type){
	const data = $("#exchange_field").val();
	window.cefSharp.postMessage(JSON.stringify({ type_action: type, data: JSON.parse(data) }));
}