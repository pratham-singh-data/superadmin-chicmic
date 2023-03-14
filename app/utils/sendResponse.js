/** Sends the server response with given status code
 * @param {Response} res Express response object
 * @param {Object} data data to send in response
 */
function sendResponse(res, data) {
    res.status(data.statusCode);
    res.json(data);
};

module.exports = {
    sendResponse,
};

