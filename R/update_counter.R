#' Update the Jatos counter for your experiments
#'
#' This function updates the counter.js file of all your Jatos experiments.
#' All you have to do is to give the path to your Jatos folder.
#'
#' @param jatos_path The path to your Jatos folder (often called `jatos_XXX_java`).
#' @examples
#' update_counter('/home/user/jatos_mac_java')
#' update_counter('/home/user/jatos_linux_java')
#'
#' @export
update_counter <- function(jatos_path){
  jatos_path <- '/home/yanis/Jatos'

  list <- list.dirs(paste0(jatos_path,'/study_assets_root'),recursive = F)

  for (dir in list) {
    download.file("https://raw.githubusercontent.com/yanhiz/rjatos/refs/heads/master/counter.js",
                  paste0(dir,"/jatos/counter.js"))
  }
}


