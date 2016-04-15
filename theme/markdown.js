'use strict';
/**
 * Created by Adrian on 15-Apr-16.
 * This will write to the .md file.
 */
function capitalize(str) {
  str = str.toLowerCase();
  str[0] = str.charAt(0).toUpperCase();
  return str;
}
module.exports = function(thorin, opt) {
  const logger = thorin.logger(opt.logger);

  return function writeMarkdown(action) {
    // check inputs & authorizations.
    let inputs = [],
      authoriaztions = [];
    for(let i=0; i < action.stack.length; i++) {
      let item = action.stack[i];
      if(item.type === 'validate') {
        inputs.push(item.value);
      }
      if(item.type === 'authorize') {
        authoriaztions.push(item.name);
      }
    }
    let res = '## ' + action.name;
    // check if it has any renders
    for(let i=0; i < action.stack.length; i++) {
      if(action.stack[i].type === 'render') {
        res += ' (renderer)';
        break;
      }
    }
    res += '\n';
    // check aliases
    if(action.aliases) {
      res += '\n##### Aliases \n';
      action.aliases.forEach((alias) => {
        res += '> - ' + alias.verb + ' ' + alias.name + '\n';
      });
    }

    if(inputs.length > 0) {
      let inputMap = {};
      res += '\n##### Input \n';
      inputs.forEach((inputData) => {
        Object.keys(inputData).forEach((inputName) => {
          if(inputMap[inputName]) return;
          inputMap[inputName] = true;
          let input = inputData[inputName],
            type = capitalize(inputData[inputName].type),
            defaultError = input.error(),
            defaultValue = input.default();
          res += ' - **' + inputName + '**';
          if(defaultError) {
            res += ' *(required)*';
          }
          res += '  `' + type;
          if(type === 'enum') {
            let vals = input.options();
            res += '(' + vals.join(', ') + ')';
          }
          if(defaultValue) {
            res += ', default ' + defaultValue;
          }
          res += '`';
          res += '\n';
        });
      });
    }
    if(authoriaztions.length > 0) {
      res += '\n##### Authorization \n';
      authoriaztions.forEach((auth) => {
        res += ' - ' + auth + '\n';
      });
      res += '\n';
    }

    return res;
  }
}