/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
const CONNECT_MONGODB = (done)=>{
  MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
    db.s.databaseName = "Advanced-Node";

    if(err) {
          console.log('Database error: ' + err);
      } else {
          console.log('Successful database connection');
        done(db);
      }

  });
};

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(function (req, res){
      CONNECT_MONGODB((db)=>{
        db.collection("Anon Message Board").find( {},
                                                  { reported: 0, delete_password: 0 }).sort( { created_on: -1 } ).limit(10).toArray((err,data)=>{
          if(err) { 
            console.log(err);
            return res.redirect('/');
          }
          data.forEach((el)=>{
            el.replies.sort((a,b)=>{return b.created_on-a.created_on});
            el.replycount = el.replies.length;
            el.replies.splice(3);
            el.replies.forEach((el)=>{
              delete el.reported;
              delete el.delete_password;
            })
          });
          return res.json(data);
        });
      });
    })
    
    .post(function (req, res){
      const date = new Date();
      const thread = {
        text: req.body.text,
        created_on: date,
        bumped_on: date,
        reported: false,
        delete_password: req.body.delete_password,
        replies: []
      };
      CONNECT_MONGODB((db)=>{
          db.collection("Anon Message Board").insertOne(thread, function (err, data) {
            if(err) { 
              console.log(err);
              return res.redirect('/');
            }
            return res.redirect('/b/general');
          });
      });
      
    })
    
    .put(function (req, res){
      CONNECT_MONGODB((db)=>{
          try{
            db.collection('Anon Message Board').findAndModify(
                                      {_id:new ObjectId(req.body.thread_id || req.body.report_id)},
                                      [['_id',1]],
                                      {$set: { reported: true }},
                                      {new: true}
                                                     ,function (err, data) {
             if(err) { 
               console.log(err);
                return res.redirect('/');
              }
              
              data.value === null ? (res.send('incorrect ID')) : (res.send('success'));
                                                       
            });
          } catch (err) {
            //res.redirect('/');       
            throw err;
          }

      });
    })
  
    .delete(function (req, res){
        CONNECT_MONGODB((db)=>{
          if(!req.body.thread_id){
            return res.send("_id error");   
          };
          if(req.body.thread_id.length < 24) {
            return res.send("Invalid ID");
          };
          db.collection('Anon Message Board').findOneAndDelete(
                                                    { _id:new ObjectId(req.body.thread_id),
                                                      delete_password: req.body.delete_password}
                                                    ,function (err, data) {
              if(err) { 
                console.log(err);
                return res.send('could not delete '+req.body.thread_id);
              }
              data.value === null ? (res.send('incorrect password')) : (res.send("success"));                                   
          });
        });
      });
    
  app.route('/api/replies/:board')
    .get(function (req, res){
      CONNECT_MONGODB((db)=>{
        db.collection("Anon Message Board").find( {_id: new ObjectId(req.query.thread_id)},
                                                  { reported: 0, delete_password: 0 }).toArray((err,data)=>{
          if(err) { 
            console.log(err);
            return res.redirect('/');
          }
          
          data.forEach((el)=>{
            el.replies.sort((a,b)=>{return b.created_on-a.created_on});
            el.replycount = el.replies.length;
            el.replies.forEach((el)=>{
              delete el.reported;
              delete el.delete_password;
            })
          });
          return res.json(data[0]);
        });
      });
    })
    
    .post(function (req, res){
      const date = new Date();
      const reply = {
         _id: new ObjectId(),
        text: req.body.text,
        created_on: date,
        reported: false,
        delete_password: req.body.delete_password
      };
      CONNECT_MONGODB((db)=>{
          try{
            db.collection('Anon Message Board').findAndModify(
                                      {_id:new ObjectId(req.body.thread_id)},
                                      [['_id',1]],
                                      {$push: { replies: reply },
                                        $set: { bumped_on: date }},
                                      {new: true}
                                                     ,function (err, data) {
             if(err) { 
               console.log(err);
                return res.redirect('/');
              }
              
              data.value === null ? (res.send('no book exists')) : (res.redirect('/b/general/'+req.body.thread_id));
                                                       
            });
          } catch (err) {
            //res.redirect('/');       
            throw err;
          }

      });
    })
  
    .put(function (req, res){
      CONNECT_MONGODB((db)=>{
          try{
            db.collection('Anon Message Board').findAndModify(
                                      {_id:new ObjectId(req.body.thread_id),
                                        replies: { $elemMatch: { _id: new ObjectId(req.body.reply_id)}}},
                                      [['_id',1]],
                                      {$set: { "replies.$.reported": true }},
                                      {new: true}
                                                     ,function (err, data) {
             if(err) { 
               console.log(err);
                return res.redirect('/');
              }
              
              data.value === null ? (res.send('incorrect ID')) : (res.send('success'));
                                                       
            });
          } catch (err) {
            //res.redirect('/');       
            throw err;
          }

      });
    })
  
    .delete(function (req, res){
        CONNECT_MONGODB((db)=>{
          try{
            db.collection('Anon Message Board').findAndModify(
                                      {_id:new ObjectId(req.body.thread_id),
                                        replies: { $elemMatch: { _id: new ObjectId(req.body.reply_id),
                                                                 delete_password: req.body.delete_password}}},
                                      [['_id',1]],
                                      { $set: { "replies.$.text": "[deleted]" }},
                                      {new: true}
                                                     ,function (err, data) {
             if(err) { 
               console.log(err);
                return res.redirect('/');
              }
              console.log(data);
              data.value === null ? (res.send('incorrect password')) : (res.send( 'success'));
                                                       
            });
          } catch (err) {
            //res.redirect('/');       
            throw err;
          }

        });
      });

};
