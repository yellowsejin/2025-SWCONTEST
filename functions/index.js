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
=======
const admin = require('firebase-admin');
admin.initializeApp();

const functions = require('firebase-functions/v1');

const onUserCreate           = require('./onUserCreate');
const getUnlockedFurnitures  = require('./getUnlockedFurnitures');
const purchaseFurniture      = require('./purchaseFurniture');
const completeQuest          = require('./completeQuest');
const getTodayQuest          = require('./getTodayQuest');
const sendFriendRequest      = require('./sendFriendRequest');
const respondFriendRequest   = require('./respondFriendRequest');
const apiRouter              = require('./api');

// Auth 트리거
exports.onUserCreate = onUserCreate;

// Callable 함수
exports.getUnlockedFurnitures = getUnlockedFurnitures;
exports.purchaseFurniture     = purchaseFurniture;
exports.completeQuest         = completeQuest;
exports.sendFriendRequest     = sendFriendRequest;
exports.respondFriendRequest  = respondFriendRequest;
exports.getTodayQuest         = getTodayQuest;

// Express API
exports.api = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(apiRouter);
>>>>>>> origin/BE_yunseo
