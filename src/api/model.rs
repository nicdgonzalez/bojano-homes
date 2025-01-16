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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Property {
    pub id: String,
    pub name: String,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub property_id: String,
    pub amount: f32,
    pub description: String,
    pub timestamp: String,
    pub receipt_link: String,
    pub merchant: String,
    pub buyers_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reservation {
    pub platform: String,
    pub payout_date: String,
    pub check_in: String,
    pub check_out: String,
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
