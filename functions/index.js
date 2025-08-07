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