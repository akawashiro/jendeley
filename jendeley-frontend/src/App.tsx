import React, { useMemo } from "react";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import base_64 from "base-64";
import { Box } from "@mui/material";
import "./App.css";
import { ApiEntry, ApiDB } from "./api_schema";
import {
  MaterialReactTable,
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
import { splitTagsOrAuthorsStr, getColorFromString } from "./stringUtils";
import { DeleteButton } from "./delete";
import EditIcon from "@mui/icons-material/Edit";
import { grey } from "@mui/material/colors";
import { SnackbarProvider } from "notistack";
import { ConferenceChip } from "./conference";
import {
  AUTHORES_EDITABLE_ID_TYPES,
  TITLE_EDITABLE_ID_TYPES,
} from "./constants";
import { fetchDB } from "./api_call";

const VITE_API_URL = process.env.VITE_API_URL;

function TypeChip(type: string) {
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

function AuthorChips(idType: string, authors: string[]) {
  return (
    <Box>
      {AUTHORES_EDITABLE_ID_TYPES.includes(idType) && (
        <EditIcon sx={{ color: grey[300] }} />
      )}
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
  return (
    <Box>
      <EditIcon sx={{ color: grey[300] }} />
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
  filterValue: string | number,
) {
  const authors = row.getValue(id) as string[];
  const fv =
    typeof filterValue === "number" ? filterValue.toString() : filterValue;
  for (const a of authors) {
    if (a.includes(fv)) return true;
  }
  return false;
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
      <Box>
        {row.original.idType === "path" && (
          <EditIcon sx={{ color: grey[300] }} />
        )}
        <a
          href={`${
            VITE_API_URL +
            "/api/get_pdf/?file=" +
            base_64.encode(escape(row.original.path))
          }`}
          target="_blank"
          rel="noopener noreferrer"
        >{`${title}`}</a>
      </Box>
    );
  }
}

function useColumnDefs(
  tableData: ApiDB,
  setTableData: React.Dispatch<React.SetStateAction<ApiDB>>,
  columnFilters: MRT_ColumnFiltersState,
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
            columnFilters={columnFilters}
            setTableData={setTableData}
            tableData={tableData}
          />
        ),
        header: "action",
        enableColumnFilter: false,
        enableSorting: false,
        enableEditing: false,
        enableColumnActions: false,
        size: 50,
        enableResizing: false,
      },
      {
        accessorKey: "idType",
        Cell: ({ cell, row }) => TypeChip(cell.getValue<string>()),
        header: "type",
        enableColumnFilter: false,
        enableSorting: false,
        enableEditing: false,
        enableColumnActions: false,
        size: 50,
        enableResizing: false,
      },
      {
        accessorKey: "year",
        header: "year",
        enableSorting: false,
        enableEditing: false,
        size: 70,
        enableResizing: false,
        muiTableHeadCellFilterTextFieldProps: { placeholder: "year" },
      },
      {
        accessorKey: "title",
        Cell: ({ cell, row }) => CellHref(cell, row),
        header: "title",
        enableSorting: false,
        enableEditing: true,
        size: 200,
      },
      {
        accessorKey: "path",
        header: "path",
        enableSorting: false,
        enableEditing: false,
        filterFn: "includesString",
      },
      {
        accessorKey: "authors",
        Cell: ({ cell, row }) =>
          AuthorChips(row.original.idType, cell.getValue<string[]>()),
        header: "authors",
        enableSorting: false,
        enableEditing: true,
      },
      {
        accessorKey: "tags",
        Cell: ({ cell }) => TagChips(cell.getValue<string[]>()),
        header: "tags",
        enableSorting: false,
        enableEditing: true,
        // size: 100,
      },
      {
        accessorKey: "comments",
        header: "comments",
        Cell: ({ cell }) => CommentsDiv(cell.getValue<string>()),
        filterFn: "includesString",
        enableSorting: false,
        enableEditing: true,
        size: 400,
      },
      {
        accessorKey: "publisher",
        header: "publisher",
        enableSorting: false,
        Cell: ({ cell }) => ConferenceChip(cell.getValue<string>()),
        enableEditing: false,
      },
      {
        accessorKey: "abstract",
        Cell: ({ cell }) => AbstractHTML(cell.getValue<string>()),
        header: "abstract",
        enableSorting: false,
        filterFn: "includesString",
        enableEditing: false,
      },
      {
        accessorKey: "text",
        Cell: ({ cell }) => ShowText(cell.getValue<string>()),
        enableSorting: false,
        header: "text",
        enableEditing: false,
        size: 400,
      },
    ],
    [tableData, setTableData],
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
    fetchDB(columnFilters, setTableData, setConnectionError);
  }, []);

  React.useEffect(() => {
    console.log(
      "Fetching from DB because of changes in columnFilters or sorting. columnFilters = ",
      columnFilters,
      "sorting = ",
      sorting,
    );

    fetchDB(columnFilters, setTableData, setConnectionError);
  }, [columnFilters, sorting]);

  const columns = useColumnDefs(tableData, setTableData, columnFilters);

  const handleSaveCell = async (cell: MRT_Cell<ApiEntry>, value: any) => {
    let tags = tableData[cell.row.index]["tags"];
    let authors = tableData[cell.row.index]["authors"];
    let comments = tableData[cell.row.index]["comments"];
    let title = tableData[cell.row.index]["title"];

    if (cell.column.id === "comments") {
      comments = value;
      tableData[cell.row.index]["comments"] = comments;
    } else if (cell.column.id === "tags") {
      tags = splitTagsOrAuthorsStr(value);
      tableData[cell.row.index]["tags"] = tags;
    } else if (cell.column.id === "authors") {
      if (!AUTHORES_EDITABLE_ID_TYPES.includes(cell.row.original.idType)) {
        const message =
          "Cannot edit authors for idType = " + cell.row.original.idType;
        // TODO: show error message using Snackbar
        // enqueueSnackbar(message, { variant: "error" });
        console.warn(message);
        return;
      } else {
        authors = splitTagsOrAuthorsStr(value);
        tableData[cell.row.index]["authors"] = authors;
      }
    } else if (cell.column.id === "title") {
      if (!TITLE_EDITABLE_ID_TYPES.includes(cell.row.original.idType)) {
        const message =
          "Cannot edit tile for idType = " + cell.row.original.idType;
        // TODO: show error message using Snackbar
        // enqueueSnackbar(message, { variant: "error" });
        console.warn(message);
        return;
      } else {
        title = value;
        tableData[cell.row.index]["title"] = title;
      }
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
    const response = await fetch(VITE_API_URL + "/api/update_entry", {
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
            editDisplayMode="cell"
            muiEditTextFieldProps={({ cell }) => ({
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
                    columnFilters={columnFilters}
                  />
                  <RegisterPDFFromWeb
                    setTableData={setTableData}
                    setConnectionError={setConnectionError}
                    columnFilters={columnFilters}
                  />
                  <RegisterPDFFromFile
                    setTableData={setTableData}
                    setConnectionError={setConnectionError}
                    columnFilters={columnFilters}
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
