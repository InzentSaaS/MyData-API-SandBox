'use strict';

/* istanbul ignore file */

const parsePreferHeader = require('parse-prefer-header');
const memoize = require('micro-memoize');
const logger = require('lllog')();
const db = require('./postgre-database.js');
const FAKE = process.env.ONLY_FAKE;

// Create a function that is memoized using the URL, query, the Prefer header and the body.
// eslint-disable-next-line no-unused-vars
const getResponse = (path, url, query, preferHeader, body) => {
	const { example: preferredExampleName, statuscode: preferredStatusCode } = parsePreferHeader(preferHeader) || {};

	if (preferredStatusCode)
		logger.debug(`Searching requested response with status code ${preferredStatusCode}`);
	else
		logger.debug('Searching first response');
	return path.getResponse(preferredStatusCode, preferredExampleName);
};

const getResponseMemo = memoize(getResponse, {
	maxSize: 10
});

const handleRequest = (parent, path) => (req, res) => {
	parent._checkContentType(req);

	const {
		query,
		params,
		headers,
		cookies,
		body: requestBody
	} = req;

	const failedValidations = path.validateRequestParameters({
		query,
		path: params,
		headers,
		cookies,
		requestBody
	});

	const xApiTranId = req.header('x-api-tran-id');

	if (failedValidations.length)
		return parent.sendResponse(res, { rsp_code: '40001', rsp_msg: failedValidations.join(", ") }, 400, { 'x-api-tran-id': xApiTranId });

	if (req.header('x-fake') === 'true' || FAKE === 'true')
		return handleRequestFake(parent, path, req, res);

	return handleRequestDB(parent, path, req, res);
};

const handleRequestFake = (parent, path, req, res) => {
	const preferHeader = req.header('prefer') || '';
	const { statusCode, headers: responseHeaders, body } =
		getResponseMemo(path, req.path, JSON.stringify(req.query), preferHeader, JSON.stringify(req.body));

	return parent.sendResponse(res, body, statusCode, responseHeaders);
}

const handleRequestDB = (parent, path, req, res) => {
	const preferHeader = req.header('prefer') || '';
	const {
		example: preferredExampleName,
		statusCode: preferredStatusCode
	} = parsePreferHeader(preferHeader) || {};

	if (preferredStatusCode)
		logger.debug(`Searching requested response with status code ${preferredStatusCode}`);
	else
		logger.debug('Searching first response');


	let { statusCode, headers: responseHeaders, body } = path.getResponse(preferredStatusCode, preferredExampleName);
	logger.debug('statusCode : ' + JSON.stringify(statusCode));
	logger.debug('headers : ' + JSON.stringify(responseHeaders));
	logger.debug('body : ' + JSON.stringify(body));

	// 금보원 요구사항으로 데이터가 오면 바로 포워딩을 하도록 변경
	const xApiTranId = req.header('x-api-tran-id');
	if (xApiTranId)
		responseHeaders = { 'x-api-tran-id': xApiTranId } || responseHeaders;

	(async () => {
		let client;
		try {
			const { startDate, endDate } = parent.getDate(req, path);

			client = await db.pool.connect();
			const q = db.getQuery(req, path);

			// 자산이 존재하지 않을 때
			if (q === undefined) {
				const data = { rsp_code: '40402', rsp_msg: '요청한 자산에 대한 정보는 존재하지 않음.', 'x-api-tran-id': xApiTranId };
				return parent.sendResponse(res, data, 404, responseHeaders);
			}

			const result = await client.query(q);

			// 데이터가 존재하지 않을 때
			if (result.rowCount === 0) {
				const preferHeader = req.header('prefer') || '';
				let { headers: responseHeaders, body } =
					getResponseMemo(path, req.path, JSON.stringify(req.query), preferHeader, JSON.stringify(req.body));

				const { cnt, list } = parent.getListAndCountName(body);

				if (cnt && list) {
					const emptyBody = { rsp_code: '00000', rsp_msg: '정상', [cnt]: 0, [list]: [] };
					return parent.sendResponse(res, emptyBody, 200, responseHeaders);
				}
				return parent.sendResponse(res, { rsp_code: '40402', rsp_msg: '요청한 자산에 대한 정보는 존재하지 않음.' }, 404, responseHeaders);
			}

			// 데이터가 존재할 때
			const data = result.rows[0].res_data;
			logger.debug(data);

			const { cntName, listName } = parent.getListAndCountName(data);
			const limit = (req.method === 'GET') ? req.query.limit : req.body.limit;

			// 리스트가 존재하지 않거나 limit가 없다면 바로 리턴
			if (!listName)
				return parent.sendResponse(res, data, statusCode, responseHeaders);

			// 1. 정렬 및 필터링 sortAndFilter
			parent.sortAndFilter(data, listName, startDate, endDate, limit);

			// limit가 없다면 페이징을 하지 않기 때문에 바로 리턴
			if (!limit)
				return parent.sendResponse(res, data, statusCode, responseHeaders);

			// 2. 페이징 paginate
			let page = (req.method === 'GET') ? req.query.next_page : req.body.next_page;
			page = page ? page * 1 : 0;
			const nextPage = (limit * 1) + (page * 1);
			parent.paginate(data, listName, cntName, page, nextPage);

			return parent.sendResponse(res, data, statusCode, responseHeaders);
		} catch (err) {
			if (err.name === 'DateFormatException')
				return parent.sendResponse(res, { rsp_code: '40001', rsp_msg: err.message }, 400, responseHeaders);
			if (err.name === 'DateRangeException')
				return parent.sendResponse(res, { rsp_code: '40004', rsp_msg: err.message }, 400, responseHeaders);
			logger.error(err.stack);
		}
		finally {
			// Make sure to release the client before any error handling,
			// just in case the error handling itself throws an error.
			if (client)
				client.release();
		}
	})().catch(err => {
		const data = { rsp_code: '50001', rsp_msg: '시스템 장애가 발생했습니다. 담당자에게 연락 부탁드립니다.' };
		logger.error('----------');
		logger.error('method:' + req.method);
		logger.error('query: ' + JSON.stringify(req.query));
		logger.error('body:' + JSON.stringify(req.body));
		logger.error('headers:' + JSON.stringify(req.headers));
		logger.error('originalUrl: ' + req.originalUrl);
		logger.error(err.stack);
		logger.error('----------');
		return parent.sendResponse(res, data, 500, responseHeaders);
	});
}
module.exports = handleRequest;