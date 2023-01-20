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
  RequestGetPdfFromFile,
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
  const [webUrlError, setWebUrlError] = React.useState(false);
  const [webUrlHelperText, setWebUrlHelperText] = React.useState("");
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
    setWebUrlError(!isValidUrl(url) && url !== "");
    if (!isValidUrl(url) && url !== "") {
      setWebUrlHelperText("Non valid URL: " + url);
    } else {
      setWebUrlHelperText("");
    }
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
      })
      .catch((error) => {
        console.log(error);
        props.setConnectionError(true);
      });
    console.log("Fetching from DB in registration");
    fetch(REACT_APP_API_URL + "/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(json))
      .catch((error) => {
        console.log(error);
        props.setConnectionError(true);
      });
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Register web article
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register web article</DialogTitle>
        <DialogContent>
          <Stack sx={{ m: 1 }} spacing={2}>
            <TextField
              error={webUrlError}
              label="URL of webpage"
              variant="outlined"
              size="small"
              value={webUrl}
              onChange={handleWebUrlFieldChange}
              sx={{ width: 500 }}
              helperText={webUrlHelperText}
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
              label="Tags (Concatenate multiple tags with comma)"
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
  if (filename === "") {
    return true;
  }

  const forbidden_chars = ["\\", "/", ":", "*", "?", '"', "<", ">", "|", "\n"];
  for (const fc of forbidden_chars) {
    if (filename.indexOf(fc) > -1) {
      return false;
    }
  }
  if (path.extname(filename) !== ".pdf") {
    return false;
  }
  return true;
}

function RegisterPDFFromFile(props: any) {
  const [file, setFile] = React.useState<File>();
  const [doi, setDoi] = React.useState("");
  const [isbn, setIsbn] = React.useState("");
  const [filename, setFilename] = React.useState("");
  const [filenameError, setFilenameError] = React.useState(false);
  const [filenameErrorText, setFilenameErrorText] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);

      let f = filename;
      if (filename === "") {
        f = e.target.files[0].name;
        setFilename(f);
      }
      setIsRegisterable(isValidFilename(f));
    }
  };

  const handleFilenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.value;
    setFilename(f);
    setFilenameError(!isValidFilename(f) && f !== "");
    if (!isValidFilename(f) && f !== "") {
      setFilenameErrorText(
        "Non valid filename: " + f + ". Filename must end with .pdf."
      );
    } else {
      setFilenameErrorText("");
    }
    // TODO: This `isValidUrl(pdfUrl)` does not works correctly because
    // filename is updated synchronously.
    setIsRegisterable(isValidFilename(f));
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
    setFilename("");
    setTags("");
    setComments("");
    setIsRegisterable(false);
    setOpen(false);
  };

  function getBase64(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleRegister() {
    if (file === undefined) {
      setOpen(false);
    } else {
      console.log("Upload PDF.");
      const fileBase64 = await getBase64(file);
      if (typeof fileBase64 !== "string") {
        setOpen(false);
      } else {
        const r: RequestGetPdfFromFile = {
          filename: filename,
          fileBase64: fileBase64,
          isbn: isbn === "" ? undefined : isbn,
          doi: doi === "" ? undefined : doi,
          tags: splitTagsStr(tags),
          comments: comments,
        };
        console.log("Add PDF from URL");
        setOpen(false);
        await fetch(REACT_APP_API_URL + "/api/add_pdf_from_file", {
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
          })
          .catch((error) => {
            console.log(error);
            props.setConnectionError(true);
          });
        console.log("Fetching from DB in registration");
        fetch(REACT_APP_API_URL + "/api/get_db")
          .then((response) => response.json())
          .then((json) => props.setTableData(json))
          .catch((error) => {
            console.log(error);
            props.setConnectionError(true);
          });
      }
    }
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Upload PDF
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Upload PDF</DialogTitle>
        <DialogContent>
          <Stack sx={{ m: 1 }} spacing={2}>
            <Button variant="contained" component="label">
              Select PDF File
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                hidden
              />
            </Button>
            <TextField
              error={filenameError}
              label="Filename (Can use metadata e.g. hoge [jendeley isbn 9781467330763].pdf)"
              variant="outlined"
              size="small"
              value={filename}
              onChange={handleFilenameChange}
              sx={{ width: 500 }}
              helperText={filenameErrorText}
            />
            <TextField
              label="Tags (Concatenate multiple tags with comma)"
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

function RegisterPDFFromWeb(props: any) {
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [pdfUrlError, setPdfUrlError] = React.useState(false);
  const [pdfUrlHelperText, setPdfUrlHelperText] = React.useState("");
  const [doi, setDoi] = React.useState("");
  const [isbn, setIsbn] = React.useState("");
  const [filename, setFilename] = React.useState("");
  const [filenameError, setFilenameError] = React.useState(false);
  const [filenameErrorText, setFilenameErrorText] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [isRegisterable, setIsRegisterable] = React.useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const handlePdfUrlFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url: string = event.target.value;
    setPdfUrl(url);
    setPdfUrlError(!isValidUrl(url) && url !== "");
    if (!isValidUrl(url) && url !== "") {
      setPdfUrlHelperText("Non valid URL: " + url);
    } else {
      setPdfUrlHelperText("");
    }
    // TODO: This `isValidFilename(filename)` does not works correctly because
    // filename is updated synchronously.
    setIsRegisterable(isValidUrl(url) && isValidFilename(filename));
  };

  const handleFilenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.value;
    setFilename(f);
    setFilenameError(!isValidFilename(f) && f !== "");
    if (!isValidFilename(f) && f !== "") {
      setFilenameErrorText(
        "Non valid filename: " + f + ". Filename must end with .pdf."
      );
    } else {
      setFilenameErrorText("");
    }
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
      })
      .catch((error) => {
        console.log(error);
        props.setConnectionError(true);
      });
    console.log("Fetching from DB in registration");
    fetch(REACT_APP_API_URL + "/api/get_db")
      .then((response) => response.json())
      .then((json) => props.setTableData(json))
      .catch((error) => {
        console.log(error);
        props.setConnectionError(true);
      });
  }

  return (
    <Box>
      <Button variant="contained" onClick={handleClickOpen}>
        Register PDF
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Register PDF</DialogTitle>
        <DialogContent>
          <Stack sx={{ m: 1 }} spacing={2}>
            <TextField
              error={pdfUrlError}
              label="URL of PDF"
              variant="outlined"
              size="small"
              value={pdfUrl}
              onChange={handlePdfUrlFieldChange}
              sx={{ width: 500 }}
              helperText={pdfUrlHelperText}
            />
            <TextField
              error={filenameError}
              label="Filename (Can use metadata e.g. hoge [jendeley isbn 9781467330763].pdf)"
              variant="outlined"
              size="small"
              value={filename}
              onChange={handleFilenameChange}
              sx={{ width: 500 }}
              helperText={filenameErrorText}
            />
            <TextField
              label="Tags (Concatenate multiple tags with comma)"
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

export { RegisterWebWithDialog, RegisterPDFFromWeb, RegisterPDFFromFile };
