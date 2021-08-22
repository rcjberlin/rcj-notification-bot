const fs = require("fs");

async function writeFile(filepath, content) {
  return new Promise(async function (resolve, reject) {
    fs.writeFile(filepath, content, "utf8", function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function readFile(filepath) {
  return new Promise(async function (resolve, reject) {
    fs.readFile(filepath, "utf8", function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = {
  writeFile,
  readFile,
};
