#' Read result file from Jatos
#'
#' This function reads the result text file exported from Jatos and creates a data frame.
#' It can also reassign each participant a sequential ID.
#'
#' @param result_file The path to the result text file exported from Jatos.
#' @param add_unique_ids Adds a sequential ID to participants. Default FALSE. If true, the `participant` value from Jatos is erased.
#' @returns A data frame
#' @examples
#' data <- read_jatos('myresults.txt')
#'
#'
#' Possible issue: if the result file contains nested lists, it is likely that they will end up in your data frame too.
#' Use the tidyverse `unnest_wider` function to expand them as new columns.
#' Currently, only the nested lists from `survey` items are handled.

#' @importFrom jsonlite fromJSON
#' @import tidyverse

#' @export
read_jatos <- function(result_file,add_unique_ids=FALSE) {

    raw_data <- read_file(result_file)

    split_data <- raw_data %>%
      str_split_1('\n')

    split_data <- split_data[-length(split_data)]

    new_data <- tibble()
    i <- 0
    for (participant in split_data){
      if (add_unique_ids) {
      i <- i + 1
      new_data <- rbind(new_data,jsonlite::fromJSON(participant) %>% tibble() %>% mutate(participant=i,.before=1))
      } else {
      new_data <- rbind(new_data,jsonlite::fromJSON(participant) %>% tibble())
      }
    }

    metadata <- new_data %>%
      filter(trial_type=='survey') %>%
      unnest_wider(response)

    data <- new_data %>%
      filter(trial_type!='survey') %>%
      unnest_wider(response,names_sep='')

    rm <- intersect(colnames(data),colnames(metadata))

    metadata <- metadata %>% select(participant,!all_of(rm))

    data <- data %>%
      left_join(metadata,by='participant')

    data
}
