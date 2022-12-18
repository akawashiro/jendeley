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
import { RequestGetPdfFromUrl, RequestGetWebFromUrl } from "./schema";
import { splitTagsStr } from "./stringUtils";

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
    const r: RequestGetPdfFromUrl = {
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
        "Access-Control-Allow-Methods": "PUT",
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

function RegisterWebWithDialog(props: any) {
  const [webUrl, setWebUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(true);

  const handlePdfUrlFieldChange = (event: any) => {
    setWebUrl(event.target.value);
    setIsRegisterable(isValidUrl(webUrl));
  };

  const handleTitleChange = (event: any) => {
    setTitle(event.target.value);
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
    const r: RequestGetWebFromUrl = {
      url: webUrl,
      tags: splitTagsStr(tags),
      comments: comments,
    };
    setWebUrl("");
    console.log("Add an web article from URL");
    setOpen(false);
    await fetch("http://localhost:5000/api/add_web_from_url", {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(r),
    });
    console.log("Fetching from DB in registration");
    fetch("http://localhost:5000/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(() => json));
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Register web article
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register new PDF</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="URL of PDF"
              variant="outlined"
              size="small"
              value={webUrl}
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

function RegisterPDFWithDialog(props: any) {
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
    const r: RequestGetPdfFromUrl = {
      url: pdfUrl,
      isbn: isbn === "" ? null : isbn,
      doi: doi === "" ? null : doi,
      tags: splitTagsStr(tags),
      comments: comments,
    };
    setPdfUrl("");
    console.log("Add from URL");
    setOpen(false);
    await fetch("http://localhost:5000/api/add_pdf_from_url", {
      method: "PUT",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(r),
    });
    console.log("Fetching from DB in registration");
    fetch("http://localhost:5000/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(() => json));
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Register PDF
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

export { QuickRegisterFromUrl, RegisterWebWithDialog, RegisterPDFWithDialog };
