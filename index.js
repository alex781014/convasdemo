require('dotenv').config();
const express = require('express');
const multer = require('multer');
// const upload = multer({ dest: 'tmp-uploads' }) //暫存資料夾在哪裡
// const upload = require(__dirname + '/modules/upload-images');
const moment = require('moment-timezone');
const session = require('express-session');
const axios = require('axios');
// const { toDateString, toDatetimeString } = require(__dirname + '/modules/data-tools');
const bcrypt = require('bcryptjs')
const cors = require('cors');

//20220628 11:30 將session存入資料庫  主程式做就可以
const db = require(__dirname + '/modules/mysql-connect');
const MysqlStore = require('express-mysql-session')(session) //將上面的session 當參數丟進來
const sessionStore = new MysqlStore({}, db) //已經有資料庫連線了 所以才是空物件,有現成的直接丟進來第二個參數db

//建立web server物件
const app = express();
// 設定ejs注意!!這跟路由沒關係喔!
app.set('view engine', 'ejs');
// 可以區分大小寫設定 看需求
// app.set('case sensitive routing', true);

// 白名單範例
// const whitelist = [];
// const corsOptions = {
//     credentials: true,
//     origin: (origin, cb) => {
//         console.log({ origin });
//         cb(null, true); //全部都允許
//     }
// }
// app.use(cors(corsOptions));



// Top-level middleware 要放在所有路由之前
// 5.1 session 20220627  16:00
// session 是掛在req身上 所以會是req.session
app.use(session({
    secret: 'asfsadfsadgtt4etuhyjtjyttgdbd',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 60000,
    }
}))

// 設定加料的概念  看是什麼格式 走什麼格式
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
// 跟404是一樣意思 下這段 不管在哪直接next()
// 設全域的middware
app.use((req, res, next) => {
    // locals就是掛在res物件身上
    res.locals.shinder = '哈囉';
    next();
    // res.json({ action: 'stop' });
})
// 上課範例 但是寫api不要用 
// app.use((req, res, next) => {

//     res.locals.toDateString = toDateString;
//     res.locals.toDatetimeString = toDatetimeString;
//     //         這個session自己決定的
//     res.locals.session = req.session; //這樣templ就會吃到session
//     next();
// })



// queryString
app.get('/try-qs', (req, res) => {
    // exrpess會解析客戶的資料丟到這裡
    //要回應json字串
    res.json(req.query);
})

// 同上 改用post
// middleware 仲介軟體其實就是個function false 在解析時候會用本身功能解析 true的話是用qs解析
const bodyParser = express.urlencoded({ extended: false })
// 如果多個middleware 用array 注意會按照順序
app.post('/try-post', bodyParser, (req, res) => {
    // bodyParser ↓req.body
    res.json(req.body);
})

// 同個路徑 不同方法 //決定路徑再決定方法
app.route('/try-post-form')
    .get((req, res) => {
        // render樣板
        res.render('try-post-form')
    })
    .post((req, res) => {
        const { email, password } = req.body
        res.render('try-post-form', { email, password })
    })

// app.get('/try-post-form', (req, res) => {
// })
// app.post('/try-post-form', (req, res) => {
// })
// 20220624 11:46(上傳檔案) single單個檔案  multer:說明文件 https://www.npmjs.com/package/multer
// app.post('/try-upload', upload.single('avatar'), (req, res) => {
//     res.json(req.file);
// })

// 上傳多個檔案
// app.post('/try-uploads', upload.array('photos'), (req, res) => {
//     res.json(req.files);
// })
// Router處理
// 4.5.1 使用變數代稱設定路由
// § : 冒號之後為代稱名 幾乎都用這種
// § ?為選擇性的
// § * 為 wildcard  不建議使用

app.get('/try-params1/:action/:id', (req, res) => {
    res.json({ code: 2, params: req.params })
})
app.get('/try-params1/:action', (req, res) => {
    res.json({ code: 3, params: req.params })
})
app.get('/try-params1/:action?/:id?', (req, res) => { //最寬鬆所以要放在最後面 都沒有才會進到這裡來
    res.json({ code: 1, params: req.params })
})
// 20220629 0910 
// app.use('/customized_lunch', require(__dirname + '/routes/customized_lunch'))
// app.use('/carts', require(__dirname + '/routes/carts'))


