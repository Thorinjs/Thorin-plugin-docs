'use strict';
const fs = require('fs');
/**
 * Created by Adrian on 15-Apr-16.
 */
module.exports = function(thorin, opt, baseThemeFn) {
  const writer = {},
    outputPath = opt.path;
  const logger = thorin.logger(opt.logger);
  let FULL_DOC = '';  // we keep the full doc in-memory and flush it after a few docs.
  let flushTimer = null,
    actionCount = 0;

  /*
  * Generate the given action documentation.
  * */
  writer.document = function DocumentAction(actionObj, _themeFn) {
    if(actionObj.isTemplate) return;  // we ignore templates.
    let themeFn = (typeof _themeFn === 'function' ? _themeFn : baseThemeFn);
    if(!themeFn) return;
    actionCount++;

    FULL_DOC = themeFn(actionObj);

    if(flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      writer.flush();
    }, 100);
  };

  /*
  * Flush the entire in-memory doc to file.
  * */
  writer.flush = function FlushData(done) {
    fs.writeFile(outputPath, FULL_DOC, { encoding: 'utf8' }, (e) => {
      if(e) {
        logger.warn('Failed to flush documentation to file %s', outputPath, e);
      } else {
        logger.trace('Generated doc (%s actions): %s', actionCount, outputPath);
      }
      done && done(e);
    });
  }

  return writer;
};