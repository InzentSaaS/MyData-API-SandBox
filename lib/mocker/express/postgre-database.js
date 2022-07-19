'use strict';

const postgre = {};
const logger = require('lllog')();
const parseUrl = require('parseurl');
const colors = require('sinon');
// Postgres Configuration
const { Pool } = require('pg');

// https://stackoverflow.com/questions/49697082/node-postgres-connection-terminated-unexpectedly
// nodejs 및 postgresql을 사용할 경우 idleTimeoutMillis값이 0이 아니면 서비스 도중 
// Connection terminated unexpectedly가 발생할 수 있어서 반드시 0으로 사용하도록 설정함.
const config = {
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	max: process.env.DB_CON_POOL_MAX,
	idleTimeoutMillis: 600000,
	connectionTimeoutMillis: 600000
};
postgre.pool = new Pool(config);

postgre.getPool = async function () {
	return new Pool(config);
};

postgre.pool.on('error', async (err, client) => {
	logger.debug(`${colors.red('>')} [Error] ${err}`);
	await client.release();
	process.exit(-1);
});

postgre.getQuery = function (req, path) {
	let sql;
	const sql1 = 'SELECT res_data FROM tb_test_data WHERE api_id = $1 and own_org_cd = $2 and org_cd = $3';
	const sql2 = 'SELECT res_data FROM tb_test_data WHERE api_id = $1 and own_org_cd = $2 and org_cd = $3 and ast_id = $4';
	
	//const sql3 = 'SELECT res_data FROM apx_consents WHERE api_id = $1 and user_ci = (select user_ci FROM tb_usr u WHERE u.meb_no = (SELECT creator_id FROM apx_app p, apx_oauth_token t WHERE p.id = //t.app_id  AND t.access_token = $2)) and org_cd = $3  and industry != \'0\' ';
	
	
	let   sql3 = 'SELECT DISTINCT case when (SELECT count(res_data) FROM apx_consents WHERE api_id = $1 ';
		  sql3 += 				     'and user_ci = (select distinct t.user_id FROM tb_usr u, apx_oauth_token t WHERE u.user_ci = t.user_id and t.user_id != \'\' AND t.access_token = $2) ';
		  sql3 += 					 'and org_cd = $3   ';
		  sql3 +=					 'and industry != \'0\'    ';
		  sql3 +=					 ') > 0 ';
	
		  sql3 +=		     ' then (SELECT res_data ';
		  sql3 +=	 		 '       FROM apx_consents ';
		  sql3 +=			 '       WHERE api_id = $1 ';
		  sql3 +=			 '       and user_ci = (select distinct t.user_id FROM tb_usr u, apx_oauth_token t WHERE u.user_ci = t.user_id and t.user_id != \'\' AND t.access_token = $2) ';
		  sql3 +=			 '       and org_cd = $3   ';
		  sql3 +=			 '       and industry != \'0\')  ';
			
			
		  sql3 +=            ' when (SELECT count(res_data) FROM apx_consents WHERE api_id = $1 ';
		  sql3 += 				     'and user_ci = (select distinct t.user_id FROM tb_usr u, apx_oauth_token t WHERE u.user_ci = t.user_id and t.user_id != \'\' AND t.access_token = $2) ';
		  sql3 += 					 'and org_cd = $3   ';
		  sql3 +=					 'and industry != \'0\'    ';
		  sql3 +=					 ') = 0  and  (SELECT count(res_data) ';
		  sql3 +=					 '             FROM apx_consents	';
		  sql3 +=		             '             WHERE api_id = $1	';
		  sql3 +=	                 '             AND user_ci = (select user_ci FROM tb_usr u WHERE u.meb_no=(SELECT creator_id FROM apx_app p, apx_oauth_token t WHERE p.id = t.app_id   '; 
		  sql3 +=					 '			   AND t.access_token = $2))  ';
		  
		  sql3 +=		             '             and org_cd = $3   ';  
		  sql3 +=		             '             and industry != \'0\'    ';   
		  sql3 +=		             '             ) > 0 ';	
	
		
		  sql3 +=			 ' then (	SELECT res_data ';
		  sql3 +=			 '			FROM apx_consents  ';
		  sql3 +=			 '			WHERE api_id = $1 ';
		  sql3 +=			 '			and user_ci = (select user_ci FROM tb_usr u WHERE u.meb_no=(SELECT creator_id FROM apx_app p, apx_oauth_token t WHERE p.id = t.app_id  AND t.access_token=$2))';  
		  sql3 +=			 '			and org_cd = $3   ';
		  sql3 +=			 '			and industry != \'0\'    ';
		  sql3 +=			 '		)';
		      
			  
			
		  sql3 +=            ' when (SELECT count(res_data) FROM apx_consents WHERE api_id = $1 ';
		  sql3 += 				     'and user_ci = (select distinct t.user_id FROM tb_usr u, apx_oauth_token t WHERE u.user_ci = t.user_id and t.user_id != \'\' AND t.access_token = $2) ';
		  sql3 += 					 'and org_cd = $3   ';
		  sql3 +=					 'and industry != \'0\'    ';
		  sql3 +=					 ') = 0  and  (SELECT count(res_data) ';
		  sql3 +=					 '             FROM apx_consents	';
		  sql3 +=		             '             WHERE api_id = $1	';
		  sql3 +=	                 '             AND user_ci = (select user_ci FROM tb_usr u WHERE u.meb_no=(SELECT creator_id FROM apx_app p, apx_oauth_token t WHERE p.id = t.app_id   '; 
		  sql3 +=					 '			   AND t.access_token = $2))  ';
		  
		  sql3 +=		             '             and org_cd = $3   ';  
		  sql3 +=		             '             and industry != \'0\'    ';   
		  sql3 +=		             '             ) = 0 ';	
	
		
		  sql3 +=	  		'  then (SELECT res_data FROM tb_test_data WHERE api_id = $1 and own_org_cd = $4 and org_cd = $3 ) ';	
			  
			  
		  sql3 +=			 ' else ( ';
		  sql3 +=			 ' 		 SELECT res_data';
		  sql3 +=			 ' 		 FROM apx_consents ';
		  sql3 +=			 ' 		 WHERE 1=2 ';
		  sql3 +=			 ' 		)';				

		  sql3 +=			' end as res_data  ';

		  sql3 +=  ' FROM apx_consents  ';
		  sql3 +=  ' WHERE api_id = $1 ';
		  sql3 +=  '   AND org_cd = $3 ';
		  sql3 +=  '   AND industry != \'0\'  ';
		
	

	const { pathname } = parseUrl(req);
	logger.debug('----------');
	logger.debug(req.method);
	logger.debug(req.query);
	logger.debug(req.body);
	logger.debug(req.headers);
	logger.debug(req.originalUrl);
	logger.debug(pathname);
	logger.debug('----------');

	const query = {};
	let r = {};
	const own_org_cd = req.header('x-own-org-cd');				//tb_test_data의 org_cd
	const utct_type = req.header('x-fsi-utct-type');
	
	
	const access_token = req.header('authorization');
	var access_token_1 = '';
	
	if(access_token){
		access_token_1 = access_token.substr(7, access_token.length);
		
		logger.debug('========================================');
		logger.debug('::utct_type=>'+utct_type);
		logger.debug('::access_token=>'+access_token_1);
		logger.debug('========================================');
	}
	
	const mem_no = req.header('x-fsi-mem-no');
	const fsi_bus_seq_no = req.header('x-fsi-bus-seq-no');		//tb_test_data의 own_org_cd 69
	
	const api_id = req.header('x-api-id');
	if (!api_id)
		logger.debug('Error : No such a api_id value.....');

	let org_cd = (req.method === 'GET') ? req.query.org_code : req.body.org_code;
	org_cd = org_cd ? org_cd : '0000000000';
	let ast_id = postgre.getAstId(req.method, req.query, req.body, pathname, path);
	//logger.debug("ast_id:" + ast_id);
	if (ast_id === '')
		return undefined;
	

	
	sql = ast_id === undefined ? sql1 : sql2;
	r = postgre.setParam(query, sql, api_id, own_org_cd, org_cd, ast_id);

	logger.debug(r);
	
	

	//전송요구동의(정보제공-공통-002) API 호출일 때
	if(utct_type === 'TGC00002' && (api_id == '6158' || api_id == '6159' || api_id == '6160' || api_id == '6162' || api_id == '6163' || api_id == '6165' || api_id == '6166' || api_id == '6173' || 
		api_id == '6179' || api_id == '6180' || api_id == '6181')) {	
		r = postgre.setParam2(query, sql3, api_id, access_token_1, org_cd, own_org_cd);		
		logger.debug(r);
	} 

	//전송요구동의(통테 각 업권별-001) API 호출일 때 
	if(utct_type === 'TGC00002' && (api_id == '6071' || api_id == '6092' || api_id == '6110' || api_id == '6111' || api_id == '6112' || api_id == '6113' || api_id == '6114' || api_id == '6116' || 
		api_id == '6117' || api_id == '6118' || api_id == '6119' || api_id == '6164')) {	
		r = postgre.setParam2(query, sql3, api_id, access_token_1, org_cd, own_org_cd);	
		logger.debug(r);
	}
	
	//전송요구동의(신규추가된 항목 case일 때) API 호출일 때 
	if(utct_type === 'TGC00002' && (api_id == '6123' || api_id == '6136' || api_id == '6139' || api_id == '6143' || api_id == '6155' || api_id == '6175' || api_id == '6176' || api_id == '6178')) {	
		r = postgre.setParam2(query, sql3, api_id, access_token_1, org_cd, own_org_cd);	
		logger.debug(r);
	}
	
	
	/*
	//통합테스트 > 테스트데이터 업로드를 체크했을 때
	if(utct_type === 'TGC00002' && data_key == 'Y')  {
		r = postgre.setParam(query, sql2, api_id, own_org_cd, org_cd, ast_id);
		logger.debug(r);
	}
	*/
	
	return r;
};