// 4.5.2 使用 regular expression 設定路由
app.get(/^\/hi\/?/i, (req, res) => {
    res.send({ url: params })
})
// 有好幾個路徑要進入就可以是array
app.get(['/aaa', '/bbb'], (req, res) => {
    res.send({ url: req.url, code: 'arrays' })
})
// app.get('/try-json', (req, res) => {
//     const data = require(__dirname + '/data/data01');
//     console.log(data);
//     res.json(data)//用json再回傳
// })

// axios範例 20220630 12:00 
app.get('/yahoo', async (req, res) => {
    axios.get('https://tw.yahoo.com/')
        .then(function (response) {
            // console.log(response);
            res.send(response.data);//拿到什麼 傳什麼回去
        })
})
app.route('/login')
    .get(async (req, res) => {
        res.render('login')
    })
    .post(async (req, res) => {
        const output = {
            success: false,
            error: '',
            code: 0,
        };
        const sql = "SELECT * FROM admins WHERE account=?";
        const [r1] = await db.query(sql, [req.body.account]);

        if (!r1.length) {
            output.code = 401;
            output.error = '帳密錯誤'
            return res.json(output)
        }
        // const row = r1[0]
        // 此範例一定要用bcrypt加密後才行  2022/7/1 登入驗證範例 上午所有影片
        output.success = await bcrypt.compare(req.body.password, r1[0].pass_hash);
        if (!output.success) {
            output.code = 402;
            output.error = '帳密錯誤'
        } else {
            req.session.admin = {
                sid: r1[0].sid,
                account: r1[0].account,
            };
        }
        res.json(output);
    });
// 登出!
app.get('/logout', (req, res) => {
    delete req.session.admin;
    res.redirect('/')
})



app.get('/try-json', (req, res) => {
    const data = require(__dirname + '/data/data01');
    console.log(data);
    res.locals.rows = data;
    res.render('try-json')
})
// 5.2時間格式
app.get('/try-moment', (req, res) => {
    const fm = 'YYYY-MM-DD HH:mm:ss';
    const m1 = moment();
    const m2 = moment('2016-03-24');
    res.json({
        // 用m1的格式輸出fm成字串
        m1: m1.format(fm),
        m1a: m1.tz('Europe/Rome').format(fm),
        m2: m2.format(fm),
        m2a: m2.tz('Europe/Rome').format(fm),
    })
})
//4.5.3 路由模組化 20220627 01:58 多人api可以用這種方式
// const adminsRouter = require(__dirname + '/routes/admins')
// app.use('/admins', adminsRouter)
// 可以同路由 prefix前綴路徑
// app.use(adminsRouter)



// 5.1 session範例：顯示頁面刷新次數
app.get('/try-session', (req, res) => {
    req.session.my_var = req.session.my_var || 0;
    req.session.my_var++;
    res.json({
        my_var: req.session.my_var,
        session: req.session,
    })
})

//路由→→ app.get('/', function (req, res) {res.send('Hello World!')});    

//  專案內建立資料夾 public/
// § 在裡面放 a.html
// § 將下列程式，放在所有路由設定的前面
// § 使用瀏覽器查看 http://localhost:3000/a.html
// § 靜態內容的資料夾可以設定多個，但「請注意順序」
// ---靜態檔案---
app.use(express.static('public'))

// 從node_modules 設定boostrap
// ↓/bootstrap = node_modules/bootstrap/dist 所以網址後面再輸入/css/bootstrap.css就找到了
// app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))
// app.use('/joi', express.static('node_modules/joi/dist'))

// 注意req,res不要放顛倒
// express只有定義一個"/"的話 就只能訪問根目錄
// app.get('/', function (req, res) {
//     res.send('Hello World!');
// });
app.use('/customized_product', require(__dirname + '/routes/customized_product'));

// ↓EJS用 記得是res.render
// app.get('/', function (req, res) {
//     //                  輸入要帶入的值
//     res.render('main', { name: 'xin' });
// });

//use允許所有http的方法 包含get post...等
//404的程式碼要放在所有路由的後面
//----404----
app.use((req, res) => {
    res.send(`<h2>找不到頁面</h2> <img src="/imgs/yoyo.jpg" alt="" />`);
});

// 監聽    env方法 process.env.設定的參數
app.listen(process.env.PORT, () => {
    console.log('server started http://localhost:3600');
})