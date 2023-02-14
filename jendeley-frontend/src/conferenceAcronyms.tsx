import { Box } from "@mui/material";
import Chip from "@mui/material/Chip";
import { getColorFromString } from "./stringUtils";

function getAcronyms(conference: string): string {
  {
    const regexp = new RegExp("(PLDI '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "PLDI" + d.substring(6, 8);
    }
  }

  {
    const regexp = new RegExp("(ISMM '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "ISMM" + d.substring(6, 8);
    }
  }

  {
    const regexp = new RegExp("(HASP '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "HASP" + d.substring(6, 8);
    }
  }

  {
    const regexp = new RegExp("(CPP '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "CPP" + d.substring(5, 7);
    }
  }

  {
    const regexp = new RegExp("(ASPLOS '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "ASPLOS" + d.substring(8, 10);
    }
  }

  {
    const regexpPLDI = new RegExp("(PLDI[0-9][0-9])", "g");
    const foundPLDI = [...conference.matchAll(regexpPLDI)];
    for (const f of foundPLDI) {
      const d = f[0] as string;
      return "PLDI" + d.substring(4, 6);
    }
  }

  {
    const regexp = new RegExp("(POPL '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "POPL" + d.substring(6, 8);
    }
  }

  {
    const regexp = new RegExp("(EuroSys '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "EuroSys" + d.substring(9, 11);
    }
  }

  {
    const regexp = new RegExp("([0-9][0-9][0-9][0-9] INTERACT)", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "INTERACT" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] IEEE Conference on Computer Vision and Pattern Recognition)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "CVPR" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] IEEE/ACM International Symposium on Code Generation and Optimization)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "CGO" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] IEEE/CVF International Conference on Computer Vision)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "ICCV" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] .*Annual IEEE Symposium on Logic in Computer Science)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "LICS" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] .*International Conference on Software Engineering)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "ICSE" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] IEEE/RSJ International Conference on Intelligent Robots and Systems)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "IROS" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp(
      "([0-9][0-9][0-9][0-9] IEEE/CVF Conference on Computer Vision and Pattern Recognition)",
      "g"
    );
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "CVPR" + d.substring(2, 4);
    }
  }

  {
    const regexp = new RegExp("(SC '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "SC" + d.substring(4, 6);
    }
  }

  {
    const regexp = new RegExp("(CC '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "CC" + d.substring(4, 6);
    }
  }

  {
    const regexp = new RegExp("(SOSP '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "SOSP" + d.substring(6, 8);
    }
  }

  {
    const regexp = new RegExp("(PEPM[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "PEPM" + d.substring(4, 6);
    }
  }

  {
    const regexp = new RegExp("(TLDI[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return d.substring(0, 6);
    }
  }

  {
    const regexp = new RegExp("(ICPP [0-9][0-9][0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "ICPP" + d.substring(7, 9);
    }
  }

  {
    const regexp = new RegExp("(SPLASH '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "SPLASH" + d.substring(8, 10);
    }
  }

  {
    const regexp = new RegExp("(CGO '[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "CGO" + d.substring(5, 7);
    }
  }

  {
    const regexp = new RegExp("(ICFP'[0-9][0-9])", "g");
    const found = [...conference.matchAll(regexp)];
    for (const f of found) {
      const d = f[0] as string;
      return "ICFP" + d.substring(5, 7);
    }
  }

  return conference;
}

function ConferenceAcronyms(conference: string | undefined) {
  if (conference === "" || conference === undefined) {
    return conference;
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
