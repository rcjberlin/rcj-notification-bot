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

module.exports = {
  writeFile,
};
