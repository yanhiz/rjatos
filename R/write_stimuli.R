#' Write stimuli for Jatos
#'
#' This function converts a csv file containing experimental items into a stimuli.js file with JSON format.
#' The stimuli.js file has to added in the Jatos folder of your experiment (in jatos/study_assets_root).
#'
#' @param csvfile The path to the csv file containing your items.
#' @param experiment_folder The path to the folder of your experiment.
#' @examples
#' write_stimuli('myexperiment/items.csv','/jatosfolder')

#' @importFrom jsonlite toJSON
#' @import tidyverse

#' @export
write_stimuli <- function(csv_file,experiment_folder){

  items <- read_csv(csv_file)

  stimuli <- paste('var stimuli =\n',jsonlite::toJSON(items,pretty = T))

  write_file(stimuli,file=paste0(experiment_folder,'/stimuli.js'))
}
