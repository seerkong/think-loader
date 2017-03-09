const helper = require('think-helper');
const assert = require('assert');

/**
 * {
 *   db: {
 *      type: 'xxx',
 *      common: {
 *
 *      },
 *      xxx: {
 *
 *      }
 *   }
 * }
 * format adapter config, merge common field to item
 */
const formatAdapter = (config, appAdapters) => {
  for(let name in config){
    assert(helper.isObject(config[name]), `adapter.${name} must be an object`);
    //ignore adapter when is emtpy, only has key
    if(helper.isEmpty(config[name])){
      continue;
    }
    assert(config[name].type, `adapter.${name} must have type field`);
    if(!config[name].common){
      continue;
    }
    let common = config[name].common;
    assert(helper.isObject(common), `adapter.${name}.common must be an object`);
    delete config[name].common;
    for(let type in config[name]){
      if(type === 'type'){
        continue;
      }
      let item = config[name][type];
      if(!helper.isObject(item)){
        continue;
      }
      //merge common field to item
      item = helper.extend({}, common, item);
      //convert string handle to class
      if(item.handle && helper.isString(item.handle)){
        assert(name in appAdapters && appAdapters[name][item.handle], `can not find ${name}.${type}.handle`);
        item.handle = appAdapters[name][item.handle];
      }
      config[name][type] = item;
    }
  }
  return config;
}

module.exports = formatAdapter;