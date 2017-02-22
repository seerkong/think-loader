const path = require('path');
const helper = require('think-helper');
const assert = require('assert');

/**
 * middleware rules(appPath/middleware.js):
 * module.exports = [
 *  'clean_pathname', 
 * {
 *    handle: denyIp,
 *    options: {},
 *    enable: false,
 *    match: '',
 *    ignore: ''
 * },
 * [handle, options, enable, match, ignore]
 * ]
 */
function parseMiddleware(middlewares = [], middlewarePkg = {}){
  return middlewares.map(item => {
    if(helper.isString(item)){
      return {handle: item};
    }
    //need support Array type? convert Array to object
    if(helper.isArray(item)){
      let data = {}, index = 0;
      data.handle = item[index++];
      ['options', 'enable', 'match', 'ignore'].forEach(it => {
        if(item[index] !== undefined){
          data[it] = item[index++];
        }
      });
      return data;
    }
    return item;
  }).filter(item => {
    return !('enable' in item) || item.enable;
  }).map(item => {
    if(helper.isString(item.handle)){
      item.handle = middlewarePkg[item.handle];
    }
    assert(helper.isFunction(item.handle), 'handle must be a function');
    item.handle = item.handle(item.options || {});
    return item;
  });
}

/**
 * get middlewares in middleware path
 * * [THINKJS_LIB_PATH]/lib/middleware
 * * [APP_PATH]/middleware or [APP_PATH]/common/middleware
 */
function getMiddlewareFiles(middlewarePath){
  let ret = {};
  helper.getdirFiles(middlewarePath).forEach(file => {
    if(!/\.(?:js|es)$/.test(file)){
      return;
    }
    let match = file.match(/(\w+)\.\w+$/);
    if(match && match[1]){
      ret[match[1]] = require(path.join(middlewarePath, file));
    }
  });
  return ret;
}

/**
 * load sys and app middlewares
 */
function loadMiddlewareFiles(appPath, isMultiModule, thinkPath){
  let sysMiddlewares = getMiddlewareFiles(path.join(thinkPath, 'lib/middleware'));
  let appMiddlewarePath = path.join(appPath, isMultiModule ? 'common/middleware' : 'middleware');
  let appMiddlewares = getMiddlewareFiles(appMiddlewarePath);
  let middlewares = Object.assign({}, sysMiddlewares, appMiddlewares);
  return middlewares;
}

function loader(appPath, isMultiModule, thinkPath){
  let filepath = '';
  if(isMultiModule){
    filepath = path.join(appPath, 'common/config/middleware.js');
  }else{
    filepath = path.join(appPath, 'config/middleware.js');
  }
  const middlewares = require(filepath);
  return parseMiddleware(middlewares, loadMiddlewareFiles(appPath, isMultiModule, thinkPath));
}

module.exports = loader;