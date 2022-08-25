# API-SandBox
MyData API SandBox는 개발/테스트 목적으로 API Service를 가정하여 http request에 대한 response를 회신할 수 있는 Echo 서버입니다. OAS(Open API Specification) 3.0 표준 준수, GET, POST, PUT 등 다양한 HTTP 매서드 제공하며 금융보안원 MyData 테스트 베드 적용이 되어있습니다.
## 사용 사례
![image](https://user-images.githubusercontent.com/110973169/186584764-28e3fc57-084b-404e-9926-8b71e739e01d.png)<br>
MyData API SandBox는 개발/테스트 목적으로 API Service를 가정하여 http request에 대한response를 회신할 수 있는 Echo 서버입니다. 위 그림과 같이 금융보안원에서 마이데이터 테스트 베드 시스템 구축에 사용사례가 있으며, 아래 그림처럼 단순한 사용자의 개발/테스트 목적으로 사용이 가능합니다.
<br>
![image](https://user-images.githubusercontent.com/110973169/186584813-282e38f9-f121-4411-8fae-ece396f9105b.png)
<br>
### 구축 위치	사용 사례
* On-premise :	[금융보안원] 마이데이터 테스트베드 시스템 구축 사례입니다.
http://www.inzent-mydata.com/board/board.php?bo_table=case&pg=2&idx=4

* Private Cloud	: [교보생명] Hybrid Cloud기반 마이데이터 플랫폼 구축에 사용된 사례입니다.
http://www.inzent-mydata.com/board/board.php?bo_table=case&pg=2&idx=6



## 실행명령 : node lib\open-api-mocker-cli.js -s tests\resources\apim.yml
### 제공되는 apim.yml의 테스트용 API 스팩
- Handling route GET /oauth/2.0/token
- Handling route POST /oauth/2.0/token
- Handling route GET /oauth/2.0/revoke
- Handling route GET /oauth/2.0/authorize
- Handling route POST /telecom/telecoms/transactions
- Handling route POST /telecom/telecoms/paid-transactions
- Handling route POST /support/oauth/2.0/token
- Handling route POST /mgmts/statistics
- Handling route POST /invest/irps/transactions
- Handling route POST /invest/irps/detail
- Handling route POST /invest/irps/basic
- Handling route POST /invest/accounts/transactions
- Handling route POST /invest/accounts/products
- Handling route POST /invest/accounts/basic
- Handling route POST /integ/oauth/2.0/token
- Handling route POST /insu/loans/transactions
- Handling route POST /insu/loans/detail
- Handling route POST /insu/loans/basic
- Handling route POST /insu/irps/transactions
- Handling route POST /insu/irps/detail
- Handling route POST /insu/irps/basic
- Handling route POST /insu/insurances/transactions
- Handling route POST /insu/insurances/payment
- Handling route POST /insu/insurances/contracts
- Handling route POST /insu/insurances/car
- Handling route POST /insu/insurances/car/transactions
- Handling route POST /insu/insurances/basic
- Handling route POST /ginsu/insurances/transactions
- Handling route POST /ginsu/insurances/basic
- Handling route POST /finan/oauth/2.0/token
- Handling route POST /efin/accounts/transactions
- Handling route POST /efin/accounts/prepaid-transactions
- Handling route POST /efin/accounts/charge
- Handling route POST /efin/accounts/balance
- Handling route POST /company/oauth/2.0/token
- Handling route POST /capital/loans/transactions
- Handling route POST /capital/loans/oplease/transactions
- Handling route POST /capital/loans/oplease/basic
- Handling route POST /capital/loans/detail
- Handling route POST /capital/loans/basic
- Handling route POST /ca_verification
- Handling route POST /bank/irps/transactions
- Handling route POST /bank/irps/detail
- Handling route POST /bank/irps/basic
- Handling route POST /bank/accounts/loan/transactions
- Handling route POST /bank/accounts/loan/detail
- Handling route POST /bank/accounts/loan/basic
- Handling route POST /bank/accounts/invest/transactions
- Handling route POST /bank/accounts/invest/detail
- Handling route POST /bank/accounts/invest/basic
- Handling route POST /bank/accounts/deposit/transactions
- Handling route POST /bank/accounts/deposit/detail
- Handling route POST /bank/accounts/deposit/basic
- Handling route GET /telecom/telecoms
- Handling route GET /telecom/telecoms/bills
- Handling route GET /telecom/consents
- Handling route GET /telecom/apis
- Handling route GET /mgmts/status
- Handling route GET /mgmts/sevices
- Handling route GET /mgmts/req-statistics
- Handling route GET /mgmts/orgs
- Handling route GET /mgmts/consents
- Handling route GET /mgmts/ca_credentials
- Handling route GET /invest/irps
- Handling route GET /invest/consents
- Handling route GET /invest/apis
- Handling route GET /invest/accounts
- Handling route GET /insu/loans
- Handling route GET /insu/irps
- Handling route GET /insu/insurances
- Handling route GET /insu/consents
- Handling route GET /insu/apis
- Handling route GET /ginsu/insurances
- Handling route GET /ginsu/consents
- Handling route GET /ginsu/apis
- Handling route GET /efin/consents
- Handling route GET /efin/apis
- Handling route GET /efin/accounts
- Handling route GET /card/loans
- Handling route GET /card/loans/short-term
- Handling route GET /card/loans/revolving
- Handling route GET /card/loans/long-term
- Handling route GET /card/consents
- Handling route GET /card/cards
- Handling route GET /card/cards/:card_id
- Handling route GET /card/cards/:card_id/approval-overseas
- Handling route GET /card/cards/:card_id/approval-domestic
- Handling route GET /card/cards/point
- Handling route GET /card/cards/payment
- Handling route GET /card/cards/bills
- Handling route GET /card/cards/bills/detail
- Handling route GET /card/apis
- Handling route GET /capital/loans
- Handling route GET /capital/consents
- Handling route GET /capital/apis
- Handling route GET /bank/irps
- Handling route GET /bank/consents
- Handling route GET /bank/apis
- Handling route GET /bank/accounts

