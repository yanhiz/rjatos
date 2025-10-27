#' Write stimuli for Jatos
#'
#' This function converts a xls/csv file containing experimental items into a stimuli.js file with JSON format.
#' The stimuli.js file has to added in the Jatos folder of your experiment (in jatos/study_assets_root).
#'
#' @param stimuli_file The path to the xls/csv file containing your items.
#' @param experiment_folder The path to the folder of your experiment.
#' @param sheet Sheet selected from the xls file. Default is `1`.
#' @param delim Delimitation symbol used in the .csv file. Default is ",".
#' @param null_string Default `TRUE`. `TRUE` includes empty strings for unfilled columns of the stimuli csv file. `FALSE` removes unfilled columns.
#'
#' @examples
#' write_stimuli('myexperiment/items.xls','/jatosfolder')
#'
#' @importFrom jsonlite toJSON
#' @import tidyverse
#'
#' @export
write_stimuli <- function(stimuli_file,experiment_folder,sheet=1,delim=',',null_string=TRUE){
  library(tidyverse)
  library(readxl)

  if (str_detect(stimuli_file,'\\.csv$')) {
    items <- read_delim(stimuli_file,delim=delim)
  } else {
    items <- read_excel(stimuli_file,sheet=sheet)
  }

  if (null_string) {
    stimuli <- paste('var stimuli =\n',
                                     jsonlite::toJSON(items,
                                                      na = "string",
                                                      pretty = T)) %>%
                                      str_replace_all('"NA"','""') } else {
    stimuli <- paste('var stimuli =\n',jsonlite::toJSON(items, pretty = T))
  }

  write_file(stimuli,file=paste0(experiment_folder,'/stimuli.js'))
}
