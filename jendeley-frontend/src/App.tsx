import React, { useEffect, useMemo } from "react";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import base_64 from "base-64";
import { Box } from "@mui/material";
import "./App.css";
import { ApiEntry, ApiDB, RequestGetDB } from "./api_schema";
import MaterialReactTable, {
  MRT_Cell,
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_Row,
  MRT_SortingState,
} from "material-react-table";
import ReactMarkdown from "react-markdown";
import sanitizeHTML from "sanitize-html";
import {
  RegisterWebWithDialog,
  RegisterPDFFromWeb,
  RegisterPDFFromFile,
} from "./register";
import { splitTagsStr, getColorFromString } from "./stringUtils";
import { DeleteButton } from "./delete";
import EditIcon from "@mui/icons-material/Edit";
import { grey } from "@mui/material/colors";
import { SnackbarProvider } from "notistack";
import { ConferenceAcronyms, getAcronyms } from "./conferenceAcronyms";
import { fuzzySearch, HighlightedText } from "./fuzzysearch";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

function TypeChip(type: string) {
  // TODO padding or margine
  return (
    <Box>
      <Chip
        label={`${type}`}
        size="small"
        onClick={() => {
          navigator.clipboard.writeText(type);
        }}
        sx={{
          color: getColorFromString(type).color,
          bgcolor: getColorFromString(type).bgcolor,
          m: 0.1,
        }}
      />
    </Box>
  );
}

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
        <ReactMarkdown>{comments}</ReactMarkdown>
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

function ShowText(text: string | undefined) {
  if (text === undefined) {
    return <Box></Box>;
  } else {
    const __html = sanitizeHTML(text);
    return <div dangerouslySetInnerHTML={{ __html }}></div>;
  }
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

function conferenceAcronymsFilterFn(
  row: any,
  id: string,
  filterValue: string | number
) {
  let conference = row.getValue(id);
  if (typeof conference !== "string") {
    conference = "";
  }
  const fv =
    typeof filterValue === "number" ? filterValue.toString() : filterValue;
  return getAcronyms(conference).includes(fv) || conference.includes(fv);
}

function purifyTitle(title: string): string {
  const t1 = title.replace(/\.pdf$/, "");
  const t2 = t1.replace("[jendeley no id]", "");
  const t3 = t2.replace("[jendeley download [0-9]+]", "");
  return t3;
}

function CellHref(cell: MRT_Cell<ApiEntry>, row: MRT_Row<ApiEntry>) {
  const title = purifyTitle(cell.getValue<string>());

  if (row.original.idType === "url") {
    return (
      <a
        href={`${row.original.url}`}
        target="_blank"
        rel="noopener noreferrer"
      >{`${title}`}</a>
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
      >{`${title}`}</a>
    );
  }
}

function useColumnDefs(
  tableData: ApiDB,
  setTableData: React.Dispatch<React.SetStateAction<ApiDB>>
): MRT_ColumnDef<ApiEntry>[] {
  return useMemo<MRT_ColumnDef<ApiEntry>[]>(
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
        header: "action",
        enableColumnFilter: false,
        enableSorting: false,
        enableEditing: false,
        enableColumnActions: false,
        size: 2,
      },
      {
        accessorKey: "idType",
        Cell: ({ cell, row }) => TypeChip(cell.getValue<string>()),
        header: "type",
        enableColumnFilter: false,
        enableSorting: false,
        enableEditing: false,
        enableColumnActions: false,
        size: 2,
      },
      {
        accessorKey: "title",
        Cell: ({ cell, row }) => CellHref(cell, row),
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
        Cell: ({ cell }) => ConferenceAcronyms(cell.getValue<string>()),
        filterFn: conferenceAcronymsFilterFn,
        enableEditing: false,
      },
      {
        accessorKey: "abstract",
        Cell: ({ cell }) => AbstractHTML(cell.getValue<string>()),
        header: "abstract",
        filterFn: "includesString",
        enableEditing: false,
      },
      {
        accessorKey: "text",
        Cell: ({ cell }) => ShowText(cell.getValue<string>()),
        header: "text",
        enableEditing: false,
      },
    ],
    [tableData, setTableData]
  );
}

function App() {
  const [tableData, setTableData] = React.useState<ApiDB>([]);
  const [connectionError, setConnectionError] = React.useState(false);

  // Table state
  const [columnFilters, setColumnFilters] =
    React.useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<MRT_SortingState>([]);

  // Fetch the table data from the server for the first time.
  React.useEffect(() => {
    console.log("Fetching from DB in loading");
    fetch(REACT_APP_API_URL + "/api/get_db", { method: "POST" })
      .then((response) => response.json())
      .then((json) => setTableData(json))
      .catch((error) => {
        console.log(error);
        setConnectionError(true);
      });
  }, []);

  React.useEffect(() => {
    console.log(
      "Fetching from DB because of changes in columnFilters or sorting. columnFilters = ",
      columnFilters,
      "sorting = ",
      sorting
    );

    let title: string | undefined = undefined;
    for (const filter of columnFilters) {
      if (filter.id === "title") {
        if (typeof filter.value !== "string") {
          throw Error("filter.value is not a string");
        }
        title = filter.value;
        break;
      }
    }

    let text: string | undefined = undefined;
    for (const filter of columnFilters) {
      if (filter.id === "text") {
        if (typeof filter.value !== "string") {
          throw Error("filter.value is not a string");
        }
        text = filter.value;
        break;
      }
    }

    const request: RequestGetDB = {
      title: title,
      authors: undefined,
      tags: undefined,
      comments: undefined,
      year: undefined,
      publisher: undefined,
      text: text,
    };

    fetch(REACT_APP_API_URL + "/api/get_db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })
      .then((response) => response.json())
      .then((json) => setTableData(json))
      .catch((error) => {
        console.log(error);
        setConnectionError(true);
      });
  }, [columnFilters, sorting]);

  const columns = useColumnDefs(tableData, setTableData);

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
      text: tableData[cell.row.index]["text"],
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
    }).catch((error) => {
      console.log(error);
      setConnectionError(true);
    });
    console.log("response of update_entry:", response);
    //send/receive api updates here
    setTableData([...tableData]);
  };

  if (connectionError) {
    return (
      <Alert
        severity="error"
        variant="filled"
        sx={{ fontSize: 64 }}
        icon={false}
      >
        Cannot connect to the backend server. Please check and reload this page.
      </Alert>
    );
  } else {
    return (
      <SnackbarProvider maxSnack={10} autoHideDuration={30000}>
        <Box component="main">
          <MaterialReactTable
            onColumnFiltersChange={setColumnFilters}
            onSortingChange={setSorting}
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
              columnVisibility: {
                id: true,
                idType: true,
                path: false,
                publisher: true,
                abstract: false,
              },
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
                  <RegisterWebWithDialog
                    setTableData={setTableData}
                    setConnectionError={setConnectionError}
                  />
                  <RegisterPDFFromWeb
                    setTableData={setTableData}
                    setConnectionError={setConnectionError}
                  />
                  <RegisterPDFFromFile
                    setTableData={setTableData}
                    setConnectionError={setConnectionError}
                  />
                </div>
              );
            }}
          />
        </Box>
      </SnackbarProvider>
    );
  }
}

export default App;
