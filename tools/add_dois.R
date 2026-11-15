# Replace the Google Scholar links of _prev_pubs.md with DOI links (https://doi.org/...)
# using the Crossref API. Run once from the project folder:
#
#   Rscript tools/add_dois.R
#
# A link is replaced only when Crossref returns an article whose title starts like the
# title in the table (and, preferably, from the same journal); otherwise the Google Scholar
# link is kept. A copy of the original file is saved as _prev_pubs.md.bak.

library(jsonlite)

file  <- "_prev_pubs.md"
lines <- readLines(file, encoding = "UTF-8")
file.copy(file, paste0(file, ".bak"), overwrite = TRUE)

norm <- function(x) {
  x <- enc2utf8(x)
  x <- gsub("&", "and", x, fixed = TRUE)
  x <- tolower(gsub("[^[:alnum:]]+", " ", x))
  trimws(gsub("\\s+", " ", x))
}

get_json <- function(u) {
  con <- url(u, headers = c("User-Agent" = "THEILUMINA/1.0 (mailto:jfmunoz@ugr.es)"))
  on.exit(close(con))
  fromJSON(paste(readLines(con, warn = FALSE, encoding = "UTF-8"), collapse = ""),
           simplifyVector = FALSE)
}

link_re <- "\\[([^]]+)\\]\\((https://scholar\\.google\\.com/scholar\\?q=[^)]+)\\)"
rows <- grep(link_re, lines)
ok <- 0; first_error <- TRUE
for (i in rows) {
  title   <- sub(paste0(".*", link_re, ".*"), "\\1", lines[i])
  journal <- sub("^.*\\| \\*([^*]+)\\* \\|.*$", "\\1", lines[i])
  query   <- trimws(sub("…$", "", title))
  u <- paste0("https://api.crossref.org/works?rows=5&select=DOI,title,container-title",
              "&query.bibliographic=", URLencode(enc2utf8(paste(query, journal)), reserved = TRUE))
  res <- tryCatch(get_json(u)$message$items, error = function(e) {
    if (first_error) message("Crossref could not be reached: ", conditionMessage(e))
    first_error <<- FALSE
    NULL
  })
  key <- substr(norm(query), 1, 40)
  doi <- NA
  # 1st choice: same title start and same journal; 2nd choice: same title start
  for (pass in 1:2) {
    for (it in res) {
      it_title   <- if (length(it$title)) it$title[[1]] else ""
      it_journal <- if (length(it$`container-title`)) it$`container-title`[[1]] else ""
      same_t <- startsWith(norm(it_title), key)
      same_j <- norm(it_journal) == norm(journal)
      if (same_t && (pass == 2 || same_j)) { doi <- it$DOI; break }
    }
    if (!is.na(doi)) break
  }
  if (!is.na(doi)) {
    lines[i] <- sub(link_re, paste0("[", title, "](https://doi.org/", doi, ")"), lines[i])
    ok <- ok + 1
  } else {
    message("No DOI found (kept Google Scholar link): ", substr(title, 1, 70))
  }
  Sys.sleep(0.3)
}
writeLines(enc2utf8(lines), file, useBytes = TRUE)
message("\n", ok, " of ", length(rows), " titles now link to their DOI.")
