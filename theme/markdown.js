'use strict';
/**
 * Created by Adrian on 15-Apr-16.
 * This will write to the .md file.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
}
module.exports = function(thorin, opt) {
  const logger = thorin.logger(opt.logger);

  let content = '';

  function collectData(result, stack) {
    if(typeof stack !== 'object' || !stack) return;
    for(let i=0; i < stack.length; i++ ){
      let item = stack[i];
      switch(item.type) {
        case 'validate':
          result.input.push(item.value);
          break;
        case 'authorize':
          result.authorization.push(item.name);
          let auth = thorin.dispatcher.getAuthorization(item.name);
          if(auth) {
            collectData(result, auth.stack);
            let validators = auth.validate;
            for(let j=0; j < validators.length; j++) {
              let validator = validators[j];
              result.input.push(validator);
            }
          }
          break;
        case 'middleware':
          result.middleware.push(item.name);
          let mid = thorin.dispatcher.getMiddleware(item.name);
          if(mid) {
            collectData(result, mid.stack);
            let validators = mid.validate;
            for(let j=0; j < validators.length; j++) {
              let validator = validators[j];
              result.input.push(validator);
            }
          }
          break;
      }
    }
  }

  return function writeMarkdown(action) {
    // check inputs & authorizations.
    let result = {
      input: [],
      authorization: [],
      middleware: []
    };
    collectData(result, action.stack);
    let res = '## ' + action.name;
    // check if it has any renders
    for(let i=0; i < action.stack.length; i++) {
      if(action.stack[i].type === 'render') {
        res += ' (renderer)';
        break;
      }
    }
    // check aliases
    if (action.aliases && action.aliases.length > 0) {
      res += '\n##### Aliases \n';
      action.aliases.forEach((alias) => {
        res += '> - ' + alias.verb + ' ' + alias.name + '\n';
      });
    }
    if(result.input.length > 0) {
      let inputMap = {},
        curated = [];
      res += '\n##### Input \n';
      /* We now create the input map. */
      for(let i=0; i < result.input.length; i++) {
        Object.keys(result.input[i]).forEach((keyName) => {
          let input = result.input[i][keyName],
            defaultError = input.error(),
            defaultValue = input.default();
          if(typeof inputMap[keyName] === 'undefined') {
            inputMap[keyName] = {
              data: input,
              name: keyName,
              type: capitalize(input.type)
            };
          } else if(inputMap[keyName].type === 'enum') {
            return; // already set enum values.
          }
          if(typeof defaultValue === 'undefined') {
            inputMap[keyName].required = true;
            inputMap[keyName].error = defaultError;
            inputMap[keyName].data = input;
          } else {
            inputMap[keyName].value = defaultValue;
          }
        });
      }
      Object.keys(inputMap).forEach((inputName) =>{
        let item = inputMap[inputName];
        res += ' - **' + inputName + '**';
        if(item.required) {
          res += ' *(required)*';
        }
        res += '  `' + item.type;
        if(item.type === 'enum' && item.data) {
          let vals = item.data.options();
          if(vals) {
            res += '(' + vals.join(', ') + ')';
          }
        }
        if(typeof item.value !== 'undefined') {
          if(item.value == null) item.value = 'null';
          res += ', default ' + (typeof item.value === 'object' ? JSON.stringify(item.value) : item.value);
        }
        res += '`';
        res += '\n';
      });
    }
    if(result.authorization.length > 0) {
      res += '\n##### Authorization \n';
      result.authorization.forEach((auth) => {
        res += ' - ' + auth + '\n';
      });
      res += '\n';
    }
    if(result.middleware.length > 0) {
      res += '\n##### Middleware \n';
      result.middleware.forEach((name) => {
        res += ' - ' + name + '\n';
      });
      res += '\n';
    }

    return (content += res);
  };
};
