import { readFileSync } from "fs";

const html = readFileSync("/home/ubuntu/alaska-page.html", "utf-8");

console.log("Testing SvelteKit regex...\n");

// Test 1: Find the sveltekit line
const svelteKitLine = html.match(/__sveltekit_[^.]*\.resolve\(\(function\(a\)\{([^}]+)\}\)\);/);
console.log("Match 1 (original regex):", svelteKitLine ? "Found" : "Not found");

// Test 2: More permissive regex
const svelteKitLine2 = html.match(/__sveltekit_\w+\.resolve\(/);
console.log("Match 2 (permissive):", svelteKitLine2 ? "Found" : "Not found");

// Test 3: Extract the entire function
const svelteKitLine3 = html.match(/__sveltekit_\w+\.resolve\(\(function\(a\)\{([\s\S]{1,50000}?)\}\)\);/);
console.log("Match 3 (with \\s\\S):", svelteKitLine3 ? `Found (${svelteKitLine3[1].length} chars)` : "Not found");

if (svelteKitLine3) {
  const dataStr = svelteKitLine3[1];
  console.log("\nFirst 500 chars of data:");
  console.log(dataStr.substring(0, 500));
  
  // Test parsing individual entries
  const dataMatches = [...dataStr.matchAll(/a\[\d+\]=\{date:"([^"]+)",price:([\d.]+|null),awardPoints:(\d+|null)/g)];
  console.log(`\nFound ${dataMatches.length} price entries`);
  
  if (dataMatches.length > 0) {
    console.log("\nFirst 3 entries:");
    dataMatches.slice(0, 3).forEach(m => {
      console.log(`  Date: ${m[1]}, Price: $${m[2]}, Miles: ${m[3]}`);
    });
  }
}

process.exit(0);
