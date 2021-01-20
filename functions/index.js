const functions = require("firebase-functions");
const app = require('express')();
const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/screams')
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require("./handlers/users");
const FBAuth = require('./util/fbAuth')

const { db } = require('./util/admin');


//screams routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);

//signup route
app.post('/signup', signup)
//login
app.post('/login', login)
//uploading image
app.post('/user/image', FBAuth, uploadImage)
//editing users
app.post('/user', FBAuth, addUserDetails)
//get users data
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}').onCreate((snapshot) => {
    //the snapshot is of the document that has been just created
    db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if (doc.exists) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: snapshot.data().screamId
                })
            }
        })
        .then(() => {
            return null;
        })
        .catch(err => {
            console.log(err);
            return null;
        })
})

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}').onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if (doc.exists) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: snapshot.data().screamId
                })
            }
        })
        .then(() => {
            return null;
        })
        .catch(err => {
            console.log(err);
            return null;
        })
})

exports.deleteNotificationOnUnLike = functions.region('europe-west1').firestore.document('likes/{id}').onDelete(snapshot => {
    db.doc(`/notifications/${snapshot.id}`).delete()
        .then(() => {
            return null;
        })
        .catch(err => {
            console.log(err);
            return null;
        })
})

