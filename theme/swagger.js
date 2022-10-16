'use strict';
/**
 * Created by Niloy on 16-Oct-2022.
 * This will write to the .json file.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
}
module.exports = function (thorin, opt) {
  const logger = thorin.logger(opt.logger);

  const content = opt.openapi
    ? {
        openapi: '3.0.3',
        info: opt.openapi,
      }
    : {};

  content.paths = {};

  let cc = 0;

  function collectData(result, stack) {
    if (typeof stack !== 'object' || !stack) return;
    for (let i = 0; i < stack.length; i++) {
      let item = stack[i];
      switch (item.type) {
        case 'validate':
          result.input.push(item.value);
          break;
        case 'authorize':
          result.authorization.push(item.name);
          let auth = thorin.dispatcher.getAuthorization(item.name);
          if (auth) {
            collectData(result, auth.stack);
            let validators = auth.validate;
            for (let j = 0; j < validators.length; j++) {
              let validator = validators[j];
              result.input.push(validator);
            }
          }
          break;
        case 'middleware':
          result.middleware.push(item.name);
          let mid = thorin.dispatcher.getMiddleware(item.name);
          if (mid) {
            collectData(result, mid.stack);
            let validators = mid.validate;
            for (let j = 0; j < validators.length; j++) {
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
      middleware: [],
    };
    // Get the API data
    collectData(result, action.stack);

    const alias = action.aliases[0];

    const input = [];

    result.input.forEach((each) => {
      input.push(
        Object.entries(each).map(([key, value]) => {
          const defaultError = value.error(),
            defaultValue = value.default();

          return {
            name: key,
            in: 'path',
            required: true,
            schema: {
              type: value.type.toLowerCase(),
            },
          };
        })
      );
    });

    if (alias)
      content.paths = Object.assign(content.paths, {
        [alias.name]: {
          [alias.verb.toLowerCase()]: {
            summary: action.name,
            parameters: input?.flat(),
          },
        },
      });

    return JSON.stringify(content, null, 4);
  };
};
