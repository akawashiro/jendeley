import argparse
import json
import multiprocessing
import pathlib
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Tuple
from urllib.error import HTTPError

import bibtexparser  # type: ignore
import pdf2doi  # type: ignore


def get_entry(a: Tuple[pathlib.Path, pathlib.Path]) -> Dict[Any, Any]:
    pdf = a[0]
    papers_dir = a[1]

    print(f"Processing {pdf}")

    filepath = pdf.relative_to(papers_dir)
    entry = {"path": str(filepath), "title": filepath.name}

    doi = pdf2doi.pdf2doi(str(pdf))
    if doi is None:
        return entry

    url = "http://dx.doi.org/" + str(doi["identifier"])
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/x-bibtex")
    try:
        with urllib.request.urlopen(req) as f:
            bibtex_str = f.read().decode()
        bibtex_db = bibtexparser.loads(bibtex_str)
        assert len(bibtex_db.entries) == 1
        entry = entry | bibtex_db.entries[0]
        entry["raw_bibtex"] = bibtex_str
        return entry
    except HTTPError as e:
        if e.code == 404:
            print("DOI not found.")
        else:
            print("Service unavailable.")
        return entry


def command_gen(args: Any) -> None:
    pdf2doi.config.set("verbose", False)

    pdfs = list(args.papers_dir.rglob("*.pdf"))
    pdfs.sort()
    pdfs = pdfs[:40]
    pool_args = []
    for p in pdfs:
        pool_args.append((p, args.papers_dir))

    with multiprocessing.Pool(processes=16) as pool:
        db_json = pool.map(get_entry, pool_args)

    if args.output is None:
        print(json.dumps(db_json, indent=4))
    else:
        if args.output is not None and args.output.exists() and not args.force_update:
            print(f"{args.output} is already exists. We don't overwrite it for safety.")
            sys.exit(1)
        with open(args.output, "w") as f:
            json.dump(db_json, f, indent=4)


def command_render(args: Any) -> None:
    html = """
<head>
<script>
function searchFunction() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("searchInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("papersTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}
</script>
<style>
#searchInput{
  background-position: 10px 12px; /* Position the search icon */
  background-repeat: no-repeat; /* Do not repeat the icon image */
  width: 100%; /* Full-width */
  font-size: 16px; /* Increase font-size */
  padding: 4px 4px 4px 4px; /* Add some padding */
  border: 1px solid #ddd; /* Add a grey border */
  margin-bottom: 12px; /* Add some space below the input */
}

#papersTable {
  border-collapse: collapse; /* Collapse borders */
  width: 100%; /* Full-width */
  border: 1px solid #ddd; /* Add a grey border */
  font-size: 18px; /* Increase font-size */
}

#papersTable th, #papersTable td {
  text-align: left; /* Left-align text */
  padding: 12px; /* Add padding */
}

#papersTable tr {
  /* Add a bottom border to all table rows */
  border-bottom: 1px solid #ddd;
}

#papersTable tr.header, #papersTable tr:hover {
  /* Add a grey background color to the table header and on hover */
  background-color: #f1f1f1;
}
</style>
</head>

<input type="text" id="searchInput" onkeyup="searchFunction()" placeholder="Search for any field ...">
"""

    html += r'<table id="papersTable">'

    columns = ["title", "author", "year", "journal"]
    with open(args.database_json, "r") as f:
        db_json = json.load(f)

    # Gen table headers
    html += r'<tr class="header">'
    for c in columns:
        html += r"<th>" + c + "</th>"
    html += r"</tr>"

    # Render contents of DB
    for e in db_json:
        html += r'<tr class="header">'
        for c in columns:
            if c == "title":
                if c not in e:
                    x = "N/A"
                else:
                    x = r'<a href="' + urllib.parse.quote(e["path"], safe="/") + r'">'
                    x += e["title"]
                    x += "</a>"
            else:
                x = "N/A" if c not in e else str(e[c])
            html += r"<td>" + x + "</td>"
        html += r"</tr>"

    if args.output is not None:
        with open(args.output, "w") as f:
            f.write(html)
    else:
        print(html)


def main() -> None:
    parser = argparse.ArgumentParser(
        "jendeley: JSON based Reference Management Software"
    )
    subparsers = parser.add_subparsers()

    gen_parser = subparsers.add_parser(
        "gen", help="Generate database from the directory"
    )
    gen_parser.add_argument("papers_dir", type=pathlib.Path)
    gen_parser.add_argument("-o", "--output", type=pathlib.Path)
    gen_parser.add_argument("-f", "--force-update", action="store_true")
    gen_parser.set_defaults(handler=command_gen)

    render_parser = subparsers.add_parser(
        "render", help="Render JSON database into index.html"
    )
    render_parser.add_argument("database_json", type=pathlib.Path)
    render_parser.add_argument("-o", "--output", type=pathlib.Path)
    render_parser.set_defaults(handler=command_render)

    args = parser.parse_args()
    if hasattr(args, "handler"):
        args.handler(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
