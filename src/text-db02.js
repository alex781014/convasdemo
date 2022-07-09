const db = require(__dirname + '/../modules/mysql.connect');
// 20220628 11:15 sql範例
(async () => {
    // 拿到只有一個東西而且是array
    const [results, fields] = await db.query("show tables;");
    // show database
    // use fteam;
    // show tables;
    console.log(results);
    console.log(fields);
    process.exit();//結束行程
})();

