const fs = require('fs');
const https = require('https');

const screens = [
  { name: 'home', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTgwYTJjNDUwOTI1YzJmNjVmMDcwYzU1EgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
  { name: 'shop', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTdhZjY4YzIwMmQzYzZlZWYyMGM5ODQ5EgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
  { name: 'product', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTdjMDhkNWYwMWE2MmQzNjY1MzgzZmIxEgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
  { name: 'cart', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTdhMThhYjQwNDczNTZlZDQ5MDAyMDdkEgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
  { name: 'checkout', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTdmYjUwYTIwNDczNTZlZDQ5MDAyMDdkEgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
  { name: 'contact', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTc5MzBhZDkwNzc5YmIxYWMzMWVmZDAwEgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
  { name: 'account', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDU4MTdjYTY3M2UwN2M0Y2E4YTcwMWNhNTEzEgsSBxCXxtiA1BwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDExNjk0NTIxNjc2NDAyMzk4Ng&filename=&opi=89354086' },
];

fs.mkdirSync('stitch_screens', { recursive: true });

screens.forEach(screen => {
  https.get(screen.url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(`stitch_screens/${screen.name}.html`, data);
      console.log(`Saved ${screen.name}.html`);
    });
  }).on('error', err => {
    console.error(`Error downloading ${screen.name}:`, err.message);
  });
});
