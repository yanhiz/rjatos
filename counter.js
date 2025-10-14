// Version 1.4
// 14-10-2025

var AbortButton = function(design) {
    // When the participant leaves with the Abort Button:
    // - its list is stored in the Jatos Batch Session;
    // - the study ends and data are removed.
    jatos.batchSession.add('/missing/-', design['current_list']);
    jatos.abortStudy('Participant '+design['current_participant']+' used the Abord button with list '+design['current_list']);
};

// var CloseButton = function(design) {
// };

function initiate_counter(start_values, reset = false, lists) {
    // Get the counter from Jatos Batch Session
    let counter = jatos.batchSession.getAll();
    // If the counter is not defined, has length 0, is different from the current stimuli design, or if the reset option selected...
    if (typeof(counter) == "undefined" || Object.keys(counter).length == 0 || schema(lists) != schema(counter['lists']) ||reset == true) {
      // ... then the counter takes the start values and is stored in the Jatos Batch Session
        counter = start_values;
        jatos.batchSession.clear()
            .then(() => jatos.batchSession.setAll(counter))
            .then(() => console.log("Batch Session was successfully reset"))
            .catch(() => console.log("Batch Session synchronization failed"));
    };
    return counter;
};

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


var getRandomInt = function(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); 
}

var generate_participant = function(participant_list){
  id = getRandomInt(1000,10000);
  if (!participant_list.includes(id)){
    participant_list.push(id);
    return id;
  } else {
    return store_participant();
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

var make_design = function(types = [], update = true, reset = false, new_participant = true) {

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
    var counter = initiate_counter({
        'lists': lists,
        part_list:[],
        missing: [],
        manual: ''
    }, reset,lists);
    // Get the values from the counter 
    var participant_list = counter['part_list'] // List of participants
    var global__list_counter = counter['lists']; // List counter
    var missing_list = counter['missing']; // Missing list array
    var manual_list = counter['manual']; // Manual list


    // Generate random number 
    if (new_participant) {
    var participant_id = generate_participant(participant_list);
    };

    // Increment list counter
    // If a manual list if specified, take it
    if (manual_list.length != 0) {
      var current = manual_list.split(',');
    // If there are missing lists in the array of missing lists, take the first one
    } else if (missing_list.length != 0) {
      var current = missing_list.shift();
    // If there is no manual list specified and no missing list, the regular updating of the list counter is used
    } else {
      var current = [];
      var n_modulo = 1;
      // For each type of the experiment...
      for (var t = 0; t < types.length; t++) {
          var type = types[t];
          // Take the modulo of the list frequency for the current type
          var modulo_list = modulo(global__list_counter[type], n_modulo);
          // Update the modulo divisor based on the current number of lists
          n_modulo = n_modulo * Object.keys(modulo_list).length;
          // If the modulo of the list frequency only contains identical values (ie. if all lists are 0 or equal to the modulo divisor)...
          if (new Set(Object.values(modulo_list)).size == 1) {
              // ... then, take the first least frequent list based on actual frequencies (ie. the next list in the array of list labels)
              match = first_least_frequent(global__list_counter[type]);
          } else {
              // ... otherwise, take the first most frequent list based on modulo frequencies (ie. the current list with non null modulo)
              match = first_most_frequent(modulo_list);
          }
          // Add the matched list to the current list array
          current.push(match);
          // Increase the matched list counter
          ++global__list_counter[type][match];
          }
    }

    // Update of the counter
    if (update) {
        jatos.batchSession.set('part_list',participant_list)
            .then(() => jatos.batchSession.set('lists', global__list_counter))
            .then(() => jatos.batchSession.set('missing', missing_list));
    }

    // Get the stimuli for the current list
    var selected_stimuli = []
    for (var t = 0; t < types.length; t++) {
        var type = types[t];
        selected_stimuli.push.apply(selected_stimuli, annotated_stimuli.filter(stimulus => stimulus.type == type & stimulus.list == current[t]));
    }

    var design = {
        'stimuli': selected_stimuli,
        'current_list': current,
        'list_counter': global__list_counter,
        'current_participant': participant_id,
        'participant_counter' : participant_list.length
    };
    console.log(design);

    // Return a "design Object" containing:
    // - the select stimuli for the current list
    // - the current list
    // - the global counter of lists
    // - the participant number
    // - the number of participants

    return design;
}