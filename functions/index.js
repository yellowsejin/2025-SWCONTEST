const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

// 나머지 함수 require
const { signup }         = require('./SignUp');
const { login }          = require('./Login');
const { logout }         = require('./Logout');
const { withdraw }       = require('./WithDraw');
const { checkSession }   = require('./checkSession');
const { addCategory }    = require('./AddCategory');
const { deleteCategory } = require('./DeleteCategory');
const { addTodo }        = require('./AddTodo');
const { deleteTodo }     = require('./DeleteTodo');
const { changePassword } = require('./ChangePassword');
const { completeTodo }   = require('./CompleteTodo');
const { todoCounters }   = require('./TodoCounters');


// v2 방식으로 export
exports.signup          = signup;
exports.login           = login;
exports.logout          = logout;
exports.withdraw        = withdraw;
exports.checkSession    = checkSession;
exports.addCategory     = addCategory;
exports.deleteCategory  = deleteCategory;
exports.addTodo         = addTodo;
exports.deleteTodo      = deleteTodo;
exports.changePassword  = changePassword;
exports.completeTodo    = completeTodo;
exports.todoCounters    = todoCounters;