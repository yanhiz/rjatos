// Version 2.0
// 19-11-2025



function first_least_frequent(freq_object) {
    // Take a frequency Object and returns the first key with the lowest value
    var keys = Object.keys(freq_object);
    var lowest = Math.min.apply(null, keys.map(function(x) {
        return freq_object[x]
    }));
    var match = keys.filter(function(y) {
        return freq_object[y] === lowest
    });
    return match[0];
};

function first_most_frequent(freq_object) {
    // Take a frequency Object and returns the first key with the highest value
    var keys = Object.keys(freq_object);
    var highest = Math.max.apply(null, keys.map(function(x) {
        return freq_object[x]
    }));
    var match = keys.filter(function(y) {
        return freq_object[y] === highest
    });
    return match[0];
};

var modulo = function(freq_object, n) {
    // Take a frequency Object and returns a frequecy Object with the same keys and values modulo n
    var modulo_object = {};
    Object.keys(freq_object).forEach(function(key) {
        modulo_object[key] = freq_object[key] % n
    });
    return modulo_object;
};


var generate_participant = function(participant_list){
  var getRandomInt = function(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); 
    } 
  id = getRandomInt(1000,10000);
  if (!participant_list.includes(id)){
    return id;
  } else {
    return generate_participant();
  }
}


var make_list = function(type) {

    // Create a subset of the stimuli for a given type (Example: Critical items, Fillers etc)
    var subset = stimuli.filter(stimulus => stimulus.type == type);
    // Get the numbers of conditions of a given type 
    var n_cond = [];
    subset.forEach(stimulus => n_cond.push(stimulus.condition)); // Get all conditions
    n_cond = Array.from(new Set(n_cond)).length; // Keep the number of unique conditions
    // Create an alphabetical list with the length of the number of conditions
    var n_list = Array(n_cond).fill().map((element, index) => String.fromCharCode('A'.charCodeAt(0) + index));

    // LATIN SQUARE
    // Create an array of list labels of the same length as the number of items
    lists_for_stimuli = [];
    for (let i = 0; i < subset.length / n_cond; i++) {
        lists_for_stimuli.push.apply(lists_for_stimuli, n_list); // Add the list labels to the array
        rem = n_list.pop(); // Remove the last element of the list labels
        n_list.unshift(rem); // Put the last element in the first position
    }

    // Add a list label to each item of the subset
    subset.forEach(stimulus => stimulus.list = lists_for_stimuli.shift());

    // Create a frequency Object with list labels as keys
    var lists = {};
    subset.forEach(stimulus => lists[stimulus.list] = 0);

    // Return the subset with list labels and the frequency Object with list labels
    return [subset, lists];
}

var schema = function(lists) {
    // Takes a list counter of the form {type1:{cond1:0,cond2:0},type2:{cond1:0,cond2:0}} and returns a schematic string of the design of the form "type1[cond1,cond2]type2[cond1,cond2]"
    var design_schema = ''
    types = Object.keys(lists)
    for (var t = 0; t < types.length; t++) {
        design_schema += types[t] + JSON.stringify(Object.keys(lists[types[t]]))
    }
    return design_schema
}



function initiate_counter(start_values, lists) {
    // Get the counter from Jatos Batch Session
    let counter = jatos.batchSession.getAll();
    var update = true
    // If the counter is not defined, has length 0, is different from the current stimuli design...
    if (typeof(counter) == "undefined" || Object.keys(counter).length == 0 || schema(lists) != schema(counter['lists'])) {
      // ... then the counter takes the start values and is stored in the Jatos Batch Session
        counter = start_values;
        update = false
    };
    return [counter,update];
};

function generate_cycle(types, lists){
        
    var unique_lists = 1
    for (var t = 0; t < types.length; t++){
        var type = types[t];
        unique_lists = unique_lists * Object.keys(lists[type]).length
    }
    
    var cycle = []
    for (var i = 0; i < unique_lists; i ++){
    var n_modulo = 1;
    var current = []
    for (var t = 0; t < types.length; t++) {
          var type = types[t];
          // Take the modulo of the list frequency for the current type
          var modulo_list = modulo(lists[type], n_modulo);
          // Update the modulo divisor based on the current number of lists
          n_modulo = n_modulo * Object.keys(modulo_list).length;
          // If the modulo of the list frequency only contains identical values (ie. if all lists are 0 or equal to the modulo divisor)...
          if (new Set(Object.values(modulo_list)).size == 1) {
              // ... then, take the first least frequent list based on actual frequencies (ie. the next list in the array of list labels)
              match = first_least_frequent(lists[type]);
          } else {
              // ... otherwise, take the first most frequent list based on modulo frequencies (ie. the current list with non null modulo)
              match = first_most_frequent(modulo_list);
          }
          // Add the matched list to the current list array
          current.push(match);
          // Increase the matched list counter
          ++lists[type][match];
          }
    cycle.push(current)
    }
    return cycle
}

