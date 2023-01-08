import React, { useMemo } from "react";
import Chip from "@mui/material/Chip";
import ReactDOM from "react-dom/client";
import base_64 from "base-64";
import { Box } from "@mui/material";
import "./App.css";
import { ApiEntry, ApiDB } from "./api_schema";
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row,
} from "material-react-table";
import sanitizeHTML from "sanitize-html";
import { RegisterWebWithDialog, RegisterPDFWithDialog } from "./register";
import { splitTagsStr, getColorFromString } from "./stringUtils";
import { DeleteButton } from "./delete";
import EditIcon from "@mui/icons-material/Edit";
import { grey } from "@mui/material/colors";
import { SnackbarProvider } from "notistack";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

function AuthorChips(authors: string[]) {
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

function TagChips(tags: string[]) {
  if (tags.length === 0) {
    return <EditIcon sx={{ color: grey[300] }} />;
  } else {
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
}

function CommentsDiv(comments: string) {
  if (comments === "") {
    return <EditIcon sx={{ color: grey[300] }} />;
  } else {
    return (
      <Box>
        `<p>{comments}</p>`
      </Box>
    );
  }
}

function AbstractHTML(abstract: string) {
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

function cellHref(cell: MRT_Cell<ApiEntry>, row: MRT_Row<ApiEntry>) {
  if (row.original.idType === "url") {
    return (
      <a
        href={`${row.original.url}`}
        target="_blank"
        rel="noopener noreferrer"
      >{`${cell.getValue()}`}</a>
    );
  } else {
    if (row.original.path === undefined) {
      throw Error("row.original.path is undefined for " + row.original.id);
    }
    return (
      <a
        href={`${
          REACT_APP_API_URL +
          "/api/get_pdf/?file=" +
          base_64.encode(escape(row.original.path))
        }`}
        target="_blank"
        rel="noopener noreferrer"
      >{`${cell.getValue()}`}</a>
    );
  }
}

function App() {
  const [tableData, setTableData] = React.useState<ApiDB>([]);

  React.useEffect(() => {
    console.log("Fetching from DB in loading");
    fetch(REACT_APP_API_URL + "/api/get_db")
      .then((response) => response.json())
      .then((json) => setTableData(json));
  }, []);

  const columns = useMemo<MRT_ColumnDef<ApiEntry>[]>(
    () => [
      {
        accessorKey: "id",
        Cell: ({ cell, row }) => (
          <DeleteButton
            id={`${cell.getValue<string>()}`}
            idType={`${row.original.idType}`}
            title={`${row.original.title}`}
            setTableData={setTableData}
            tableData={tableData}
          />
        ),
        header: "",
        enableColumnFilter: false,
        enableSorting: false,
        enableEditing: false,
        enableColumnActions: false,
        size: 3,
      },
      {
        accessorKey: "title",
        Cell: ({ cell, row }) => cellHref(cell, row),
        header: "title",
        enableEditing: false,
        filterFn: "includesString",
      },
      {
        accessorKey: "path",
        header: "path",
        enableEditing: false,
        filterFn: "includesString",
      },
      {
        accessorKey: "authors",
        Cell: ({ cell }) => AuthorChips(cell.getValue<string[]>()),
        header: "authors",
        enableEditing: false,
        filterFn: stringArrayFilterFn,
      },
      {
        accessorKey: "tags",
        Cell: ({ cell }) => TagChips(cell.getValue<string[]>()),
        header: "tags",
        filterFn: stringArrayFilterFn,
        enableEditing: true,
        size: 100,
      },
      {
        accessorKey: "comments",
        header: "comments",
        Cell: ({ cell }) => CommentsDiv(cell.getValue<string>()),
        filterFn: "includesString",
        enableEditing: true,
        size: 200,
      },
      {
        accessorKey: "year",
        header: "year",
        enableEditing: false,
        size: 50,
        muiTableHeadCellFilterTextFieldProps: { placeholder: "year" },
      },
      {
        accessorKey: "publisher",
        header: "publisher",
        filterFn: "includesString",
        enableEditing: false,
      },
      {
        accessorKey: "abstract",
        Cell: ({ cell }) => AbstractHTML(cell.getValue<string>()),
        header: "abstract",
        filterFn: "includesString",
        enableEditing: false,
      },
    ],
    [tableData]
  );

  const handleSaveCell = async (cell: MRT_Cell<ApiEntry>, value: any) => {
    let tags = tableData[cell.row.index]["tags"];
    let comments = tableData[cell.row.index]["comments"];

    if (cell.column.id === "comments") {
      comments = value;
      tableData[cell.row.index]["comments"] = comments;
    } else if (cell.column.id === "tags") {
      tags = splitTagsStr(value);
      tableData[cell.row.index]["tags"] = tags;
    }

    const e: ApiEntry = {
      abstract: tableData[cell.row.index]["abstract"],
      authors: tableData[cell.row.index]["authors"],
      id: tableData[cell.row.index]["id"],
      idType: tableData[cell.row.index]["idType"],
      url: tableData[cell.row.index]["url"],
      title: tableData[cell.row.index]["title"],
      path: tableData[cell.row.index]["path"],
      tags: tags,
      comments: comments,
      year: tableData[cell.row.index]["year"],
      publisher: tableData[cell.row.index]["publisher"],
    };
    const response = await fetch(REACT_APP_API_URL + "/api/update_entry", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(e),
    });
    console.log("response of update_entry:", response);
    //send/receive api updates here
    setTableData([...tableData]);
  };

  return (
    <SnackbarProvider maxSnack={10} autoHideDuration={30000}>
      <Box component="main" sx={{ m: 2 }}>
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
          renderTopToolbarCustomActions={({ table }) => {
            return (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <RegisterWebWithDialog setTableData={setTableData} />
                <RegisterPDFWithDialog setTableData={setTableData} />
              </div>
            );
          }}
        />
      </Box>
    </SnackbarProvider>
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
