const fetch = require("node-fetch");

/**
 * Sends a request
 * @param {string} method Method (GET, POST, PUT, DELETE)
 * @param {string} url URL
 * @param {Object} headers Optional: Headers
 * @param {Object} body Optinal: Body
 * @returns {Promise} Promise that resolves to an object including status and either json or body
 */
module.exports = async function (method, url, headers=undefined, body=undefined) {
  const result = {};
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers ? headers : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    result.status = response.status;
    try {
      const clone = response.clone();
      result.json = await clone.json();
    } catch {
      result.body = await response.text();
    }
    return result;
  } catch {
    return {};
  }
};
