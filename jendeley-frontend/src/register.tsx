import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import "./App.css";
import {
  ApiResponse,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
} from "./api_schema";
import { splitTagsStr } from "./stringUtils";
import { useSnackbar } from "notistack";
import path from "path";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

function isValidUrl(urlString: string) {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
}

function RegisterWebWithDialog(props: any) {
  const [webUrl, setWebUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleWebUrlFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url: string = event.target.value;
    setWebUrl(url);
    setIsRegisterable(isValidUrl(url));
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTags(event.target.value);
  };

  const handleCommentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComments(event.target.value);
  };

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setWebUrl("");
    setTitle("");
    setTags("");
    setComments("");
    setIsRegisterable(false);
    setOpen(false);
  };

  async function handleRegister() {
    console.log("Register Web.");
    const r: RequestGetWebFromUrl = {
      url: webUrl,
      title: title,
      tags: splitTagsStr(tags),
      comments: comments,
    };
    setWebUrl("");
    console.log("Add an web article from URL");
    setOpen(false);
    await fetch(REACT_APP_API_URL + "/api/add_web_from_url", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(r),
    })
      .then((response) => response.json())
      .then((apiResponse: ApiResponse) => {
        console.log("response = " + JSON.stringify(apiResponse));
        if (apiResponse.isSucceeded) {
          enqueueSnackbar(apiResponse.message, { variant: "info" });
        } else {
          enqueueSnackbar(apiResponse.message, { variant: "error" });
        }
      });
    console.log("Fetching from DB in registration");
    fetch(REACT_APP_API_URL + "/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(() => json));
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Register web article
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register web article</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="URL of webpage"
              variant="outlined"
              size="small"
              value={webUrl}
              onChange={handleWebUrlFieldChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Title (Get from webpage when empty)"
              variant="outlined"
              size="small"
              value={title}
              onChange={handleTitleChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Tags"
              variant="outlined"
              size="small"
              value={tags}
              onChange={handleTagsChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Comments"
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
            disabled={!isRegisterable}
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

function isValidFilename(filename: string) {
  if (filename == "") {
    return true;
  }

  const forbidden_chars = ["\\", "/", ":", "*", "?", '"', "<", ">", "|", "\n"];
  for (const fc of forbidden_chars) {
    if (filename.indexOf(fc) > -1) {
      return false;
    }
  }
  if (path.extname(filename) != ".pdf") {
    return false;
  }
  return true;
}

function RegisterPDFWithDialog(props: any) {
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [doi, setDoi] = React.useState("");
  const [isbn, setIsbn] = React.useState("");
  const [filename, setFilename] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handlePdfUrlFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url: string = event.target.value;
    setPdfUrl(url);
    // TODO: This `isValidFilename(filename)` does not works correctly because
    // filename is updated synchronously.
    setIsRegisterable(isValidUrl(url) && isValidFilename(filename));
  };

  const handleFilenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.value;
    setFilename(f);
    // TODO: This `isValidUrl(pdfUrl)` does not works correctly because
    // filename is updated synchronously.
    setIsRegisterable(isValidUrl(pdfUrl) && isValidFilename(f));
  };

  const handleDoiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDoi(event.target.value);
  };

  const handleIsbnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsbn(event.target.value);
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTags(event.target.value);
  };

  const handleCommentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsRegisterable(false);
    setPdfUrl("");
    setFilename("");
    setTags("");
    setComments("");
    setIsRegisterable(false);
    setOpen(false);
  };

  async function handleRegister() {
    console.log("Register PDF.");
    const r: RequestGetPdfFromUrl = {
      url: pdfUrl,
      filename: filename === "" ? undefined : filename,
      isbn: isbn === "" ? undefined : isbn,
      doi: doi === "" ? undefined : doi,
      tags: splitTagsStr(tags),
      comments: comments,
    };
    setPdfUrl("");
    console.log("Add PDF from URL");
    setOpen(false);
    await fetch(REACT_APP_API_URL + "/api/add_pdf_from_url", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(r),
    })
      .then((response) => response.json())
      .then((apiResponse: ApiResponse) => {
        console.log("response = " + JSON.stringify(apiResponse));
        if (apiResponse.isSucceeded) {
          enqueueSnackbar(apiResponse.message, { variant: "info" });
        } else {
          enqueueSnackbar(apiResponse.message, { variant: "error" });
        }
      });
    console.log("Fetching from DB in registration");
    fetch(REACT_APP_API_URL + "/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(() => json));
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Register PDF
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register PDF</DialogTitle>
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
              label="Filename (Can use metadata e.g. hoge [jendeley isbn 9781467330763].pdf)"
              variant="outlined"
              size="small"
              value={filename}
              onChange={handleFilenameChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Tags"
              variant="outlined"
              size="small"
              value={tags}
              onChange={handleTagsChange}
              sx={{ width: 500 }}
            />
            <TextField
              label="Comments"
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
            disabled={!isRegisterable}
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

export { RegisterWebWithDialog, RegisterPDFWithDialog };
