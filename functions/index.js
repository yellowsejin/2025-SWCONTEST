const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const functions = require('firebase-functions/v1');

if (!admin.apps.length) admin.initializeApp();

// ===== BE_nuri 기능 =====
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

// ===== BE_yunseo 기능 =====
const onUserCreate           = require('./onUserCreate');
const getUnlockedFurnitures  = require('./getUnlockedFurnitures');
const purchaseFurniture      = require('./purchaseFurniture');
const completeQuest          = require('./completeQuest');
const getTodayQuest          = require('./getTodayQuest');
const sendFriendRequest      = require('./sendFriendRequest');
const respondFriendRequest   = require('./respondFriendRequest');
const apiRouter              = require('./api');

// ===== export =====
// BE_nuri exports
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

// BE_yunseo exports
exports.onUserCreate           = onUserCreate;
exports.getUnlockedFurnitures  = getUnlockedFurnitures;
exports.purchaseFurniture      = purchaseFurniture;
exports.completeQuest          = completeQuest;
exports.getTodayQuest          = getTodayQuest;
exports.sendFriendRequest      = sendFriendRequest;
exports.respondFriendRequest   = respondFriendRequest;

// Express API export
exports.api = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(apiRouter);
