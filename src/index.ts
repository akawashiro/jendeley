import {Command} from 'commander';
const program = new Command();
const fs = require("fs");
const path = require("path");

async function* walk(dir: string) {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}

async function main() {
    program
        .requiredOption('--papers_dir <dir>', "Root directory of your papers")

    program.parse();

    const options = program.opts();

    if (fs.existsSync(options.papers_dir)) {
        for await (const p of walk(options.papers_dir))
            console.log(p)
        process.exit(0);
    } else {
        console.log(options.papers_dir + " is not exist.");
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
