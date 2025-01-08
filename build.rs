use std::{path, process};

fn main() {
    let frontend_dir = path::Path::new("frontend");

    if !frontend_dir.join("node_modules").exists() {
        install_frontend_dependencies();
    }

    println!("cargo::rerun-if-changed=frontend");
    build_tailwindcss();
    build_frontend();
}

fn install_frontend_dependencies() {
    let status = process::Command::new("npm")
        .arg("install")
        .current_dir("./frontend")
        .status()
        .expect("failed to install frontend dependencies");

    match status.code() {
        Some(code) if code != 0 => {
            panic!("failed to install frontend dependencies (exit code: {code})")
        }
        None => panic!("failed to install frontend dependencies: process terminated via signal"),
        _ => (),
    };
}

fn build_tailwindcss() {
    let status = process::Command::new("npx")
        .args([
            "tailwindcss",
            "--config",
            "./frontend/tailwind.config.js",
            "--input",
            "./frontend/src/index.css",
            "--output",
            "./public/tailwind.css",
            "--minify",
        ])
        .status()
        .expect("failed to build tailwindcss");

    match status.code() {
        Some(code) if code != 0 => panic!("failed to build tailwindcss (exit code: {code})"),
        None => panic!("failed to build tailwindcss: process terminated via signal"),
        _ => (),
    };
}

fn build_frontend() {
    let status = process::Command::new("npx")
        .args(["vite", "build", "./frontend"])
        .status()
        .expect("failed to build frontend");

    match status.code() {
        Some(code) if code != 0 => panic!("failed to build frontend (exit code: {code})"),
        None => panic!("failed to build frontend: process terminated via signal"),
        _ => (),
    };
}
