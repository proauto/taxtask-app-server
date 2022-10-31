//Express 셋팅
const express = require('express');
const path = require('path');
const app = express();

//body parser 셋팅
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//dotenv셋팅
require('dotenv').config()

//MongoDb 셋팅
const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('mongodb');

var db;
MongoClient.connect(process.env.DB_URL, function (에러, client) {
  //DB 연결되면 포트 ON
  if (에러) return console.log(에러)
  db = client.db('todoapp');
  app.listen(process.env.PORT, function () {
    console.log('listening on 8080')
  });
});

//Method Override 셋팅 > PUT DELETE를 위하여
app.use('/public', express.static('public'));
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

//Passport 셋팅 > 로그인 절차
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({ secret: 'secretCode', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//ajax 셋팅
app.use(express.json());
var cors = require('cors');
app.use(cors());


//리액트 셋팅
app.use(express.static(path.join(__dirname, '../taxtask-app/build')));

app.get('/', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '../taxtask-app/build/index.html'));
});


app.get('/product', function (요청, 응답) {
  응답.json({ name: 'black shoes' })
});



//로그인 셋팅 - bcrypt, passport모듈
const bcrypt = require('bcrypt');
const salt = 5

app.post('/login', passport.authenticate('local', {
  failureRedirect: console.log('실패함')
}), function (요청, 응답) {
  응답.send(요청.user)
});

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

    //암호화 해제
    const same = bcrypt.compareSync(입력한비번, 결과.pw)

    if (same) {
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
  db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })
});


//로그인 확인 함수  
function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    next()
  } else {
    응답.send('로그인안하셨는데요?')
  }
}

//회원가입 세팅
app.post('/register', function (요청, 응답) {
  응답.send('전송완료')

  db.collection('counter').findOne({ name: "아이디갯수" }, function (에러, 결과) {
    var 총아이디갯수 = 결과.totalID;
    console.log(총아이디갯수)

    //암호화
    const encryptedPassword = bcrypt.hashSync(요청.body.pw, salt)


    db.collection('login').insertOne({ _id: 총아이디갯수 + 1, id: 요청.body.id, pw: encryptedPassword }, function (에러, 결과) {

      console.log(결과)
      db.collection('counter').updateOne({ name: "아이디갯수" }, { $inc: { totalID: 1 } }, function (에러, 결과) {
        if (에러) return console.log(에러)
      })
    });


  });
});


/*db 데이터 꺼내기

db.collection('post').find().toArray(function(에러, 결과){
        console.log(결과);
    });

*/

//회원가입
/*app.post('/register',function(요청,응답){
    //비번 암호화,id 알파벳숫자 정규식, id 중복 확인, 
    db.collection('login').insertOne({id:요청.body.id, pw : 요청.body.pw}, function(에러,결과){
      응답.redirect('/')
    })
  })
*/


//거래처관리 페이지
//폼에 담긴 자료를 가지고 거래처 정보 갱신
app.put('/accounts/edit:id', function (요청, 응답) {
  
  console.log(요청.body._id)

  db.collection('accounts').updateOne({ _id: parseInt(요청.body._id) }, { $set: {
    id: 요청.body.id,
    name: 요청.body.name,
    case: 요청.body.case,
    category: 요청.body.category,
    num_account: 요청.body.num_account,
    ceo: 요청.body.ceo,
    num_corporation: 요청.body.num_corporation,
    phone: 요청.body.phone,
    type: 요청.body.type,
    open_day: 요청.body.open_day,
    manager: 요청.body.manager,
  } }, function (에러, 결과) {
    console.log('수정완료')
    응답.redirect('/accounts')
  });

});


//매니저 정보 받아서 거래처 정보 전송
app.get('/accounts_data', function (요청, 응답) {
  console.log(요청.query)

  db.collection('accounts').find({ manager: 요청.query.manager }).toArray(function (에러, 결과) {
    console.log(결과);
    응답.json(결과)

  });

});

//거래처 추가
app.post('/accounts_data', function (요청, 응답) {
  응답.send('전송완료')

  db.collection('counter').findOne({ name: "거래처갯수" }, function (에러, 결과) {
    var 총거래처갯수 = 결과.totalAccount;
    console.log(총거래처갯수)


    db.collection('accounts').insertOne({
      _id: 총거래처갯수 + 1,
      id: 요청.body.id,
      name: 요청.body.name,
      case: 요청.body.case,
      category: 요청.body.category,
      num_account: 요청.body.num_account,
      ceo: 요청.body.ceo,
      num_corporation: 요청.body.num_corporation,
      phone: 요청.body.phone,
      type: 요청.body.type,
      open_day: 요청.body.open_day,
      manager: 요청.body.manager,
    }, function (에러, 결과) {

      console.log(결과)
      db.collection('counter').updateOne({ name: "거래처갯수" }, { $inc: { totalAccount: 1 } }, function (에러, 결과) {
        if (에러) return console.log(에러)
      })
    });
  });
});


//할일 리스트
//매니저 정보 받아서 할일 정보 전송
app.get('/todo_data', function (요청, 응답) {
  console.log(요청.query)

  db.collection('todowork').find({ manager: 요청.query.manager }).toArray(function (에러, 결과) {
    console.log(결과);
    응답.json(결과)

  });

});


//할일 정보 추가
app.post('/todo_data', function (요청, 응답) {
  응답.send('전송완료')

  db.collection('counter').findOne({ name: "거래처갯수" }, function (에러, 결과) {
    var 총거래처갯수 = 결과.totalAccount;
    console.log(총거래처갯수)


    db.collection('accounts').insertOne({
      _id: 총거래처갯수 + 1,
      id: 요청.body.id,
      name: 요청.body.name,
      case: 요청.body.case,
      category: 요청.body.category,
      num_account: 요청.body.num_account,
      ceo: 요청.body.ceo,
      num_corporation: 요청.body.num_corporation,
      phone: 요청.body.phone,
      type: 요청.body.type,
      open_day: 요청.body.open_day,
      manager: 요청.body.manager,
    }, function (에러, 결과) {

      console.log(결과)
      db.collection('counter').updateOne({ name: "거래처갯수" }, { $inc: { totalAccount: 1 } }, function (에러, 결과) {
        if (에러) return console.log(에러)
      })
    });
  });
});




//없는 페이지 내용 구현
app.get('*', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '../taxtask-app/build/index.html'))
});
