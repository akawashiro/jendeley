import { MRT_ColumnFiltersState } from "material-react-table";
import { ApiDB } from "./api_schema";
import { genRequestGetDB } from "./requests";

function fetchDB(
  columnFilters: MRT_ColumnFiltersState,
  setTableData: React.Dispatch<React.SetStateAction<ApiDB>>,
  setConnectionError: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const request = genRequestGetDB(columnFilters);
  const VITE_API_URL = process.env.VITE_API_URL;

  fetch(VITE_API_URL + "/api/get_db", {
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
}

export { fetchDB };
