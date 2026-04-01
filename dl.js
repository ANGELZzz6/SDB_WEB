const fs = require('fs');
const https = require('https');
const path = require('path');

const urls = {
  hero: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzEwMTdkZDNlYTQ5ZjQwNTE4ZTczNTFlZGU0YzM5ZDlkEgsSBxC6ope9swUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTI1NTQ0MjQzMzE4Mjk2OTgxOQ&filename=&opi=89354086",
  services: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2E4ZGEzYmY2NGZhZTQzNjNiODY4YmI0MDI3ODFhMDRiEgsSBxC6ope9swUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTI1NTQ0MjQzMzE4Mjk2OTgxOQ&filename=&opi=89354086",
  specialists: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2RhYmQ2Zjk3YWFlMzRlNWY5M2Y3M2E1YzMxMjYyOWMzEgsSBxC6ope9swUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTI1NTQ0MjQzMzE4Mjk2OTgxOQ&filename=&opi=89354086",
  gallery: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBkNzFjYzBjNDllZjQxZWNhYWM1MDE1ZDYxZTBmODk2EgsSBxC6ope9swUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTI1NTQ0MjQzMzE4Mjk2OTgxOQ&filename=&opi=89354086"
};

const dir = path.join(__dirname, 'tmp_screens');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

Object.entries(urls).forEach(([name, url]) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(path.join(dir, `${name}.html`), data);
      console.log(`Saved ${name}.html`);
    });
  }).on('error', err => console.log('Error: ', err.message));
});
