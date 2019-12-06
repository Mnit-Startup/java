module.exports = {
  productMissingTax: {
    id: '5dc2cc736349d55037421402',
    name: 'test product',
    price: '10',
    sku_number: 'test sku number',
    taxable: true,
    active: true,
  },
  productNegativeTax: {
    id: '5dc2cc736349d55037421402',
    name: 'test product',
    price: '10',
    sku_number: 'test sku number',
    taxable: true,
    active: true,
    tax: -10,
  },
  productInvalidTax: {
    id: '5dc2cc736349d55037421402',
    name: 'test product',
    price: '10',
    sku_number: 'test sku number',
    taxable: true,
    active: true,
    tax: 'abc',
  },
  productZeroTax: {
    id: '5dc2cc736349d55037421402',
    name: 'test product',
    price: 10,
    sku_number: 'test sku number',
    taxable: true,
    active: true,
    tax: 0,
  },
  productValidTax: {
    id: '5dc2cc736349d55037421402',
    name: 'test product',
    price: 10,
    sku_number: 'test sku number',
    taxable: true,
    active: true,
    tax: 10,
  },
};