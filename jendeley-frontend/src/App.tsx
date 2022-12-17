import React, { useMemo } from "react";
import Chip from "@mui/material/Chip";
import ReactDOM from "react-dom/client";
import base_64 from "base-64";
import { Box, Stack } from "@mui/material";
import "./App.css";
import { Entry, DB } from "./schema";
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
} from "material-react-table";
import sanitizeHTML from "sanitize-html";
import { QuickRegisterFromUrl, RegisterWithDialog } from "./register";
import { splitTagsStr, getColorFromString } from "./stringUtils";
import { DeleteButton } from "./delete";

function authorChips(authors: string[]) {
  // TODO padding or margine
  return (
    <Box>
      {authors.map((a) => (
        <Chip
          label={`${a}`}
          size="small"
          onClick={() => {
            navigator.clipboard.writeText(a);
          }}
          sx={{
            color: getColorFromString(a).color,
            bgcolor: getColorFromString(a).bgcolor,
            m: 0.1,
          }}
        />
      ))}
    </Box>
  );
}

function tagChips(tags: string[]) {
  // TODO padding or margine
  return (
    <Box>
      {tags.map((t) => (
        <Chip
          label={`${t}`}
          size="small"
          onClick={() => {
            navigator.clipboard.writeText(t);
          }}
          sx={{
            color: getColorFromString(t).color,
            bgcolor: getColorFromString(t).bgcolor,
            m: 0.1,
          }}
        />
      ))}
    </Box>
  );
}

function abstractHTML(abstract: string) {
  const shortendAbstract =
    abstract.length > 200
      ? abstract.replaceAll("<jats:", "<").substring(0, 200) + "..."
      : abstract.replaceAll("<jats:", "<");
  const __html = sanitizeHTML(shortendAbstract);
  return <div dangerouslySetInnerHTML={{ __html }}></div>;
}

function stringArrayFilterFn(
  row: any,
  id: string,
  filterValue: string | number
) {
  const authors = row.getValue(id) as string[];
  const fv =
    typeof filterValue === "number" ? filterValue.toString() : filterValue;
  for (const a of authors) {
    if (a.includes(fv)) return true;
  }
  return false;
}

function App() {
  const [tableData, setTableData] = React.useState<DB>([]);

  React.useEffect(() => {
    console.log("Fetching from DB in loading");
    fetch("http://localhost:5000/api/get_db")
      .then((response) => response.json())
      .then((json) => setTableData(() => json));
  }, []);

  const columns = useMemo<MRT_ColumnDef<Entry>[]>(
    () => [
      {
        accessorKey: "id",
        Cell: ({ cell, row }) => (
          <DeleteButton
            id={`${cell.getValue<string>()}`}
            title={`${row.original.title}`}
            setTableData={setTableData}
            tableData={tableData}
          />
        ),
        header: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        size: 3,
      },
      {
        accessorKey: "title",
        Cell: ({ cell, row }) => (
          <a
            href={`${
              "http://localhost:5000/api/get_pdf/?file=" +
              base_64.encode(escape(row.original.path))
            }`}
            target="_blank"
            rel="noopener noreferrer"
          >{`${cell.getValue()}`}</a>
        ),
        header: "title",
        filterFn: "includesString",
      },
      {
        accessorKey: "path",
        header: "path",
        filterFn: "includesString",
      },
      {
        accessorKey: "authors",
        Cell: ({ cell }) => authorChips(cell.getValue<string[]>()),
        header: "authors",
        filterFn: stringArrayFilterFn,
      },
      {
        accessorKey: "tags",
        Cell: ({ cell }) => tagChips(cell.getValue<string[]>()),
        header: "tags",
        filterFn: stringArrayFilterFn,
        enableEditing: true,
        size: 100,
      },
      {
        accessorKey: "comments",
        header: "comments",
        filterFn: "includesString",
        enableEditing: true,
        size: 200,
      },
      {
        accessorKey: "year",
        header: "year",
        size: 50,
      },
      {
        accessorKey: "publisher",
        header: "publisher",
        filterFn: "includesString",
      },
      {
        accessorKey: "abstract",
        Cell: ({ cell }) => abstractHTML(cell.getValue<string>()),
        header: "abstract",
        filterFn: "includesString",
      },
    ],
    [tableData]
  );

  const handleSaveCell = async (cell: MRT_Cell<Entry>, value: any) => {
    let tags = tableData[cell.row.index]["tags"];
    let comments = tableData[cell.row.index]["comments"];

    if (cell.column.id === "comments") {
      comments = value;
      tableData[cell.row.index]["comments"] = comments;
    } else if (cell.column.id === "tags") {
      tags = splitTagsStr(value);
      tableData[cell.row.index]["tags"] = tags;
    }

    const e: Entry = {
      abstract: "",
      authors: [],
      id: tableData[cell.row.index]["id"],
      title: "",
      path: "",
      tags: tags,
      comments: comments,
      year: 0,
      publisher: "",
    };
    const response = await fetch("http://localhost:5000/api/update_entry", {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(e),
    });
    console.log("response of update_entry:", response);
    //send/receive api updates here
    setTableData([...tableData]);
  };

  return (
    <Box component="main" sx={{ m: 2 }}>
      <Stack direction="row" spacing={2} sx={{ m: 1 }}>
        <QuickRegisterFromUrl />
        <div style={{ flexGrow: 1 }}></div>
        <RegisterWithDialog setTableData={setTableData} />
      </Stack>
      <MaterialReactTable
        displayColumnDefOptions={{
          "mrt-row-actions": {
            muiTableHeadCellProps: {
              align: "center",
            },
            size: 10,
          },
        }}
        enableEditing
        columns={columns}
        data={tableData}
        enableRowVirtualization
        enablePagination={false}
        initialState={{
          showColumnFilters: true,
          sorting: [{ id: "year", desc: true }],
          columnVisibility: { id: true, path: false },
          density: "comfortable",
        }}
        enableStickyHeader
        enableColumnResizing
        columnResizeMode="onEnd"
        editingMode="cell"
        muiTableBodyCellEditTextFieldProps={({ cell }) => ({
          //onBlur is more efficient, but could use onChange instead
          onBlur: (event) => {
            handleSaveCell(cell, event.target.value);
          },
          variant: "outlined",
          multiline: true,
          margin: "none",
          minRows: 7,
        })}
      />
    </Box>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
