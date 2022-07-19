'use strict';

require('dotenv')
	.config({ path: 'conf/.env' });
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('lllog')();
const colors = require('colors');

const handleRequest = require('./request-handler');

const openApiMockSymbol = Symbol('openApiMock');

class Server {

	constructor() {
		this.servers = [];
		this.paths = [];
	}

	setServers(servers) {
		this.servers = servers;
		return this;
	}

	setPort(port) {
		this.port = port;
		return this;
	}

	setPaths(paths) {
		this.paths = paths;
		return this;
	}

	async init() {

		if (this.server)
			await this.shutdown();


		const app = express();
		app.use('*', (req, res, next) => {

			res[openApiMockSymbol] = {
				initTime: Date.now()
			};

			logger.debug(`${colors.yellow('>')} [${req.method}] ${req.originalUrl}`);

			next();
		});

		app.use(
			cookieParser(),
			cors({
				origin: true,
				credentials: true
			}),
			bodyParser.json({ limit: 5242880 }),
			bodyParser.urlencoded({
				limit: '50mb',
				extended: false,
				parameterLimit: 5242880
			}),
			bodyParser.text(),
			bodyParser.raw()
		);

		this._loadBasePaths();

		this.setRoutes(app);

		app.all('*', this._notFoundHandler.bind(this));

		this.startServer(app);
	}

	setRoutes(app) {
		this.paths = this.paths.sort(
			// {}와 같은 path value는 우선순위는 뒤로 미룬다.
			(a, b) => {
				// Use toUpperCase() to ignore character casing
				let comparison = 0;
				if (/\/{[A-z0-9_-]+}/.exec(a.uri))
					comparison = 1;

				else if (/\/{[A-z0-9_-]+}/.exec(b.uri))
					comparison = -1;

				return comparison;
			}
		);

		this.paths.map(path => this.setRoute(app, path));
	}

	setRoute(app, path) {
		logger.debug(`Processing schema path ${path.httpMethod.toUpperCase()} ${path.uri}`);

		const expressHttpMethod = path.httpMethod.toLowerCase();

		const uris = this._normalizeExpressPath(path.uri);

		app[expressHttpMethod](uris, handleRequest(this, path));

		return uris.map(uri => {
			return logger.info(`Handling route ${path.httpMethod.toUpperCase()} ${uri}`);
		});
	}

	startServer(app) {
		this.server = app.listen(this.port);
		this.server.on('listening', err => {
			if (err)
				throw err;

			const realPort = this.server.address().port;

			logger.info(`Mocking API at ${realPort}`);
		});
	}

	shutdown() {
		logger.debug('Closing express server...');
		this.server.close();
	}

	_loadBasePaths() {
		const basePaths = [...new Set(this.servers.map(({ url }) => url.pathname.replace(/\/+$/, '')))];

		if (basePaths.length)
			logger.debug(`Found the following base paths: ${basePaths.join(', ')}`);


		this.basePaths = basePaths.length ? basePaths : [''];
	}

	_checkContentType(req) {
		const contentType = req.header('content-type');
		if (!contentType)
			logger.debug(`${colors.yellow('*')} Missing content-type header`);

	}

	_notFoundHandler(req, res) {
		return this.sendResponse(res, {
			rsp_msg: `Path not found: ${req.originalUrl}`,
			rsp_code: '40401'
		}, 404);
	}

