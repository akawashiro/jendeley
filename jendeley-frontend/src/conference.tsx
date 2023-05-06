import { Box } from "@mui/material";
import Chip from "@mui/material/Chip";
import { getColorFromString } from "./stringUtils";

function ConferenceChip(conference: string | undefined) {
  if (conference === "" || conference === undefined) {
    return conference;
  }

  // const c = getAcronyms(conference);
  return (
    <Box>
      <Chip
        label={`${conference}`}
        title={`${conference}`}
        size="small"
        onClick={() => {
          navigator.clipboard.writeText(conference);
        }}
        sx={{
          color: getColorFromString(conference).color,
          bgcolor: getColorFromString(conference).bgcolor,
          m: 0.1,
        }}
      />
    </Box>
  );
}

export { ConferenceChip };
