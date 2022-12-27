import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
} from "@mui/material";
import "./App.css";
import { IDType, Entry } from "./schema";
import { Delete } from "@mui/icons-material";

const { REACT_APP_API_URL } = process.env;

function DeleteButton(props: any) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function deleteRow(
    id: string,
    idType: IDType,
    tableData: any,
    setTableData: any
  ) {
    console.log("Delete " + id);

    const e: Entry = {
      abstract: "",
      authors: [],
      id: id,
      url: "",
      idType: idType,
      title: "",
      path: "",
      tags: [],
      comments: "",
      year: 0,
      publisher: "",
    };
    const response = await fetch(REACT_APP_API_URL + "/api/delete_entry", {
      method: "DELETE",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(e),
    });
    console.log("response of update_entry:", response);

    fetch(REACT_APP_API_URL + "/api/get_db")
      .then((response) => response.json())
      .then((json) => setTableData(() => json));

    setOpen(false);
  }

  return (
    <div>
      <IconButton onClick={handleClickOpen}>
        <Delete />
      </IconButton>
      <Dialog open={open}>
        <DialogContent>
          <DialogContentText>Delete "{`${props.title}`}"?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() =>
              deleteRow(
                props.id,
                props.idType,
                props.tableData,
                props.setTableData
              )
            }
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export { DeleteButton };
