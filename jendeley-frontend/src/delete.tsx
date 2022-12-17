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
import { Entry } from "./schema";
import { Delete } from "@mui/icons-material";

function DeleteButton(props: any) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function deleteRow(id: string, tableData: any, setTableData: any) {
    console.log("Delete " + id);

    const e: Entry = {
      abstract: "",
      authors: [],
      id: id,
      title: "",
      path: "",
      tags: [],
      comments: "",
      year: 0,
      publisher: "",
    };
    const response = await fetch("http://localhost:5000/api/delete_entry", {
      method: "DELETE",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(e),
    });
    console.log("response of update_entry:", response);

    fetch("http://localhost:5000/api/get_db")
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
              deleteRow(props.id, props.tableData, props.setTableData)
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
