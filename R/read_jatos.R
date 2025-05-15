#' Read result file from Jatos
#'
#' This function reads the result text file exported from Jatos and creates a data frame.
#' Make sure that the result file does not contain "Participant left" sequencies, otherwise it returns an error.
#' Those sequencies can be removed from Jatos keeping only participants with "FINISHED" status.
#'
#' @param result_file The path to the result text file exported from Jatos.
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
read_jatos <- function(result_file) {

    raw_data <- read_file(result_file)

    split_data <- raw_data %>%
      str_split_1('\n')

    split_data <- split_data[-length(split_data)]

    new_data <- tibble()
    i <- 0
    for (participant in split_data){
      i <- i + 1
      new_data <- rbind(new_data,jsonlite::fromJSON(participant) %>% tibble() %>% mutate(part_id=i,.before=1))
    }

    metadata <- new_data %>%
      filter(trial_type=='survey') %>%
      unnest_wider(response)

    data <- new_data %>%
      filter(trial_type!='survey') %>%
      unnest(response)

    rm <- intersect(colnames(data),colnames(metadata))

    metadata <- metadata %>% select(participant,!all_of(rm))

    data <- data %>%
      left_join(metadata,by='participant')

    data
}