var make_design = function(types = [], step = true) {

    // Get the array of item types if no types are entered manually
    if (types.length == 0) {
        stimuli.forEach(stimulus => types.push(stimulus.type));
        types = Array.from(new Set(types));
    }

    // Take the array of types and return
    //  1. the set of stimuli with their list label
    //  2. the list counter for each type
    var annotated_stimuli = [];
    var lists = {};
    // For each type...
    for (var t = 0; t < types.length; t++) {
        var type = types[t];
        // ... get the subset of stimuli with their list for the current type...
        var subset_with_lists = make_list(type);
        // ... add the subset of stimuli with lists for the current type to the set of stimuli
        annotated_stimuli.push.apply(annotated_stimuli, subset_with_lists[0]);
        // ... and add the list counter of the current type to the list counter
        lists[type] = subset_with_lists[1];
    }


    // Initialize the counter of the Jatos Batch Session
    var toggle = initiate_counter({
        'lists': lists,
        'cycle': [],
        'cycle_counter':-1,
        'to_do': [],
        'store': [],
        'part_list':[],
        'part_finish':[]
        // 'manual': ''
    },lists);
    var new_counter = toggle[0]
    var update = toggle[1]

    

    // Get the values from the counter 
    var cycle = new_counter['cycle']
    if (cycle.length == 0) {cycle = generate_cycle(types,lists)}
    var participant_list = new_counter['part_list'] // List of used participants
    var participant_finish = new_counter['part_finish'] // List of finished participants
    var global_to_do = new_counter['to_do']; // List counter
    var global_store = new_counter['store']; // List counter
    var cycle_counter = new_counter['cycle_counter']; // Number of rounds
    // var manual_list = new_counter['manual']; // Manual list

    if (global_to_do.length === 0) {
        var string_store = [...new Set(global_store.map((x) => {x = x.toString();return x}))].sort().toString()
        var string_cycle = [...new Set(cycle.map((x) => {x = x.toString();return x}))].sort().toString()
        if (global_store.length === 0 || string_store === string_cycle) {
            global_to_do = cycle.slice()
            global_store = []
            cycle_counter++
        } else {
        var new_to_do = [];
        var global_store_string = global_store.map((x) => {x = x.toString();return x})
        cycle.forEach(function (y) {
            if (!global_store_string.includes(y.toString())){
                new_to_do.push(y)
            }
        });
        global_to_do = new_to_do.slice()
        }  
        }

    var current_list = global_to_do.shift()
    var participant_id = generate_participant(participant_list);


    if (step) {
    if (update == false) {
        jatos.batchSession.clear()
            .then(() => jatos.batchSession.setAll(new_counter))
            .then(() => jatos.batchSession.add('/part_list/-',participant_id))
            .then(() => jatos.batchSession.set('to_do', global_to_do))
            .then(() => jatos.batchSession.set('cycle_counter', cycle_counter))
    } else {
        jatos.batchSession.add('/part_list/-',participant_id)
            .then(() => jatos.batchSession.set('to_do', global_to_do))
            .then(() => jatos.batchSession.set('store', global_store))
            .then(() => jatos.batchSession.set('cycle_counter', cycle_counter))
    }
    
    }


    
    // Get the stimuli for the current list
    var selected_stimuli = []
    for (var t = 0; t < types.length; t++) {
        var type = types[t];
        selected_stimuli.push.apply(selected_stimuli, annotated_stimuli.filter(stimulus => stimulus.type == type & stimulus.list == current_list[t]));
    }


    var design = {
        'to_do': global_to_do,
        'current_list': current_list,
        'store': global_store,
        'current_participant': participant_id,
        'participant_counter' : participant_finish.length,
        'cycle_counter': cycle_counter,
        'cycle' : cycle,
        'lists' : lists,
        'stimuli': selected_stimuli
    };

    console.log(JSON.stringify(design,null,2))

    return design;

}

