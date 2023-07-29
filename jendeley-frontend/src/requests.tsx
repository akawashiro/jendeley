import { MRT_ColumnFiltersState } from "material-react-table";
import { RequestGetDB } from "./api_schema";

function getValueFromColumnFilters(
  columnFilters: MRT_ColumnFiltersState,
  id: string,
): string | undefined {
  let value: string | undefined = undefined;
  for (const filter of columnFilters) {
    if (filter.id === id) {
      if (typeof filter.value !== "string") {
        throw Error("filter.value is not a string");
      }
      value = filter.value;
      break;
    }
  }

  return value;
}

function genRequestGetDB(columnFilters: MRT_ColumnFiltersState) {
  const request: RequestGetDB = {
    title: getValueFromColumnFilters(columnFilters, "title"),
    authors: getValueFromColumnFilters(columnFilters, "authors"),
    tags: getValueFromColumnFilters(columnFilters, "tags"),
    comments: getValueFromColumnFilters(columnFilters, "comments"),
    year: getValueFromColumnFilters(columnFilters, "year"),
    publisher: getValueFromColumnFilters(columnFilters, "publisher"),
    text: getValueFromColumnFilters(columnFilters, "text"),
  };

  return request;
}

export { genRequestGetDB };
