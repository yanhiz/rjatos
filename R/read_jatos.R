#' Read result file from Jatos
#'
#' This function reads the result text file exported from Jatos and creates a data frame.
#' It can also reassign each participant a sequential ID.
#'
#' @param result_file The path to the result text file exported from Jatos.
#' @param add_unique_ids Default FALSE. Adds a sequential ID to participants. If true, the `participant` value from Jatos is erased.
#' @param flatten 	Default `TRUE`. Automatically `flatten()` nested data frames into a single non-nested data frame. From `jsonlite` package.
#' @param unnest 	Default `TRUE`. Automatically `unnest_wider()` nested data frames into a single non-nested data frame. The use of this argument depends on what `flatten()` did.
#' @param remove 	Default `'response.'`. Automatically remove prefixes from data columns names. This is useful when the unnesting of lists led to names columns.
#' @returns A data frame
#' @examples
#' data <- read_jatos('myresults.txt')
#'
#'
#' @importFrom jsonlite fromJSON
#' @import tidyverse

#' @export
read_jatos <- function(result_file,add_unique_ids=FALSE,unnest=TRUE,flatten=TRUE,remove='response.') {

  raw_data <- read_file(result_file)

  split_data <- raw_data %>%
    str_split_1('\n')

  split_data <- split_data[-length(split_data)]

  new_data <- tibble()
  i <- 0
  for (participant in split_data){
    i <- i + 1
    participant_data <- jsonlite::fromJSON(participant,flatten=flatten) %>%
      tibble() %>%
      {if (add_unique_ids) {.} %>%  mutate(participant=i,.before=1) else {.}}
    new_data <- rbind(new_data,participant_data)
  }

  metadata <- new_data %>%
    filter(trial_type=='survey') %>%
    {if (unnest) {.} %>% unnest_wider(where(is.list),simplify = F,names_sep = '.') else {.}} %>%
    rowwise %>%
    mutate_if(is.list,~ifelse(is.list(.x)&length(.x)>1,
                              paste(do.call(paste,c(.x,sep=':')),collapse = ";"),
                              as.character(.x))) %>%
    select_if(~ !all(is.na(.x)))


  data <- new_data %>%
    filter(trial_type!='survey') %>%
    unnest_wider(where(is.list),names_sep = '.') %>%
    select_if(~ !all(is.na(.x)))

  rm <- intersect(colnames(data),colnames(metadata))

  metadata <- metadata %>% select(participant,!all_of(rm))

  data <- data %>%
    left_join(metadata,by='participant') %>%
    {if (remove!='') {.} %>% rename_with(~str_replace(.x,remove,'')) else {.}}

  data
}
