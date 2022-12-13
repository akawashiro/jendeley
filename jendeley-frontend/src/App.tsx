import React, { useMemo } from "react";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ReactDOM from "react-dom/client";
import base_64 from "base-64";
import "./App.css";
import { Entry, DB, RequestGetFromURL } from "./schema";
import MaterialReactTable, {
  MaterialReactTableProps,
  MRT_ColumnDef,
} from "material-react-table";
import sanitizeHTML from "sanitize-html";
import {
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
  brown,
  grey,
  blueGrey,
} from "@mui/material/colors";

function splitTagsStr(s: string) {
  return s.split(",").filter((w) => w.length > 0);
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const cc = s.charCodeAt(i);
    h = (h * 23249425 + cc) % 24862048;
  }
  return h;
}

function getColorFromString(author: string) {
  const colorList = [
    { color: "white", bgcolor: red[900] },
    { color: "white", bgcolor: pink[900] },
    { color: "white", bgcolor: purple[900] },
    { color: "white", bgcolor: deepPurple[900] },
    { color: "white", bgcolor: indigo[900] },
    { color: "white", bgcolor: blue[900] },
    { color: "white", bgcolor: lightBlue[900] },
    { color: "white", bgcolor: cyan[900] },
    { color: "white", bgcolor: teal[900] },
    { color: "white", bgcolor: green[900] },
    { color: "white", bgcolor: lightGreen[900] },
    { color: "white", bgcolor: lime[900] },
    { color: "white", bgcolor: yellow[900] },
    { color: "white", bgcolor: amber[900] },
    { color: "white", bgcolor: orange[900] },
    { color: "white", bgcolor: deepOrange[900] },
    { color: "white", bgcolor: brown[900] },
    { color: "white", bgcolor: grey[900] },
    { color: "white", bgcolor: blueGrey[900] },
  ];
  return colorList[hashString(author) % colorList.length];
}

function authorChips(authors: string[]) {
  // TODO padding or margine
  return (
    <div>
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
    </div>
  );
}

function tagChips(tags: string[]) {
  // TODO padding or margine
  return (
    <div>
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
    </div>
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

function QuickRegisterFromUrl() {
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(true);

  const handlePdfUrlFieldChange = (event: any) => {
    setPdfUrl(event.target.value);
    setIsRegisterable(isValidUrl(pdfUrl));
  };

  function isValidUrl(urlString: string) {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  }

  async function handleOnClick() {
    console.log("Register new PDF.");
    const r: RequestGetFromURL = {
      url: pdfUrl,
      isbn: null,
      doi: null,
      tags: [],
      comments: "",
    };
    setPdfUrl("");
    await fetch("http://localhost:5000/api/add_from_url", {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(r),
    });
  }

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        label="URL of PDF"
        variant="outlined"
        size="small"
        value={pdfUrl}
        onChange={handlePdfUrlFieldChange}
        sx={{ width: 500 }}
      />
      <Button
        variant="contained"
        disabled={isRegisterable}
        onClick={handleOnClick}
      >
        Register from URL
      </Button>
    </Stack>
  );
}

function RegisterWithDialog(props: any) {
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [doi, setDoi] = React.useState("");
  const [isbn, setIsbn] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(true);

  const handlePdfUrlFieldChange = (event: any) => {
    setPdfUrl(event.target.value);
    setIsRegisterable(isValidUrl(pdfUrl));
  };

  const handleTitleChange = (event: any) => {
    setTitle(event.target.value);
  };

  const handleDoiChange = (event: any) => {
    setDoi(event.target.value);
  };

  const handleIsbnChange = (event: any) => {
    setIsbn(event.target.value);
  };

  const handleTagsChange = (event: any) => {
    setTags(event.target.value);
  };

  const handleCommentsChange = (event: any) => {
    setComments(event.target.value);
  };

  function isValidUrl(urlString: string) {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  }

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function handleRegister() {
    console.log("Register new PDF.");
    const r: RequestGetFromURL = {
      url: pdfUrl,
      isbn: isbn === "" ? null : isbn,
      doi: doi === "" ? null : doi,
      tags: splitTagsStr(tags),
      comments: comments,
    };
    setPdfUrl("");
    console.log("Add from URL");
    setOpen(false);
    await fetch("http://localhost:5000/api/add_from_url", {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(r),
    });
    console.log("Fetching from DB");
    fetch("http://localhost:5000/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(() => json));
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Open registration form
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register new PDF</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="URL of PDF"
              variant="outlined"
              size="small"
              value={pdfUrl}
              onChange={handlePdfUrlFieldChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Title"
              variant="outlined"
              size="small"
              value={title}
              onChange={handleTitleChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Digital Object Identifier"
              variant="outlined"
              size="small"
              value={doi}
              onChange={handleDoiChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="ISBN"
              variant="outlined"
              size="small"
              value={isbn}
              onChange={handleIsbnChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="tags"
              variant="outlined"
              size="small"
              value={tags}
              onChange={handleTagsChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="comments"
              variant="outlined"
              size="small"
              value={comments}
              onChange={handleCommentsChange}
              sx={{ width: 500 }}
              multiline={true}
              rows={5}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            disabled={isRegisterable}
            onClick={handleRegister}
          >
            Register
          </Button>
          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
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
    console.log("Fetching from DB");
    fetch("http://localhost:5000/api/get_db")
      .then((response) => response.json())
      .then((json) => setTableData(() => json));
  }, []);

  const columns = useMemo<MRT_ColumnDef<Entry>[]>(
    () => [
      {
        accessorKey: "id",
        header: "id",
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
      },
      {
        accessorKey: "comments",
        header: "comments",
        filterFn: "includesString",
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
    []
  );

  const handleSaveRow: MaterialReactTableProps<Entry>["onEditingRowSave"] =
    async ({ exitEditingMode, row, values }) => {
      // TODO: Ban editing fields other than "tags" and "comments".
      const edittedTags = splitTagsStr(values.tags);
      const edittedComments = values.comments;
      tableData[row.index]["tags"] = edittedTags;
      tableData[row.index]["comments"] = edittedComments;

      const e: Entry = {
        abstract: "",
        authors: [],
        id: values.id,
        title: "",
        path: "",
        tags: edittedTags,
        comments: edittedComments,
        year: 0,
        publisher: "",
      };
      const response = await fetch("http://localhost:5000/api/update_entry", {
        method: "PUT",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(e),
      });
      console.log("response of update_entry:", response);
      //send/receive api updates here
      setTableData([...tableData]);
      exitEditingMode(); //required to exit editing mode
    };

  return (
    <Box component="main" sx={{ m: 2 }}>
      <Stack direction="row" spacing={2} sx={{ m: 1 }}>
        <QuickRegisterFromUrl />
        <div style={{ flexGrow: 1 }}></div>
        <RegisterWithDialog setTableData={setTableData} />
      </Stack>
      <MaterialReactTable
        columns={columns}
        data={tableData}
        filterFns={{
          titleFilterFn: (row, id, filterValue) =>
            row.original.title.includes(filterValue),
        }}
        enableRowVirtualization
        enablePagination={false}
        initialState={{
          showColumnFilters: true,
          sorting: [{ id: "year", desc: true }],
          columnVisibility: { id: false, path: false },
          density: "comfortable",
          // pagination: { pageSize: 20, pageIndex: 0 },
          // showGlobalFilter: true,
        }}
        positionGlobalFilter="left"
        enableStickyHeader
        globalFilterFn="titleFilterFn"
        enableColumnResizing
        columnResizeMode="onEnd"
        editingMode="modal"
        enableEditing
        onEditingRowSave={handleSaveRow}
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
