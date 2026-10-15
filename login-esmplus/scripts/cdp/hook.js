(function () {
  window.__cap = window.__cap || {};
  function sk(u) {
    u = String(u || '');
    if (u.indexOf('/api/login/token/cookie') >= 0) return 'tokenCookie';
    if (u.indexOf('/api/login/finalize') >= 0) return 'finalize';
    if (u.indexOf('/api/login') >= 0) return 'login';
    if (u.indexOf('PhoneOwner') >= 0) return 'phoneOwner';
    if (u.indexOf('verification') >= 0) return 'verification';
    return '';
  }
  try {
    var of = window.fetch;
    window.fetch = function () {
      var args = arguments;
      return of.apply(this, args).then(function (r) {
        try {
          var a = args[0];
          var u = (typeof a === 'string' ? a : (a && a.url)) || '';
          var k = sk(u);
          if (k) { r.clone().json().then(function (j) { window.__cap[k] = j; }).catch(function () {}); }
        } catch (e) {}
        return r;
      });
    };
  } catch (e) {}
  try {
    var oOpen = XMLHttpRequest.prototype.open;
    var oSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; return oOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function () {
      var self = this;
      self.addEventListener('load', function () {
        try {
          var k = sk(self.__u);
          if (k) { try { window.__cap[k] = JSON.parse(self.responseText); } catch (e) {} }
        } catch (e) {}
      });
      return oSend.apply(self, arguments);
    };
  } catch (e) {}
})();