	_normalizeExpressPath(schemaUri) {
		const normalizedPath = schemaUri.replace(/\{([a-z0-9_]+)\}/gi, ':$1')
			.replace(/^\/*/, '/');

		return this.basePaths.map(basePath => `${basePath}${normalizedPath}`);
	}

	sendResponse(res, body, statusCode, headers) {

		statusCode = statusCode || 200;
		headers = headers || {};

		const responseTime = Date.now() - res[openApiMockSymbol].initTime;

		const color = statusCode < 400 ? colors.green : colors.red;

		logger.debug(`${color('<')} [${statusCode}] ${JSON.stringify(body)} (${responseTime} ms)`);

		res
			.status(statusCode)
			.set(headers)
			.set('x-powered-by', 'apim-mock')
			.json(body);
	}

	getNextPage(trans_cnt, page, limit) {
		let lastPage = (trans_cnt / limit) + 1;
		lastPage = Math.ceil(lastPage);

		page *= 1;
		trans_cnt *= 1;

		if (lastPage <= page + 1)
			return undefined;
		if (trans_cnt < limit * (page - 1))
			return lastPage + '';
		return ++page + '';
	}

	parseStringYYYYMM(str) {
		const y = str.substr(0, 4);
		const m = str.substr(4, 2);
		return new Date(y, m - 1);
	}

	parseStringYYYYMMDD(str) {
		if (str.length === 6)
			return this.parseStringYYYYMM(str);

		const y = str.substr(0, 4);
		const m = str.substr(4, 2);
		const d = str.substr(6, 2);
		return new Date(y, m - 1, d);
	}

	parseStringYYYYMMDDHHMMSS(str) {
		return new Date(str.replace(
			/^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/,
			'$4:$5:$6 $2/$3/$1'
		));
	}

	//(86400000 * 7)
	//1000 * 60 * 60 * 24 * day
	checkDateRange(startDate, endDate, time) {
		// Check the date range, 86400000 is the number of milliseconds in one day
		var newDateObj = new Date(startDate.getTime() + time);
		var difference = newDateObj - endDate;

		if (difference < 0 || endDate - startDate < 0) {
			throw new DateRangeException();
		}
		if (difference <= 1) {
			return false;
		}
		return true;
	}

	checkDateType(str) {
		if (!str)
			return;

		Date.prototype.yyyymmdd = function () {
			const mm = this.getMonth() + 1; // getMonth() is zero-based
			const dd = this.getDate();

			return [this.getFullYear(),
			(mm > 9 ? '' : '0') + mm,
			(dd > 9 ? '' : '0') + dd
			].join('');
		};

		const regex = RegExp(/^\d{4}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])$/);
		const date = this.parseStringYYYYMMDD(str);
		const str1 = date.yyyymmdd();

		if (!regex.test(str) || str1 != str)
			throw new DateFormatException(str);
	}

	getDate(req, path) {
		let startDate;
		let endDate;

		const xApiType = req.header('x-api-type');
		const fromDate = (req.method === 'GET') ? req.query.from_date : req.body.from_date;
		const toDate = (req.method === 'GET') ? req.query.to_date : req.body.to_date;
		const chargeMonth = (req.method === 'GET') ? req.query.charge_month : req.body.charge_month;
		const fromDateMonth = (req.method === 'GET') ? req.query.from_month : req.body.from_month;
		const toDateMonth = (req.method === 'GET') ? req.query.to_month : req.body.to_month;

		this.checkDateType(fromDate);
		this.checkDateType(toDate);

		if (chargeMonth) {
			const date = this.parseStringYYYYMM(chargeMonth);
			startDate = new Date(date.getFullYear(), date.getMonth(), 1);
			endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		}
		else if (fromDateMonth && toDateMonth) {
			startDate = this.parseStringYYYYMM(fromDateMonth);
			const date = this.parseStringYYYYMM(toDateMonth);
			endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

			if (xApiType === 'scheduled')
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 90);
			else if (xApiType === 'user-consent' || xApiType === 'user-refresh')
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 365);
			else if (xApiType === 'user-search')
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 365 * 5);
		}
		else if (fromDate && toDate) {
			startDate = this.parseStringYYYYMMDD(fromDate);
			endDate = this.parseStringYYYYMMDD(toDate);

			if (toDate.length === 6)
				endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

			if (xApiType === 'scheduled' && path.uri.includes('transactions'))
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 90);
			else if (xApiType === 'scheduled')
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 31);
			else if (xApiType === 'user-consent' || xApiType === 'user-refresh')
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 365);
			else if (xApiType === 'user-search')
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 365 * 5);
			else
				this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 31);
		}
		else if (req.query.from_month && req.query.to_month) {
			startDate = this.parseStringYYYYMM(req.query.from_month);
			const date = this.parseStringYYYYMM(req.query.to_month);
			endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

			this.checkDateRange(startDate, endDate, 1000 * 60 * 60 * 24 * 90);
		}

		return {
			startDate,
			endDate
		};
	}

	sortAndFilter(data, listName, startDate, endDate, limit) {
		const parent = this;

		// 1. 정렬
		if (data.trans_list && data.trans_cnt && !limit) {
			//2. date 검색
			data.trans_list = data.trans_list.filter(function (a) {
				var hitDates = parent.parseStringYYYYMM(a.trans_month);
				return hitDates >= startDate && hitDates <= endDate
			});
			data.trans_cnt = data.trans_list.length + '';
		}
		else if (data.trans_cnt) {
			data.trans_list.sort(function (a, b) {
				return parseFloat(b.trans_dtime) - parseFloat(a.trans_dtime);
			});
			// 2. date 검색
			data.trans_list = data.trans_list.filter(function (a) {
				var notFoundKey = true;
				var hitDates;
				if (a.trans_dtime)
					hitDates = parent.parseStringYYYYMMDD(a.trans_dtime);
				else if (a.trans_date)
					hitDates = parent.parseStringYYYYMMDD(a.trans_date);
				else
					return notFoundKey;
				return hitDates >= startDate && hitDates <= endDate;
			});
		}
		else if (data.bill_cnt) {
			// 1. 정렬
			data.bill_list.sort(function (a, b) {
				return parseFloat(b.paid_out_date) - parseFloat(a.paid_out_date);
			});
			// 2. date 검색
			data.bill_list = data.bill_list.filter(function (a) {
				var hitDates = parent.parseStringYYYYMMDD(a.paid_out_date);
				return hitDates >= startDate && hitDates <= endDate
			});
		}
		else if (data.bill_detail_cnt) {
			// 1. 정렬
			data.bill_detail_list.sort(function (a, b) {
				return parseFloat(b.paid_dtime) - parseFloat(a.paid_dtime);
			});
			// 2. date 검색
			data.bill_detail_list = data.bill_detail_list.filter(function (a) {
				var hitDates = parent.parseStringYYYYMMDD(a.paid_dtime);
				return hitDates >= startDate && hitDates <= endDate
			});
		}
		else if (data.account_cnt) {
			// 1. 정렬
			data.account_list.sort(function (a, b) {
				if (a.account_type != b.account_type)
					return parseFloat(a.account_type) - parseFloat(b.account_type);
				return parseFloat(a.account_num) - parseFloat(b.account_num);
			});
		}
		else if (data.approved_cnt) {
			// 1. 정렬
			data.approved_list.sort(function (a, b) {
				return parseFloat(b.approved_dtime) - parseFloat(a.approved_dtime);
			});
			// 2. date 검색
			data.approved_list = data.approved_list.filter(function (a) {
				var approved_dtime = parent.parseStringYYYYMMDD(a.approved_dtime);
				var isApproved = approved_dtime >= startDate && approved_dtime <= endDate;
				if (!a.trans_dtime)
					return isApproved;

				var trans_dtime = parent.parseStringYYYYMMDD(a.trans_dtime);
				var isTrans = trans_dtime >= startDate && trans_dtime <= endDate;
				return isApproved || isTrans;
			});
		}
		else if (listName) {
			// 1. 정렬
			data[listName].sort((a, b) => {
				if (a.type !== b.type)
					return parseFloat(a.type) - parseFloat(b.type);
				return parseFloat(a.type) - parseFloat(b.type);
			});
		}
	}

	getListAndCountName(data) {
		let { cntName, listName } = ['', ''];
		for (var i in data) {
			var key = i;

			if (key.includes('_cnt'))
				cntName = key;
			else if (key.includes('_list'))
				listName = key;
		}
		return {
			cntName,
			listName
		};
	}

	paginate(data, listName, cntName, page, nextPage) {
		// 3. 페이징
		let list = data[listName];
		const totalCount = list.length;
		list = list.slice(page, nextPage);

		const count = list.length;

		if (totalCount > count + page)
			data.next_page = nextPage + '';
		else if (data.next_page)
			delete data.next_page;
		data[listName] = list;
		data[cntName] = count + '';
	}
}


class DateFormatException extends Error {
	constructor(message) {
		super(message);
		this.name = 'DateFormatException';
		this.message = '[' + this.message + '] does not conform to the expected format for a date format';
	}
}

class DateRangeException extends Error {
	constructor() {
		super();
		this.name = 'DateRangeException';
		this.message = 'Does not conform to the expected range for a date range';
	}
}

module.exports = Server;
