var expect = require('chai').expect;

var hal = require('..');

describe('HAL', function () {

  it('should expose Resource and Link classes', function () {
    expect(hal.Resource).to.be.a('function');
    expect(hal.Link).to.be.a('function');
  });

  describe('Link', function () {
    it('should require rel', function () {
      expect(function () { new hal.Link('', 'href'); }).to.throw(/"rel"/);
    });
    it('should require href', function () {
      expect(function () { new hal.Link('rel', ''); }).to.throw(/"href"/);
    });
    it('should accept a string as href', function () {
      var link = new hal.Link('rel', 'href');
      expect(link.rel).to.equal('rel');
      expect(link.href).to.equal('href');
    });
    it('should accept a hashmap of attributes', function () {
      var link = new hal.Link('rel', {href: 'href', name: 'name'});
      expect(link.href).to.equal('href');
      expect(link.name).to.equal('name');
    });
    it('should ignore extra attributes', function () {
      var link = new hal.Link('rel', {href: 'href', hello: 'world'});
      expect(link.href).to.equal('href');
      expect(link.hello).to.be.undefined;
    });
  });

  describe('Resource', function () {
    it('should copy attributes', function () {
      var res = new hal.Resource({hello: 'world', who: 'am I'});
      expect(res.hello).to.equal('world');
      expect(res.who).to.equal('am I');
    });
    it('should add link rel=self from given uri', function () {
      var res = new hal.Resource({}, 'href');
      expect(res._links).to.be.an('object');
      expect(res._links.self).to.be.an('object');
      expect(res._links.self.href).to.equal('href');
    });
    it('should accept attributes for link rel=self', function () {
      var res = new hal.Resource({}, {href: 'href', name: 'name'});
      expect(res._links).to.be.an('object');
      expect(res._links.self).to.be.an('object');
      expect(res._links.self.href).to.equal('href');
      expect(res._links.self.name).to.equal('name');
    });
    it('should add link', function () {
      var res = new hal.Resource({}, 'href');
      expect(res.link.bind(res, 'edit', '/edit')).to.not.throw(Error);
      expect(res._links).to.have.property('edit');
      expect(res._links.edit.href).to.equal('/edit');
    });
    it('should embed resource', function () {
      var res = new hal.Resource({}, 'href');
      var sub = new hal.Resource({}, 'href2');
      expect(res.embed.bind(res, 'subs', sub)).to.not.throw(Error);
      expect(res._embedded).to.have.property('subs');
      expect(res._embedded.subs).to.be.an('array');
      expect(res._embedded.subs).to.have.length(1);
    });

    describe('String representation', function () {

      var resource;

      before(function () {
        resource = new hal.Resource({
          currentlyProcessing: 14,
          shippedToday: 20
        }, "/orders");
        resource.link("next", "/orders?page=2");
        resource.link("find", {href: "/orders{?id}", templated: true});

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

        resource.embed("orders", [order123, order124]);
      });

      it('should export as JSON', function () {
        var json =
          // Links first
          '{"_links":{"self":{"href":"/orders"},"next":{"href":"/orders?page=2"},"find":{"href":"/orders{?id}","templated":true}},'
          // Embedded next
          + '"_embedded":{"orders":['
            // Sub resources
            + '{"_links":{"self":{"href":"/orders/123"},"basket":{"href":"/baskets/98712"},"customer":{"href":"/customers/7809"}},"total":30,"currency":"USD","status":"shipped"},'
            + '{"_links":{"self":{"href":"/orders/124"},"basket":{"href":"/baskets/97213"},"customer":{"href":"/customers/12369"}},"total":20,"currency":"USD","status":"processing"}'
          + ']}'
          // Properties finally
          + ',"currentlyProcessing":14,"shippedToday":20}';
        expect(resource.toJSON()).to.eql(JSON.parse(json));
        // Note: this test may fail as Object.keys() is not supposed to preserve order
        // We are theoricall unable to guess order of "_links" for example
        expect(JSON.stringify(resource)).to.eql(json);
      });

      it('should export as XML', function () {
        var xml = '<resource href="/orders">'
          // Links first
          + '<link rel="next" href="/orders?page=2" /><link rel="find" href="/orders{?id}" templated="true" />'
          // Embedded next
          + '<resource rel="order" href="/orders/123"><link rel="basket" href="/baskets/98712" /><link rel="customer" href="/customers/7809" /><total>30</total><currency>USD</currency><status>shipped</status></resource>'
          + '<resource rel="order" href="/orders/124"><link rel="basket" href="/baskets/97213" /><link rel="customer" href="/customers/12369" /><total>20</total><currency>USD</currency><status>processing</status></resource>'
          // Properties at end
          + '<currentlyProcessing>14</currentlyProcessing><shippedToday>20</shippedToday>'
          + '</resource>';
        expect(resource.toXML()).to.equal(xml);
      });

    })
  });

});
