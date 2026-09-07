import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://tim5:passwordtim5@localhost:5432/postgres",
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT datname FROM pg_database;");
  console.log("Databases:", res.rows.map(r => r.datname));
  await client.end();
}

main().catch(console.error);