postgre.getAstId = function (method, query, body, pathname, path) {
	let astId = (method === 'GET') ? query.insu_num : body.insu_num;
	if (astId === undefined)
		astId = (method === 'GET') ? query.sub_key : body.sub_key;
	if (astId === undefined)
		astId = (method === 'GET') ? query.account_num : body.account_num;
	//if (astId === '') {
		//astId = (method === 'GET') ? query.account_num : body.account_num;
	//	astId = undefined;
	//}
	if (astId === undefined)
		astId = (method === 'GET') ? query.fob_id : body.fob_id;
	if (astId === undefined)
		astId = (method === 'GET') ? query.mgmt_id : body.mgmt_id;
	if (astId === undefined && method === 'GET'
		&& /\/{[A-z0-9_-]+}/.exec(path.uri))
		astId = postgre.getPathVal(pathname, 3);
	
	if (astId === undefined)
		astId = (method === 'GET') ? query.pp_id : body.pp_id;
    
	if (astId === undefined)
		astId = (method === 'GET') ? query.lending_id : body.lending_id;
    
	if (astId === undefined)
		astId = (method === 'GET') ? query.bond_num : body.bond_num;
	

	return astId;
	
};

postgre.setParam = function (query, sql, api_id, own_org_cd, org_cd, ast_id) {
	query.text = sql;
	query.values = [];
	query.values.push(api_id);
	query.values.push(own_org_cd);
	query.values.push(org_cd);
	if (ast_id)
		query.values.push(ast_id);

	return query;
};


postgre.setParam2 = function (query, sql, api_id, access_token_1, org_cd, own_org_cd) {
	query.text = sql;
	query.values = [];
	query.values.push(api_id);
	query.values.push(access_token_1);
	query.values.push(org_cd);
	query.values.push(own_org_cd);
	
	return query;
};



//임시
postgre.setParam3 = function (query, sql) {
	query.text = sql;
	return query;
};

postgre.query = async function (q) {
	const client = postgre.pool.connect();
	return await client.query(q);
};
postgre.getPathVal = function (path, idx) {
	const arrPath = path.split('/');
	logger.debug('>>>>>> ', arrPath[idx + 1]);
	return arrPath[idx + 1];
};
module.exports = postgre;
