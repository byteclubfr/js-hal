var hal = require('./');

var ordersCollection = new hal.Resource({
  currentlyProcessing: 14,
  shippedToday: 20
}, "/orders");

ordersCollection.link("next", "/orders?page=2");
ordersCollection.link("find", {href: "/orders{?id}", templated: true});

var order123 = new hal.Resource({
  total: 30.00,
  currency: "USD",
  status: "shipped"
}, "/orders/123");
order123.link(new hal.Link("basket", "/baskets/98712"));
order123.link(new hal.Link("customer", {href: "/customers/7809"}));

var order124 = new hal.Resource({
  total: 20.00,
  currency: "USD",
  status: "processing"
}, "/orders/124");
order124.link("basket", "/baskets/97213");
order124.link("customer", "/customers/12369");

ordersCollection.embed("orders", [order123, order124]);

console.log('JSON:', ordersCollection.toJSON('  '));
console.log('XML:', ordersCollection.toXML('  '));
