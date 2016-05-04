'use strict';
const path = require('path'),
  writerInit = require('./lib/writer'),
  fs = require('fs');
/**
 * Created by Adrian on 08-Apr-16.
 *
 * The Thorin doc generator will listen for all actions that are added to a dispatcher,
 * look into their aliases and input data and generate a doc-like .md file
 * The file we generate can be changed with whatever format you like.
 */
module.exports = function(thorin, opt, pluginName) {
  opt = thorin.util.extend({
    path: 'docs/actions.md', // the default path of the output file
    theme: 'markdown'       // we currently only support markdown
  }, opt);
  const logger = thorin.logger(opt.logger);
  const docObj = {};
  docObj.options = opt;
  if(!path.isAbsolute(opt.path)) {
    opt.path = path.normalize(thorin.root + '/' + opt.path);
  }
  try {
    thorin.util.fs.ensureFileSync(opt.path)
  } catch(e) {
    logger.error('Failed to ensure doc file %s', opt.path, e);
  }
  /* each time we start the app, we have to clear the opt.path file. */
  try {
    fs.writeFileSync(opt.path, '', { encoding: 'utf8' });
  } catch(e) {
    logger.error('Failed to clear doc file %s', opt.path, e);
  }
  let themeFn;
  if(typeof opt.theme === 'function') {
    themeFn = opt.theme;
  } else {
    try {
      themeFn = require('./theme/' + opt.theme)(thorin, opt);
    } catch(e) {
      logger.error('Theme %s not available.', opt.theme, e);
    }
  }
  const writerObj = writerInit(thorin, opt, themeFn);
  docObj.writer = writerObj;
  // collect all items till thorin is running
  let actionList = [];
  thorin.dispatcher.on('action', (action) => actionList.push(action));
  thorin.on(thorin.EVENT.RUN, () => {
    actionList = actionList.sort((a, b) => a.name.localeCompare(b.name));
    actionList.map((item) => writerObj.document(item));
  });
  return docObj;
};
module.exports.publicName = 'docs';