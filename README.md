# node-cielo-recurrent

Cliente de transações recorrentes Cielo API 3.0

## Uso

### Informando credenciais
[Solicitando credenciais](https://cadastrosandbox.cieloecommerce.cielo.com.br/)
```js
let merchantId = 'xxxx-xxxx-xxxx-xxxx-xxxxxxx';
let merchantKey = 'XXXMHLFZGBSPTWMBFENHOSZTMEYHASEXXXXXXXXX';
//para produção remova production ou altere para true
const Cielo = require('node-cielo-recurrent')({merchantId: merchantId, merchantKey: merchantKey, production: false});

```

### Criando venda recorrente

```js
const data = {
  merchantOrderId: '123',
  customer: 'José da Silva',
  payment: {
    type: 'CreditCard',
    amount: 100,
    installments: 1,
    softDescriptor: 'Criando venda',
    recurrentPayment: {
      authorizeNow: true,
      interval: 'Monthly',
    },
    creditCard: {
      cardNumber: '0000000000000001',
      holder: 'JOSE SILVA',
      expirationDate: '12/2030',
      securityCode: '123',
      saveCard: false,
      brand: 'Visa'
    }
  }
};

Cielo.recurrentPayment(data)
  .then(function (res) {
    console.log(res);
  })
  .catch(function (err) {
    console.log(err);
  });

```

### Consultando venda recorrente

```js
//recurrentPaymentId
Cielo.queryRecurrentPayment('39a11dbb-2b95-4c01-a2c0-4221365c53ef')
  .then(function (res) {
    console.log(res);
  })
  .catch(function (err) {
    console.log(err);
  });
```