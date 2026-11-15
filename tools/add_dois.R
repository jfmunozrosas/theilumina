# Replace the Google Scholar links of _prev_pubs.md with DOI links (https://doi.org/...)
# using the Crossref API. Run once from the project folder:
#
#   Rscript tools/add_dois.R
#
# A link is replaced only when Crossref returns an article from the same journal whose
# title starts like the title in the table; otherwise the Google Scholar link is kept.
# A copy of the original file is saved as _prev_pubs.md.bak.

library(jsonlite)

file  <- "_prev_pubs.md"
lines <- readLines(file, encoding = "UTF-8")
file.copy(file, paste0(file, ".bak"), overwrite = TRUE)

norm <- function(x) {
  x <- tolower(iconv(x, "UTF-8", "ASCII//TRANSLIT"))
  x <- gsub("&", "and", x, fixed = TRUE)
  gsub("[^a-z0-9]+", " ", x)
}

link_re <- "\\[([^]]+)\\]\\((https://scholar\\.google\\.com/scholar\\?q=[^)]+)\\)"
rows <- grep(link_re, lines)
ok <- 0
for (i in rows) {
  title   <- sub(paste0(".*", link_re, ".*"), "\\1", lines[i])
  journal <- sub("^[^|]*\\|[^|]*\\| \\*([^*]+)\\*.*$", "\\1", lines[i])
  query   <- sub("…$", "", title)
  url <- paste0("https://api.crossref.org/works?rows=5&select=DOI,title,container-title",
                "&query.bibliographic=", URLencode(paste(query, journal), reserved = TRUE),
                "&mailto=jfmunoz@ugr.es")
  res <- tryCatch(fromJSON(url, simplifyVector = FALSE)$message$items, error = function(e) NULL)
  doi <- NA
  for (it in res) {
    it_title   <- if (length(it$title)) it$title[[1]] else ""
    it_journal <- if (length(it$`container-title`)) it$`container-title`[[1]] else ""
    same_j <- norm(it_journal) == norm(journal)
    key    <- substr(norm(query), 1, 45)
    same_t <- startsWith(norm(it_title), key)
    if (same_j && same_t) { doi <- it$DOI; break }
  }
  if (!is.na(doi)) {
    new_link  <- paste0("[", title, "](https://doi.org/", doi, ")")
    lines[i]  <- sub(link_re, new_link, lines[i])
    ok <- ok + 1
  } else {
    message("No DOI found (kept Google Scholar link): ", title)
  }
  Sys.sleep(0.3)
}
writeLines(lines, file, useBytes = TRUE)
message(ok, " of ", length(rows), " titles now link to their DOI.")
