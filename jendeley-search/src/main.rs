extern crate getopts;
use getopts::Options;
use serde_json::{Result, Value};
use std::fs;
use std::{env, process};
use pdf_extract::extract_text_from_mem;

#[derive(Debug)]
struct Args {
    db: String,
}

fn print_usage(program: &str, opts: &Options) {
    let brief = format!("Usage: {} FILE [options]", program);
    print!("{}", opts.usage(&brief));
    process::exit(0);
}

fn parse_args() -> Args {
    let args: Vec<String> = env::args().collect();
    let program = args[0].clone();

    let mut opts = Options::new();
    opts.optopt("d", "db", "Set path to the DB", "PATH_TO_THE_DB");
    opts.optflag("h", "help", "print this help menu");

    let matches = match opts.parse(&args[1..]) {
        Ok(m) => m,
        Err(f) => {
            panic!("{}", f.to_string())
        }
    };

    if matches.opt_present("h") {
        print_usage(&program, &opts);
    }

    let db = matches.opt_str("d");
    if let Some(d) = db {
        Args { db: d }
    } else {
        print_usage(&program, &opts);
        unreachable!("PATH_TO_THE_DB is required");
    }
}

fn main() {
    let args = parse_args();
    println!("{:?}", args);
    println!("{:?}", args.db);

    let contents = fs::read_to_string(args.db).expect("Should have been able to read the file");
    let v: Value = serde_json::from_str(&contents).unwrap();
    v.as_object().unwrap().iter().for_each(|(k, v)| {
        let id_type = &v["idType"];
        println!("{}", k);
        println!("{}", id_type);
        if id_type == "arxiv" {
            let path_v = &v["path"];
            println!("{}", path_v);
            let path_a = path_v.as_array().unwrap();
            let mut path = "/home/akira/jendeley/jendeley-backend/test_pdfs/".to_string();
            for v in path_a {
                path.push_str(v.as_str().unwrap());
                println!("{}", v);
            }

            let bytes = std::fs::read(path).unwrap();
            let out = pdf_extract::extract_text_from_mem(&bytes).unwrap();
            println!("{}", out);
        }
    });
}
