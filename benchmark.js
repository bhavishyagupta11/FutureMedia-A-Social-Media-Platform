const axios = require("axios");

const BENCHMARK_URL = "http://localhost:5000/api/v1/auth/login";
const CONCURRENCY = 100;
const REQUESTS = 1000;

async function runBenchmark() {
  console.log(`Starting benchmark: ${REQUESTS} requests at concurrency ${CONCURRENCY}`);
  
  let completed = 0;
  let failed = 0;
  let latencies = [];

  const payload = { username: "benchmark_user", password: "Password123!" };

  const startAll = Date.now();

  const worker = async () => {
    while (completed + failed < REQUESTS) {
      const start = Date.now();
      try {
        await axios.post(BENCHMARK_URL, payload);
        latencies.push(Date.now() - start);
        completed++;
      } catch (err) {
        // We expect 400 or 401 if user doesn't exist, that still measures API latency
        latencies.push(Date.now() - start);
        failed++;
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }).map(worker);
  await Promise.all(workers);

  const duration = Date.now() - startAll;
  latencies.sort((a, b) => a - b);
  
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p90 = latencies[Math.floor(latencies.length * 0.9)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  
  console.log("\n--- BENCHMARK RESULTS ---");
  console.log(`Total Requests: ${REQUESTS}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`RPS: ${(REQUESTS / (duration / 1000)).toFixed(2)} req/sec`);
  console.log(`Average Latency: ${avg.toFixed(2)}ms`);
  console.log(`P50: ${p50}ms`);
  console.log(`P90: ${p90}ms`);
  console.log(`P95: ${p95}ms`);
  console.log(`P99: ${p99}ms`);
  console.log(`Failed/Rejected: ${failed}`);
}

runBenchmark().catch(console.error);
