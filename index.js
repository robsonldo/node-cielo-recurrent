'use strict';

const config = require('./config');
const request = require('request');
const uuidV1 = require('uuid/v1');

const TRANSACTION_STATUS = require('./status/transaction-status.json')['codes'];

const ROUTES = {
  RECURRENT: {
    TRANSACTION: {
      CREATE: { PATH: '/1/sales/', METHOD: 'POST' },
      CAPTURE: { PATH: '/1/sales/:paymentId/capture', METHOD: 'PUT' },
      MODIFY_AMOUNT: { PATH: '/1/RecurrentPayment/:recurrentPaymentId/Amount', METHOD: 'PUT' },
      REACTIVATE: { PATH: '/1/RecurrentPayment/:recurrentPaymentId/Reactivate', METHOD: 'PUT' },
      DEACTIVATE: { PATH: '/1/RecurrentPayment/:recurrentPaymentId/Deactivate', METHOD: 'PUT' }
    },
    QUERY: {
      SEARCH: { PATH: '/1/RecurrentPayment/:recurrentPaymentId', METHOD: 'GET' }
    }
  }
};

let Cielo = function (options) {
  options = options || {};
  if(!options.merchantId || !options.merchantKey){
    throw new Error('merchantId and merchantKey value must be defined!');
  }
  
  this.merchantId = options.merchantId;
  this.merchantKey = options.merchantKey;
  this.requestId = options.requestId;
  this.environment = options.production ? config.production : config.dev;
  
  this.transactionUrl = this.environment.url.transaction;
  this.queryUrl = this.environment.url.query;
  
  this.requestHeaders = {
    merchantId: this.merchantId,
    merchantKey: this.merchantKey
  }
};

Cielo.prototype.recurrentPayment = function (data) {
  let self = this;
  return new Promise(
    function (resolve, reject) {
      
      let url = `${self.transactionUrl}${ROUTES.RECURRENT.TRANSACTION.CREATE.PATH}`;
      let method = ROUTES.RECURRENT.TRANSACTION.CREATE.METHOD;
      
      let oPayment = {
        MerchantOrderId: data.merchantOrderId,
        Customer: { Name: data.customer } || undefined,
        Payment: {
          Type: data.payment.type,
          Amount: data.payment.amount,
          Installments: data.payment.installments,
          SoftDescriptor: data.payment.softDescriptor || undefined,
          RecurrentPayment:{
            AuthorizeNow: data.payment.recurrentPayment.authorizeNow || true,
            Interval: data.payment.recurrentPayment.interval || undefined,
            EndDate: data.payment.recurrentPayment.endDate || undefined
          },
          CreditCard: {
            CardNumber: data.payment.creditCard.cardNumber,
            Holder: data.payment.creditCard.holder || undefined,
            ExpirationDate: data.payment.creditCard.expirationDate,
            SecurityCode: data.payment.creditCard.securityCode,
            SaveCard: data.payment.creditCard.saveCard,
            Brand: data.payment.creditCard.brand
          }
        },
      };
      
      callApi(url, method, self.requestHeaders, undefined, oPayment)
        .then(function (res) {
          let transaction = {
            message: TRANSACTION_STATUS[res.Payment.Status],
            tid: res.Payment.Tid || undefined,
            paymentId: res.Payment.PaymentId,
            transaction: res
          };
          
          transaction.success = res.Payment.Status == 1 || res.Payment.Status == 2;
          resolve(transaction);
        })
        .catch(reject);
    }
  );
};

Cielo.prototype.capture = function (paymentId) {
  let self = this;
  return new Promise(
    function (resolve, reject) {
      let url = `${self.transactionUrl}${ROUTES.RECURRENT.TRANSACTION.CAPTURE.PATH}`.replace(/:paymentId/g, paymentId);
      let method = ROUTES.RECURRENT.TRANSACTION.CAPTURE.METHOD;
  
      callApi(url, method, self.requestHeaders)
        .then(resolve)
        .catch(reject);
    }
  );
};

Cielo.prototype.modifyAmount = function (recurrentPaymentId, amount) {
  let self = this;
  return new Promise(
    function (resolve, reject) {
      let url = `${self.transactionUrl}${ROUTES.RECURRENT.TRANSACTION.MODIFY_AMOUNT.PATH}`.replace(/:recurrentPaymentId/g, recurrentPaymentId);
      let method = ROUTES.RECURRENT.TRANSACTION.MODIFY_AMOUNT.METHOD;
      
      callApi(url, method, self.requestHeaders, undefined, amount)
        .then(resolve)
        .catch(reject);
    }
  );
};

Cielo.prototype.reactivate = function (recurrentPaymentId) {
  let self = this;
  return new Promise(
    function (resolve, reject) {
      let url = `${self.transactionUrl}${ROUTES.RECURRENT.TRANSACTION.REACTIVATE.PATH}`.replace(/:recurrentPaymentId/g, recurrentPaymentId);
      let method = ROUTES.RECURRENT.TRANSACTION.REACTIVATE.METHOD;
      
      callApi(url, method, self.requestHeaders)
        .then(resolve)
        .catch(reject);
    }
  );
};

Cielo.prototype.deactivate = function (recurrentPaymentId) {
  let self = this;
  return new Promise(
    function (resolve, reject) {
      let url = `${self.transactionUrl}${ROUTES.RECURRENT.TRANSACTION.DEACTIVATE.PATH}`.replace(/:recurrentPaymentId/g, recurrentPaymentId);
      let method = ROUTES.RECURRENT.TRANSACTION.DEACTIVATE.METHOD;
      
      callApi(url, method, self.requestHeaders)
        .then(resolve)
        .catch(reject);
    }
  );
};

Cielo.prototype.queryRecurrentPayment = function (recurrentPaymentId) {
  let self = this;
  return new Promise(
    function (resolve, reject) {
      let url = `${self.queryUrl}${ROUTES.RECURRENT.QUERY.SEARCH.PATH}`.replace(/:recurrentPaymentId/g, recurrentPaymentId);
      let method = ROUTES.RECURRENT.QUERY.SEARCH.METHOD;
  
      callApi(url, method, self.requestHeaders)
        .then(resolve)
        .catch(reject);
    }
  );
};

let callApi = function (url, method, headers, qs, json) {
  return new Promise(
    function (resolve, reject) {
      
      request({
        uri: url,
        qs: qs,
        headers: {
          'Content-Type': 'application/json',
          MerchantId: headers.merchantId,
          MerchantKey: headers.merchantKey,
          RequestId: uuidV1()
        },
        method: method,
        json: json
      }, function (err, res, body) {
        if (!err && res.statusCode >= 200 && res.statusCode <= 226) {
          resolve(
            typeof body === 'string' && body != ''
              ? JSON.parse(body)
              : body || { success : true }
          );
        }
        else if(res.statusCode == 404) reject(new Error('Not Found'));
        else if(res.statusCode == 401) reject(new Error('Credential failed'));
        else if(res.statusCode == 500) reject(new Error('Server Error'));
        else reject(err ? err : body);
      });
    }
  );
};

module.exports = function (options) {
  return new Cielo(options);
};