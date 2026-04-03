$(document).ready(function () {
	// set DatePicker
	//$('input.datepicker').datepicker($.datepicker.regional["ru"]).datepicker("option", "dateFormat", "dd.mm.yy");
	
	ko.bindingHandlers.date = {
	    init: function(element, valueAccessor) {
	        // Инициализация datepicker
	        $(element).datepicker({
	            dateFormat: 'dd.mm.yy',
	            onSelect: function(dateText) {
	                var observable = valueAccessor();
	                if (ko.isObservable(observable)) {
	                    observable(dateText);
	                }
	            }
	        });
	    },
	    update: function(element, valueAccessor) {
	        var value = ko.unwrap(valueAccessor());
	        if (value) {
	            $(element).datepicker('setDate', value);
	        }
	    }
	};

	ko.applyBindings(viewModel);
});

function completion_risks_value(data){
	viewModel.load_registry_technical_processes(data.registry_technical_process);
	viewModel.load_limits_base(data.limits_base);
	viewModel.has_reliability_targets(data.has_reliability_targets);
}



function identity_dependencies(){

	if (!$('.depend-block-in').is(':visible')) {
    	$('.depend-block-in').show();
	}

	viewModel.find_dependencies();
	viewModel.define_influence();
	viewModel.get_processes();
}
function get_data(){
	console.log(viewModel);
}



var viewModel ={
    registry_technical_process: ko.observableArray([]),
    registry_contracts: ko.observableArray([]),
    map_influence:ko.observableArray([]),
    limits_base: ko.observable({}),
	has_reliability_targets: ko.observable(),
	processes: ko.observableArray([]),

    load_registry_technical_processes: function(data) {
        var items = [];
        for (var id in data) {
            if (data.hasOwnProperty(id)) {
                items.push(new technical_process_model(data[id]));
            }
        }
        this.registry_technical_process(items);
    },
    load_limits_base: function(limits_base){
    	var limits = {};

    	for(var key in limits_base){
    		if(limits_base.hasOwnProperty(key)){
    			limits[key] = {
    				limit: ko.observable(limits_base[key].limit || ''),
    				value: ko.observable(limits_base[key].value || ''),
    			}
    		}
    	}

    	this.limits_base(limits);
    },


    //add technical proccess
    add_technical_process: function(){
    	const id = get_next_id(this.registry_technical_process());
    
	    var newProcess = new technical_process_model({
	        name_process: '',
	        main_employee: '',
	        subject: '',
	        has_security_inform: false,
	        has_foreign_provider: false,
	        inform_struct: ''
	    });
    
    this.registry_technical_process.push(newProcess);
    },

	//remove technical proccess
    remove_technical_process: function(process){
    	this.registry_technical_process.remove(process);

    	if(this.registry_technical_process().length < 1){
		    this.add_technical_process();
		}
    },



    find_dependencies: function(){
    	this.registry_contracts.removeAll();

    	let processes = this.registry_technical_process();

    	for(var proc of processes){
    		if(proc.has_foreign_provider()){
    			let contract = new registry_contract_model(proc);
    			this.registry_contracts.push(contract);

    		}
    	}
    },

    define_influence: function(){
    	this.map_influence.removeAll();

    	let processes = this.registry_technical_process();

    	let influences = processes.flatMap(proc1 => 
    		processes
	    		.filter(proc2 => proc1 !== proc2)
	            .map(proc2 => new map_influence_model(proc1, proc2))
    	);
    
    	this.map_influence(influences);
    },
    get_processes: function(){
    	this.processes.removeAll();

    	let processes = this.registry_technical_process();

    	for(var proc of processes){
    		var process_info = new process_model(proc);

    		this.processes.push(process_info);
    	}
    }
};




//Generate models for MVVM pattern
function technical_process_model(data) {
    this.name_process = ko.observable(data.name_process || '');
    this.main_employee = ko.observable(data.main_employee || '');
    this.subject = ko.observable(data.subject || '');
    this.has_security_inform = ko.observable(data.has_security_inform || false);
    this.has_foreign_provider = ko.observable(data.has_foreign_provider || false);
    this.inform_struct = ko.observable(data.inform_struct || '');
}
function registry_contract_model(data_technical_process){
	this.name_process = ko.observable(data_technical_process.name_process() || '');
	this.name_organization = ko.observable('');
	this.number_document = ko.observable('');
	this.date_start = ko.observable('');
	this.date_end = ko.observable('');
	this.inforom_system = ko.observable(data_technical_process.name_process() || '');
}
function map_influence_model(process1, process2){
	this.first_object = ko.observable(process1.inform_struct() || '');
	this.second_object = ko.observable(process2.inform_struct() || '');
	this.influence = ko.observable(' ');
}
function process_model(data_technical_process){
	this.name_process = ko.observable(data_technical_process.name_process() || '');
	this.f1 = ko.observable('-');
	this.f2 = ko.observable('-');
	this.f3 = ko.observable('-');
	this.f4 = ko.observable('-');
	this.note = ko.observable('');
}



function get_next_id(data){	
	if (Array.isArray(data)) {
        if (data.length === 0) return 1;
        return Math.max(...data.map(item => item.id)) + 1;
    }

    return 1;
}