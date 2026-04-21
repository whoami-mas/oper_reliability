$(document).ready(function () {
	
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
	var self = data.operation_reliability;

	viewModel.employees_name(data.employees_name);

	self.registry_technical_process && viewModel.load_registry_technical_processes(self.registry_technical_process);
    self.limits_base && viewModel.load_limits_base(self.limits_base);
    self.registry_contracts && viewModel.load_registry_contracts(self.registry_contracts);
    self.map_influence && viewModel.load_influence_maps(self.map_influence);
    self.processes && viewModel.load_processes(self.processes);
    
    //data.period && viewModel.load_period(data.period);

    viewModel.has_reliability_target(self.has_reliability_target);
}



function identity_dependencies(){

	viewModel.find_dependencies();
	viewModel.define_influence();
	viewModel.get_processes();
}
function save_data(){
	var json = JSON.parse(ko.toJSON(viewModel));
	var json_hide = JSON.parse($("#exchange_field").val());

	json_hide.operation_reliability.registry_technical_process = json.registry_technical_process;
	json_hide.operation_reliability.registry_contracts = json.registry_contracts;
	json_hide.operation_reliability.map_influence = json.map_influence;
	json_hide.operation_reliability.processes = json.processes;
	json_hide.operation_reliability.limits_base = json.limits_base;
	json_hide.operation_reliability.has_reliability_target = json.has_reliability_target;
	json_hide.basket_remove = json.basket_remove;

	var field = JSON.stringify(json_hide, null, 2);
	console.log(field);
	$("#exchange_field").val(field);

	send_json("save_file_oper_click");

	viewModel.clear_basket(); 
}



var viewModel ={
 	employees_name: ko.observableArray([]),
 	period: ko.observable({}),

	registry_technical_process: ko.observableArray([]),
    registry_contracts: ko.observableArray([]),
    map_influence: ko.observableArray([]),
    limits_base: ko.observableArray([]),
	has_reliability_target: ko.observable(),
	processes: ko.observableArray([]),
	basket_remove: {
		technical_process: ko.observableArray([]),
		contracts: ko.observableArray([]),
		influence_maps: ko.observableArray([]),
		processes: ko.observableArray([]),
	},

	display_block: ko.pureComputed(() => {
        var hasContracts = viewModel.registry_contracts().length > 0;
        var hasMaps = viewModel.map_influence().length > 0;
        return hasContracts || hasMaps;
    }),


	//loads
    load_registry_technical_processes: function(data) {
        var items = [];
        for (var id in data) {
            if (data.hasOwnProperty(id)) {
                items.push(new technical_process_model(data[id]));
            }
        }
        this.registry_technical_process(items);
    },
    load_limits_base: function(data){
    	var limits = [];

    	for(var item of data){
    		var limit = {
    			id: ko.observable(item.id),
    			short_name: ko.observable(item.short_name),
    			description: ko.observable(item.description),
    			limit: ko.observable(item.limit),
    			value: ko.observable(item.value),
    		};
			limit.display_indicator = ko.pureComputed(function() {
			        return this.short_name() + " - " + this.description();
			    }, limit);

    		limits.push(limit)
    	}
    	this.limits_base(limits);
    },
    load_registry_contracts: function(data){
    	var contracts = [];

    	for(var key in data){
    		if(data.hasOwnProperty(key)){
    			var contract = {
    				id: ko.observable(data[key].id),
    				process_name: ko.observable(data[key].process_name ?? ''),
    				organization_provider_name: ko.observable(data[key].organization_provider_name ?? ''),
    				document_number: ko.observable(data[key].document_number ?? ''),
    				date_start: ko.observable(data[key].date_start ?? ''),
    				date_end: ko.observable(data[key].date_end ?? ''),
    				inform_system_name: ko.observable(data[key].inform_system_name ?? ''),
    			}

    			contracts.push(contract);
    		}
    	}

    	this.registry_contracts(contracts);
    },
    load_influence_maps: function(data){
    	var influences = [];

    	for(var key in data){
    		if(data.hasOwnProperty(key)){
    			var influence = {
    				id: ko.observable(data[key].id),
    				first_subject_name: ko.observable(data[key].first_subject_name ?? ''),
    				second_subject_name: ko.observable(data[key].second_subject_name ?? ''),
    				influence: ko.observable(data[key].influence ?? 0),
    			}

    			influences.push(influence);
    		}
    	}

    	this.map_influence(influences);
    },
    load_processes: function(data){
    	var processes = [];

    	for(var key in data){
    		if(data.hasOwnProperty(key)){
    			var _process = {
    				id: ko.observable(data[key].id),
    				process_name: ko.observable(data[key].process_name ?? ''),
    				f1: ko.observable(data[key].f1 ?? ''),
    				f2: ko.observable(data[key].f2 ?? ''),
    				f3: ko.observable(data[key].f3 ?? ''),
    				f4: ko.observable(data[key].f4 ?? ''),
    				note: ko.observable(data[key].note ?? ''),
    			}

    			processes.push(_process);
    		}
    	}

    	this.processes(processes);
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
    remove_technical_process: function(_process){
    	this.basket_remove.technical_process.push(_process.id);
    	this.registry_technical_process.remove(_process);

    	if(this.registry_technical_process().length < 1){
		    this.add_technical_process();
		}
    },



    find_dependencies: function(){
    	this.basket_remove.contracts(this.registry_contracts().map(function(item) {
        return item.id;
    	}));
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
    	this.basket_remove.influence_maps(this.map_influence().map(function(item) {
        return item.id;
    	}));
    	this.map_influence.removeAll();

    	let processes = this.registry_technical_process();

    	const uniqueInformStructures = [...new Set(processes.map(p => p.inform_structure()))];

		let influences = [];

		for (let i = 0; i < uniqueInformStructures.length; i++) {
		    for (let j = i + 1; j < uniqueInformStructures.length; j++) {
		        const inform1 = uniqueInformStructures[i];
		        const inform2 = uniqueInformStructures[j];
		        
		        const proc1 = processes.find(p => p.inform_structure() === inform1) || 
		                      { inform_structure: () => inform1 };
		        const proc2 = processes.find(p => p.inform_structure() === inform2) || 
		                      { inform_structure: () => inform2 };
		        
		        influences.push(new map_influence_model(proc1, proc2));
		        
		        // Если нужна и обратная пара тест2 - тест1, раскомментируйте:
		        // influences.push(new map_influence_model(proc2, proc1));
		    }
		}

		console.log(influences);
		// Результат: тест1 - тест2 (только одна пара)
    
    	this.map_influence(influences);
    },
    get_processes: function(){
    	this.basket_remove.processes(this.processes().map(function(item) {
        return item.id;
    	}));
    	this.processes.removeAll();

    	let processes = this.registry_technical_process();

    	for(var proc of processes){
    		var process_info = new process_model(proc);

    		this.processes.push(process_info);
    	}
    },

    clear_basket: function(){
    	 this.basket_remove.technical_process.removeAll();
	     this.basket_remove.contracts.removeAll();
	     this.basket_remove.influence_maps.removeAll();
	     this.basket_remove.processes.removeAll();
    }
};




//Generate models for MVVM pattern
function technical_process_model(data) {
	this.id = ko.observable(data.id ?? 0);
    this.process_name = ko.observable(data.process_name);
    this.main_employee_name = ko.observable(data.main_employee_name);
    this.subject_name = ko.observable(data.subject_name);
    this.has_security_inform = ko.observable(data.has_security_inform);
    this.has_foreign_provider = ko.observable(data.has_foreign_provider);
    this.inform_structure = ko.observable(data.inform_structure);
}
function registry_contract_model(data_technical_process){
	this.id = ko.observable(0);
	this.process_name = ko.observable(data_technical_process.process_name());
	this.organization_provider_name = ko.observable('');
	this.document_number = ko.observable('');
	this.date_start = ko.observable('');
	this.date_end = ko.observable('');
	this.inform_system_name = ko.observable(data_technical_process.process_name());
}
function map_influence_model(process1, process2){
	this.id = ko.observable(0);
	this.first_subject_name = ko.observable(process1.inform_structure());
	this.second_subject_name = ko.observable(process2.inform_structure());
	this.influence = ko.observable(0);
}
function process_model(data_technical_process){
	this.id = ko.observable(0);
	this.process_name = ko.observable(data_technical_process.process_name());
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