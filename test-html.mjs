import axios from "axios";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";

const ALASKA_URL =
  "https://www.alaskaair.com/search/calendar?O=SA2&D=TPE&OD=2026-02-01&A=1&RT=false&RequestType=Calendar&int=flightresultsmicrosite%3Aviewby-calendar&locale=en-us&ShoppingMethod=onlineaward&FareType=Partner+Business&CM=2026-02&DD=2026-02-01";

console.log("Fetching Alaska Airlines page...");

const response = await axios.get(ALASKA_URL, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  },
  timeout: 30000,
});

console.log("Response status:", response.status);
console.log("Response length:", response.data.length);

// Save HTML to file
writeFileSync("/home/ubuntu/alaska-page.html", response.data);
console.log("Saved HTML to /home/ubuntu/alaska-page.html");

// Parse with cheerio
const $ = cheerio.load(response.data);

// Check for buttons
const buttons = $('button[role="gridcell"]');
console.log(`Found ${buttons.length} gridcell buttons`);

// Check for any buttons with aria-label
const buttonsWithLabel = $('button[aria-label*="Feb"]');
console.log(`Found ${buttonsWithLabel.length} buttons with Feb in aria-label`);

// Check for any text containing "175k"
const textWith175k = $('*:contains("175k")');
console.log(`Found ${textWith175k.length} elements containing "175k"`);

// Look for calendar container
const calendar = $('[role="grid"]');
console.log(`Found ${calendar.length} grid elements`);

process.exit(0);
