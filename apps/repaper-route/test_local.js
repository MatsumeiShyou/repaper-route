import fetch from 'node-fetch'; // fetch is globally available in latest Node

async function test() {
  try {
    const res1 = await fetch('http://localhost:5174/repaper-route/');
    console.log('5174 Status Code:', res1.status);
  } catch (e) {
    console.error('5174 Error:', e.cause?.code || e.message);
  }

  try {
    const res2 = await fetch('http://localhost:5173/repaper-route/');
    console.log('5173 Proxy Status Code:', res2.status);
  } catch (e) {
    console.error('5173 Error:', e.cause?.code || e.message);
  }
}

test();
