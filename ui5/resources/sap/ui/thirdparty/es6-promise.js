/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   v4.2.4+314e4831
  */
(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():typeof define==='function'&&define.amd?define('sap/ui/thirdparty/es6-promise',f):null;g.ES6Promise=f();}(this,(function(){'use strict';function o(x){var c=typeof x;return x!==null&&(c==='object'||c==='function');}function a(x){return typeof x==='function';}var b=void 0;if(Array.isArray){b=Array.isArray;}else{b=function(x){return Object.prototype.toString.call(x)==='[object Array]';};}var d=b;var l=0;var v=void 0;var f=void 0;var g=function g(c,e){w[l]=c;w[l+1]=e;l+=2;if(l===2){if(f){f(y);}else{A();}}};function s(c){f=c;}function h(c){g=c;}var j=typeof window!=='undefined'?window:undefined;var k=j||{};var B=k.MutationObserver||k.WebKitMutationObserver;var m=typeof self==='undefined'&&typeof process!=='undefined'&&{}.toString.call(process)==='[object process]';var n=typeof Uint8ClampedArray!=='undefined'&&typeof importScripts!=='undefined'&&typeof MessageChannel!=='undefined';function u(){return function(){return process.nextTick(y);};}function p(){if(typeof v!=='undefined'){return function(){v(y);};}return t();}function q(){var i=0;var c=new B(y);var e=document.createTextNode('');c.observe(e,{characterData:true});return function(){e.data=i=++i%2;};}function r(){var c=new MessageChannel();c.port1.onmessage=y;return function(){return c.port2.postMessage(0);};}function t(){var c=setTimeout;return function(){return c(y,1);};}var w=new Array(1000);function y(){for(var i=0;i<l;i+=2){var c=w[i];var e=w[i+1];c(e);w[i]=undefined;w[i+1]=undefined;}l=0;}function z(){try{var c=Function('return this')().require('vertx');v=c.runOnLoop||c.runOnContext;return p();}catch(e){return t();}}var A=void 0;if(m){A=u();}else if(B){A=q();}else if(n){A=r();}else if(j===undefined&&typeof require==='function'){A=z();}else{A=t();}function C(c,e){var i=this;var x=new this.constructor(F);if(x[E]===undefined){c1(x);}var _=i._state;if(_){var P=arguments[_-1];g(function(){return Z(_,x,P,i._result);});}else{W(i,x,c,e);}return x;}function D(c){var e=this;if(c&&typeof c==='object'&&c.constructor===e){return c;}var i=new e(F);Q(i,c);return i;}var E=Math.random().toString(36).substring(2);function F(){}var G=void 0;var H=1;var R=2;var T={error:null};function I(){return new TypeError("You cannot resolve a promise with itself");}function J(){return new TypeError('A promises callback cannot return that same promise.');}function K(c){try{return c.then;}catch(e){T.error=e;return T;}}function L(c,i,x,P){try{c.call(i,x,P);}catch(e){return e;}}function M(c,e,i){g(function(c){var x=false;var P=L(i,e,function(_){if(x){return;}x=true;if(e!==_){Q(c,_);}else{U(c,_);}},function(_){if(x){return;}x=true;V(c,_);},'Settle: '+(c._label||' unknown promise'));if(!x&&P){x=true;V(c,P);}},c);}function N(c,e){if(e._state===H){U(c,e._result);}else if(e._state===R){V(c,e._result);}else{W(e,undefined,function(i){return Q(c,i);},function(i){return V(c,i);});}}function O(c,e,i){if(e.constructor===c.constructor&&i===C&&e.constructor.resolve===D){N(c,e);}else{if(i===T){V(c,T.error);T.error=null;}else if(i===undefined){U(c,e);}else if(a(i)){M(c,e,i);}else{U(c,e);}}}function Q(c,e){if(c===e){V(c,I());}else if(o(e)){O(c,e,K(e));}else{U(c,e);}}function S(c){if(c._onerror){c._onerror(c._result);}X(c);}function U(c,e){if(c._state!==G){return;}c._result=e;c._state=H;if(c._subscribers.length!==0){g(X,c);}}function V(c,e){if(c._state!==G){return;}c._state=R;c._result=e;g(S,c);}function W(c,e,i,x){var _=c._subscribers;var P=_.length;c._onerror=null;_[P]=e;_[P+H]=i;_[P+R]=x;if(P===0&&c._state){g(X,c);}}function X(c){var e=c._subscribers;var x=c._state;if(e.length===0){return;}var P=void 0,_=void 0,a1=c._result;for(var i=0;i<e.length;i+=3){P=e[i];_=e[i+x];if(P){Z(x,P,_,a1);}else{_(a1);}}c._subscribers.length=0;}function Y(c,i){try{return c(i);}catch(e){T.error=e;return T;}}function Z(c,e,i,x){var P=a(i),_=void 0,a1=void 0,m1=void 0,n1=void 0;if(P){_=Y(i,x);if(_===T){n1=true;a1=_.error;_.error=null;}else{m1=true;}if(e===_){V(e,J());return;}}else{_=x;m1=true;}if(e._state!==G){}else if(P&&m1){Q(e,_);}else if(n1){V(e,a1);}else if(c===H){U(e,_);}else if(c===R){V(e,_);}}function $(c,i){try{i(function resolvePromise(x){Q(c,x);},function rejectPromise(x){V(c,x);});}catch(e){V(c,e);}}var id=0;function b1(){return id++;}function c1(c){c[E]=id++;c._state=undefined;c._result=undefined;c._subscribers=[];}function d1(){return new Error('Array Methods must be provided an Array');}var e1=function(){function e1(c,i){this._instanceConstructor=c;this.promise=new c(F);if(!this.promise[E]){c1(this.promise);}if(d(i)){this.length=i.length;this._remaining=i.length;this._result=new Array(this.length);if(this.length===0){U(this.promise,this._result);}else{this.length=this.length||0;this._enumerate(i);if(this._remaining===0){U(this.promise,this._result);}}}else{V(this.promise,d1());}}e1.prototype._enumerate=function _enumerate(c){for(var i=0;this._state===G&&i<c.length;i++){this._eachEntry(c[i],i);}};e1.prototype._eachEntry=function _eachEntry(e,i){var c=this._instanceConstructor;var x=c.resolve;if(x===D){var _=K(e);if(_===C&&e._state!==G){this._settledAt(e._state,i,e._result);}else if(typeof _!=='function'){this._remaining--;this._result[i]=e;}else if(c===k1){var P=new c(F);O(P,e,_);this._willSettleAt(P,i);}else{this._willSettleAt(new c(function(x){return x(e);}),i);}}else{this._willSettleAt(c.resolve(e),i);}};e1.prototype._settledAt=function _settledAt(c,i,e){var x=this.promise;if(x._state===G){this._remaining--;if(c===R){V(x,e);}else{this._result[i]=e;}}if(this._remaining===0){U(x,this._result);}};e1.prototype._willSettleAt=function _willSettleAt(c,i){var e=this;W(c,undefined,function(x){return e._settledAt(H,i,x);},function(x){return e._settledAt(R,i,x);});};return e1;}();function f1(e){return new e1(this,e).promise;}function g1(e){var c=this;if(!d(e)){return new c(function(_,V){return V(new TypeError('You must pass an array to race.'));});}else{return new c(function(Q,V){var x=e.length;for(var i=0;i<x;i++){c.resolve(e[i]).then(Q,V);}});}}function h1(c){var e=this;var i=new e(F);V(i,c);return i;}function i1(){throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');}function j1(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");}var k1=function(){function P(c){this[E]=b1();this._result=this._state=undefined;this._subscribers=[];if(F!==c){typeof c!=='function'&&i1();this instanceof P?$(this,c):j1();}}P.prototype.catch=function _catch(c){return this.then(null,c);};P.prototype.finally=function _finally(c){var e=this;var i=e.constructor;return e.then(function(x){return i.resolve(c()).then(function(){return x;});},function(x){return i.resolve(c()).then(function(){throw x;});});};return P;}();k1.prototype.then=C;k1.all=f1;k1.race=g1;k1.resolve=D;k1.reject=h1;k1._setScheduler=s;k1._setAsap=h;k1._asap=g;function l1(){var c=void 0;if(typeof global!=='undefined'){c=global;}else if(typeof self!=='undefined'){c=self;}else{try{c=Function('return this')();}catch(e){throw new Error('polyfill failed because global object is unavailable in this environment');}}var P=c.Promise;if(P){var i=null;try{i=Object.prototype.toString.call(P.resolve());}catch(e){}if(i==='[object Promise]'&&!P.cast){if(typeof P.prototype.finally!=="function"){P.prototype.finally=k1.prototype.finally;}return;}}c.Promise=k1;}k1.polyfill=l1;k1.Promise=k1;k1.polyfill();return k1;})));