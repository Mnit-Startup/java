const {expect} = require('chai');
const {describe} = require('mocha');

const {bootstrap} = require('./test/tester');

const Config = require('./config');

describe('config', () => {
  const ctx = bootstrap();

  beforeEach('should get reset after every call', () => {
    expect(Config.get.bind(null, 'test')).to.throw();
  });

  it('it should throw error if value for path is not provided', () => {
    expect(Config.get.bind(null, 'test.missing')).to.throw();
  });

  it('should return configured value for the provided path', () => {
    // set config
    ctx.config.set('test.something', 'foo');
    // check it
    expect(Config.get('test.something')).to.equal('foo');
  });

  it('should return false if provided path was not configured', () => {
    expect(Config.has('test.something')).to.eql(false);
  });

  it('should return true if provided path was configured', () => {
    // set config
    ctx.config.set('test.something', 'foo');
    // check it
    expect(Config.has('test.something')).to.eql(true);
  });

  it('ensure should not throw error if none of the provided paths is missing', () => {
    // set config
    ctx.config.set('test', {
      foo: 'abc',
      bar: 'xyz',
    });
    // check it
    expect(Config.ensure.bind(null, [
      'test.foo',
      'test.bar',
    ])).to.not.throw();
  });

  it('ensure should throw error if any of the provided path is missing', () => {
    // set config
    ctx.config.set('test', {
      foo: 'abc',
      bar: 'xyz',
    });
    // check it
    expect(Config.ensure.bind(null, [
      'test.foo',
      'test.bar',
      'test.missing',
    ])).to.throw();
  });

  it('ensure should be able to perform optional check and not throw if check passes and config is provided', () => {
    // set config
    ctx.config.set('test', {
      flag: true,
      foo: 'abc',
    });
    // check it
    expect(Config.ensure.bind(null, [
      {
        check: 'test.flag',
        config: 'test.foo',
      },
    ])).to.not.throw();
  });

  it('ensure should be able to perform optional ginger-check and should throw if check passes and config is not provided', () => {
    // set config
    ctx.config.set('test', {
      flag: true,
    });
    // check it
    expect(Config.ensure.bind(null, [
      {
        check: 'test.flag',
        config: 'test.foo',
      },
    ])).to.throw();
  });

  it('ensure should be able to perform optional check and not throw when check fails and config is not provided', () => {
    // set config
    ctx.config.set('test', {
      flag: false,
    });
    // check it
    expect(Config.ensure.bind(null, [
      {
        check: 'test.flag',
        config: 'test.foo',
      },
    ])).to.not.throw();
  });

  it('check should return false if path was not configured', () => {
    expect(Config.check('test.flag')).to.eql(false);
  });

  it('check should return false if path was configured and value provided was other than true', () => {
    // check for false
    ctx.config.set('test.flag-1', false);
    expect(Config.check('test.flag-1')).to.eql(false);
    // check for other than boolean
    ctx.config.set('test.flag-2', 'foo');
    expect(Config.check('test.flag-2')).to.eql(false);
  });

  it('check should return true if path was configured and value provided was true', () => {
    // set config
    ctx.config.set('test.flag', true);
    // check it
    expect(Config.check('test.flag')).to.eq(true);
  });

  it('check should return true if path was configured and value provided was true', () => {
    // set config
    ctx.config.set('test.flag', true);
    // check it
    expect(Config.check('test.flag')).to.eq(true);
  });
});
