//Express 셋팅
const express = require('express');
const path = require('path');
const app = express();

//body parser 셋팅
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

//dotenv셋팅
require('dotenv').config()

//MongoDb 셋팅
const MongoClient = require('mongodb').MongoClient
const { ObjectId} = require('mongodb');

var db;
MongoClient.connect(process.env.DB_URL,function(에러, client){
    //연결되면 할일
    if(에러) return console.log(에러)
    db = client.db('todoapp');
    app.listen(process.env.PORT, function(){
        console.log('listening on 8080')
    });
});

//Method Override 셋팅
app.use('/public', express.static('public'));
const methodOverride = require('method-override')
app.use(methodOverride('_method')) 

//Passport 셋팅
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave: true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());


//ajax 셋팅
app.use(express.json());
var cors = require('cors');
app.use(cors());

app.use(express.static(path.join(__dirname, '../taxtask-app/build')));

app.get('/', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '../taxtask-app/build/index.html'));
});

app.get('/product', function (요청, 응답) {
    응답.json({name : 'black shoes'})
});

app.get('*', function(요청, 응답){
    응답.sendFile(path.join(__dirname, '../taxtask-app/build/index.html'))
})


//로그인 셋팅
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
 }));

  passport.serializeUser(function (user, done) {
    done(null, user.id)
 });
  
  passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({id : 아이디},function(에러, 결과){
        done(null, 결과)
    })
}); 


//회원가입
  app.post('/register',function(요청,응답){
    //비번 암호화,id 알파벳숫자 정규식, id 중복 확인, 
    db.collection('login').insertOne({id:요청.body.id, pw : 요청.body.pw}, function(에러,결과){
      응답.redirect('/')
    })
  })

//로그인 확인 함수  
function 로그인했니(요청, 응답, next){
    if (요청.user){
        next()
    }else{
        응답.send('로그인안하셨는데요?')
    }
}


/*db 데이터 꺼내기

db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
    });

*/