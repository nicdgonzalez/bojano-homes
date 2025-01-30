use std::fmt;

#[derive(Debug)]
pub enum Scope {
    SpreadsheetsReadOnly,
}

impl fmt::Display for Scope {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        static BASE_URL: &'static str = "https://www.googleapis.com/auth";

        match self {
            Self::SpreadsheetsReadOnly => write!(f, "{BASE_URL}/{}", "spreadsheets.readonly"),
        }
    }
}
