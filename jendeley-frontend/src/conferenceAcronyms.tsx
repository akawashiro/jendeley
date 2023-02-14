import { Box } from "@mui/material";
import Chip from "@mui/material/Chip";
import {getColorFromString} from "./stringUtils";

function getAcronyms(conference: string) : string {
    return conference
}

function ConferenceAcronyms(conference: string) {
  if (conference == "") {
    return "";
  }

  const c = getAcronyms(conference);
  return (
    <Box>
      <Chip
        label={`${c}`}
        size="small"
        onClick={() => {
          navigator.clipboard.writeText(c);
        }}
        sx={{
          color: getColorFromString(c).color,
          bgcolor: getColorFromString(c).bgcolor,
          m: 0.1,
        }}
      />
    </Box>
  );
}

export { getAcronyms, ConferenceAcronyms };
