const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const cors      = require('cors')({ origin: true });

admin.initializeApp();

const { signup }       = require('./SignUp');
const { login }        = require('./Login');
const { logout }       = require('./Logout');
const { withdraw }     = require('./WithDraw');
const { checkSession } = require('./checkSession');

exports.signup       = signup;
exports.login        = login;
exports.logout       = logout;
exports.withdraw     = withdraw;
exports.checkSession = checkSession;

