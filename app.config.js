const app = require('./app.json');

const isQaBuild = process.env.EASY_DO_QA === '1';

module.exports = {
  expo: {
    ...app.expo,
    ...(isQaBuild
      ? {
          name: 'easy-do QA',
          android: {
            ...app.expo.android,
            package: 'com.justinhjm.easydo.qa',
          },
        }
      : {}),
  },
};
