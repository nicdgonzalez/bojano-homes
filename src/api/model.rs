//! Defines the objects returned by the API.

use std::fmt;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpenseSheet {}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email_addresses: Vec<EmailAddress>,
    pub phone_numbers: Vec<PhoneNumber>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailAddress {
    pub email_address: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PhoneNumber {
    pub phone_numbers: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Property {
    pub id: String,
    pub name: String,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Expense {
    pub amount: f32,
    pub description: String,
    pub timestamp: chrono::NaiveDateTime,
    pub receipt_link: String,
    pub merchant: String,
    pub buyers_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Reservation {
    pub platform: String,
    pub payout_date: chrono::NaiveDateTime,
    pub check_in: chrono::NaiveDateTime,
    pub check_out: chrono::NaiveDateTime,
    pub revenue: f32,
    pub management_fee: f32,
    pub net_profit: f32,
}

#[derive(Debug)]
pub enum Month {
    January,
    February,
    March,
    April,
    May,
    June,
    July,
    August,
    September,
    October,
    November,
    December,
}

impl TryFrom<u8> for Month {
    type Error = &'static str;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        let month = match value {
            1 => Month::January,
            2 => Month::February,
            3 => Month::March,
            4 => Month::April,
            5 => Month::May,
            6 => Month::June,
            7 => Month::July,
            8 => Month::August,
            9 => Month::September,
            10 => Month::October,
            11 => Month::November,
            12 => Month::December,
            _ => return Err("expected value to be between 1 and 12"),
        };

        Ok(month)
    }
}

impl fmt::Display for Month {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::January => write!(f, "January"),
            Self::February => write!(f, "February"),
            Self::March => write!(f, "March"),
            Self::April => write!(f, "April"),
            Self::May => write!(f, "May"),
            Self::June => write!(f, "June"),
            Self::July => write!(f, "July"),
            Self::August => write!(f, "August"),
            Self::September => write!(f, "September"),
            Self::October => write!(f, "October"),
            Self::November => write!(f, "November"),
            Self::December => write!(f, "December"),
        }
    }
}
