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
import { IDType, ApiEntry, ApiDB } from "./api_schema";
import { Delete } from "@mui/icons-material";
import { MRT_ColumnFiltersState } from "material-react-table";
import { fetchDB } from "./api_call";

const VITE_API_URL = process.env.VITE_API_URL;

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
    tableData: ApiDB,
    columnFilters: MRT_ColumnFiltersState,
    setTableData: React.Dispatch<React.SetStateAction<ApiDB>>,
    setConnectionError: React.Dispatch<React.SetStateAction<boolean>>,
  ) {
    console.log("Delete " + id);

    const e: ApiEntry = {
      abstract: "",
      authors: [],
      id: id,
      url: "",
      idType: idType,
      title: "",
      text: undefined,
      path: "",
      tags: [],
      comments: "",
      year: 0,
      publisher: "",
    };
    const response = await fetch(VITE_API_URL + "/api/delete_entry", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(e),
    }).catch((error) => {
      console.log(error);
      setConnectionError(true);
    });
    console.log("response of update_entry:", response);

    fetchDB(columnFilters, setTableData, setConnectionError);

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
                props.columnFilters,
                props.setTableData,
                props.setConnectionError,
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
