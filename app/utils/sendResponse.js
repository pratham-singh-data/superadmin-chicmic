/** Sends the server response with given status code
 * @param {Response} res Express response object
 * @param {Object} data data to send in response
 */
function sendResponse(res, data) {
    res.status(data.statusCode);
    res.json(data);
};

/** Returns a semdResponse bound to given Response object
 * @param {Response} res Express response object]
 * @return {Function} a version of sendResponse bound to the given res
 */
function generateLocalSendResponse(res) {
    return sendResponse.bind(undefined, res);
};

module.exports = {
    generateLocalSendResponse,
};

