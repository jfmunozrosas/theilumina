"""Builds _prev_pubs.md (Previous publications of the team) from data/team_publications.csv.
Columns used: year, topics, title, scholar_query, journal, members, jcr, abs, doi, open_access, video.
Impact columns: open access (DIGIBUG / other), one-minute video (GiniUs website),
citations (Dimensions badge) and online attention (Altmetric badge), as on the GiniUs Impact page.
Usage: python3 tools/make_prev_pubs.py   (run from the project folder)"""
import csv, urllib.parse
GINIUS = "https://jfmunozrosas.github.io/ginius"
SYM = {"ineq": '<span class="sym sym-ineq" title="Inequality and poverty">⚖</span>',
       "water": '<span class="sym sym-water" title="Water">💧</span>',
       "tour": '<span class="sym sym-tour" title="Tourism">✈</span>',
       "firm": '<span class="sym sym-firm" title="Firms">🏭</span>'}
rows = list(csv.DictReader(open("data/team_publications.csv", encoding="utf-8")))
def short(t, n=110): return t if len(t) <= n else t[:n].rstrip() + "…"
n = len(rows); q1 = sum(r["jcr"] == "Q1" for r in rows); q12 = sum(r["jcr"] in ("Q1", "Q2") for r in rows)
a3 = sum(r["abs"] in ("3", "4", "4*") for r in rows); a4 = sum(r["abs"] in ("4", "4*") for r in rows)
oa = sum(bool(r["open_access"]) for r in rows); dg = sum("10481/" in r["open_access"] for r in rows)
vid = sum(bool(r["video"]) for r in rows); doi = sum(bool(r["doi"]) for r in rows)
out = [f"""The table lists the **{n} articles in JCR journals** published by team members since 2023 in the research areas of the project. Articles are marked according to the topics and transfer areas of the project: {SYM['ineq']} inequality and poverty, {SYM['water']} water, {SYM['tour']} tourism and {SYM['firm']} firms; an article can carry more than one mark. Click on a title to open the article (DOI or Google Scholar). Quality indicators: JCR quartile of the journal **in the year of publication** and, where applicable, rating in the Chartered ABS *Academic Journal Guide* (AJG).

**Impact indicators**, as on the [Impact page of the previous project GiniUs]({GINIUS}/impact.html){{target="_blank"}}: **🔓 Open access** links to the open version of the article (DIGIBUG, the repository of the University of Granada, or other open repositories); **▶ Video** opens the one-minute plain-language video of the article on the [GiniUs website]({GINIUS}/videos.html){{target="_blank"}}; **Citations** ([Dimensions](https://www.dimensions.ai/)) and **Attention** ([Altmetric](https://www.altmetric.com/): news, blogs, policy documents, Wikipedia and social media) are updated automatically for articles with a DOI and appear when there are data.

::: {{.stats}}
<span class='stat'><b>{n}</b> JCR articles</span> <span class='stat'><b>{q1}</b> in Q1</span> <span class='stat'><b>{q12}</b> in Q1–Q2</span> <span class='stat'><b>{a3}</b> in ABS 3/4/4*</span> <span class='stat'><b>{a4}</b> in ABS 4/4*</span> <span class='stat'><b>{oa}</b> in open access ({dg} in DIGIBUG)</span> <span class='stat'><b>{vid}</b> with a one-minute video</span>
:::
"""]
for y in sorted({r["year"] for r in rows}, reverse=True):
    out.append(f"\n### {y}\n\n| Article | Journal | Team members | JCR | ABS | Open access | Video | Citations | Attention |\n|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|")
    for r in [r for r in rows if r["year"] == y]:
        s = "".join(SYM[t] for t in r["topics"].split(";") if t in SYM)
        url = f"https://doi.org/{r['doi']}" if r["doi"] else "https://scholar.google.com/scholar?q=" + urllib.parse.quote_plus(r["scholar_query"])
        o = ""
        if r["open_access"]:
            lab = "🔓 DIGIBUG" if "10481/" in r["open_access"] else "🔓 Open"
            o = f'<a class="oa-link" href="{r["open_access"]}" target="_blank" title="Open-access version">{lab}</a>'
        v = f'<a class="vid-link" href="{GINIUS}/videos.html#{r["video"]}" target="_blank" title="One-minute video on the GiniUs website">▶ Video</a>' if r["video"] else ""
        c = f'<span class="__dimensions_badge_embed__" data-doi="{r["doi"]}" data-style="small_circle" data-legend="hover-right"></span>' if r["doi"] else ""
        a = f'<span class="altmetric-embed" data-badge-type="donut" data-badge-popover="left" data-doi="{r["doi"]}" data-hide-no-mentions="true"></span>' if r["doi"] else ""
        ab = r["abs"] or "–"
        out.append(f'| {s} [{short(r["title"])}]({url}){{target="_blank"}} | *{r["journal"]}* | {r["members"]} | {r["jcr"]} | {ab} | {o} | {v} | {c} | {a} |')
    out.append('\n: {tbl-colwidths="[34,16,12,5,5,8,7,6,7]"}')
out.append(f"""
<p class="source">{doi} of {n} articles have a DOI (citation and attention badges). Data: <code>data/team_publications.csv</code>, shared with the GiniUs website. To update the table, edit the CSV and run <code>python3 tools/make_prev_pubs.py</code>.</p>

```{{=html}}
<script async src="https://badge.dimensions.ai/badge.js" charset="utf-8"></script>
<script async src="https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js"></script>
```
""")
open("_prev_pubs.md", "w", encoding="utf-8").write("\n".join(out))
print(f"_prev_pubs.md: {n} articles, {doi} DOI, {oa} open access, {vid} videos")
