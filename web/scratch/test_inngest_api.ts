

async function main() {
  const url = process.argv[2] || 'http://127.0.0.1:3000/api/inngest';
  console.log(`Checking ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body: ${text.slice(0, 500)}`);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
}

main();
