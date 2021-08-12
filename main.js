const http = require('http')
const fs = require('fs')
const port = 88;
const asset_list = fs.readdirSync('./asset')
const lists_list = fs.readdirSync('./lists')
const crypto = require('crypto');
const News = require('./module/news').News
const RSS = require('./module/rss').RSS
const SHA512 = require("./asset/SHA512").SHA512

var encrypt = ((val) => {
    let cipher = crypto.createCipheriv('aes-256-cbc', '577acec9d2fb7c3c70f1f056224c00ad', '55e66e23e349f0cb');
    let encrypted = cipher.update(val, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  });
  
var decrypt = ((encrypted) => {
    let decipher = crypto.createDecipheriv('aes-256-cbc', '577acec9d2fb7c3c70f1f056224c00ad', '55e66e23e349f0cb');
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
});

//ENC_KEY and IV can be generated as crypto.randomBytes(32).toString('hex');
// 16, 8
//https://gist.github.com/siwalikm/8311cf0a287b98ef67c73c1b03b47154

//출처: https://whitenode.tistory.com/entry/euckr를-utf8로-바꾸자nodejs-iconv [백야의 NodeJs + HTML5 연구소]

News.get_list();
//News.get_data(console.log)

RSS.get_list()

var allowed_cookies=[]

const server = http.createServer((req, res)=>{
    const url = req.url;
    const url_arr = req.url.split('/')
    const referer = req.headers.referer
    const method = req.method
    const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress
    const res_cookies = req.headers.cookie
    const Auth_cookies = parse_cookie(res_cookies)['Auth']
    const allowed = allowed_cookies.includes(Auth_cookies)
    
    console.log('[ip]',ip,'[url]',url,'[referer]',referer, allowed)

    function parse_cookie(str){
        //console.log(str, typeof(str))
        var out={}
        if(typeof(str)=='string') str.split(';').forEach(i=>{
            var d=i.trim().split('=');
            out[d[0]]=d[1]
        })
        return out
    }

    function _404(res, url, err){
        console.error('_404 fn err', url, err)
        res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
        res.end('404 Page Not Found');
    }

    function fs_readfile(res, url, encode, file_type, callback){
       // console.log('fs_readfile', url)
        var name = url.toString().split('/').reverse()[0]
        var url_arr = url.split('/');
        if ( name.endsWith('.html')) file_type='text/html; charset=utf-8';
        if ( name.endsWith('.css')) file_type='text/css; charset=utf-8';
        if ( name.endsWith('.js')) file_type='text/javascript; charset=utf-8';
        
        fs.readFile(url, encode, (err,data)=>{
            if(err){ 
                console.error('[error] fs_readfile', err, url, encode, file_type)
                res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
                res.end('Page Not Found');
            }else{
                if (encode=='utf8') res.writeHead(200, {'Content-Type':file_type});
                else res.writeHead(200, {'Content-Type':file_type, 'Content-Length': data.length});
                res.end(data)
            }
        })
    callback();
    }

    if (!allowed && url=='/login/value' && method=='POST'){
        var body='';
        req.on('data', (chunk)=>body += chunk);
        req.on('end', ()=>{
            //console.log('pw',body, req.method);
            if(1 || body=='pw=12114'){
                var random = SHA512('0'+Math.random())
                while(allowed_cookies.includes(random)) random = SHA512('0'+Math.random()) // 중복 방지.
                allowed_cookies.push(random)
                console.log('set_cookies',allowed_cookies)
                res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Content-Location': '/', 
                                'Set-Cookie':[
                                    `Auth=${random}; Max-Age=300; path=/; HttpOnly`
                                ]});
                res.end('<meta http-equiv="refresh" content="0; url=/" />');
                setTimeout(() => {
                    var ind =  allowed_cookies.indexOf(random)
                    console.log('쿠키삭제',ind);
                    allowed_cookies.splice(ind,1)
                }, 300*1000);
            }else{
                res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'})
                res.end('<meta http-equiv="refresh" content="0; url=../" />');
            }
        })
    }
    else if(!allowed) fs_readfile(res, 'asset/login.html', 'utf-8', 'text/html; charset=utf-8', ()=>{})  
    else if (url=='/') fs_readfile(res,'asset/index.html', 'utf8', 'text/html; charset=utf-8', ()=>{})
    else if(asset_list.includes(url_arr[1])) fs_readfile(res,'asset/'+url_arr[1], 'utf8', '', ()=>{})
    else if (url=='/info'){
        var p1 = new Promise((resolve, reject)=>{News.get_data(resolve)})
        var p2 = new Promise((resolve, reject)=>{RSS.get_data(resolve)})
        console.log('[server /info  Promise.s]',p1, p2)


        //Promise.all([p1]).then(data=>{console.log('[p1]', data.length)})
        //Promise.all([p2]).then(data=>{console.log('[p2]', data.length)})
        Promise.all([p1,p2]).then(data=>{
            data = [...data[0], ...data[1]]
            console.log('[server /info]', typeof data, data.sort, data[2].pubDate)
            res.writeHead('200', {'Content-Type': 'application/json; charset=utf8'});
            res.end(JSON.stringify(data.sort((a,b)=>(a.pubDate<b.pubDate)?1:-1)))
        })
        //res.end()
    }
    else if (url_arr[1]=='edit' && lists_list.includes(url_arr[2])) fs_readfile(res,'asset/edit.html', 'utf8', 'text/html; charset=utf-8', ()=>{});

    else if (url=='/select/json' && referer){
        var tmp = referer.split('/')
        var file_name = tmp[tmp.length-1]
        //console.log(lists_list, file_name)
        if (!lists_list.includes(file_name))   _404(res,url, 'file Not Found, else;');
        else{
            console.log('[select/json] file_name',file_name)
            var data = fs.readFileSync('./lists/'+file_name).toString('utf8')
            console.log(typeof data, data.length)
            let result = decrypt(data)
            res.writeHead('200', {'Content-Type': 'text; charset=utf8'});
            res.end(result)
        }
    }
    else if (url=='/update/json' && referer && method=='POST'){
        var tmp = referer.split('/')
        var file_name = tmp[tmp.length-1]
        //console.log(lists_list, file_name)
        if (!lists_list.includes(file_name))   _404(res,url, 'file Not Found, else;');
        else{
            var data='';
            req.on('error', () => {_404(res,url, 'post err, else;'); });
            req.on('data', (chunk) => {data+=chunk});
            req.on('end', () => { 
                //var data = Buffer.concat(data)
                try{
                    JSON.parse(data);
                
                var result = encrypt(data)
                console.log('[update/json], data',typeof data, data.length ,result.length)
                fs.writeFile('./lists/'+file_name, result, (err) => {
                    if (err) _404(res, url,'저장실패')
                    else {
                        res.writeHead('200', {'Content-Type': 'text; charset=utf8'});
                        res.end(data)
                    }
                   });
                
                }catch{
                    _404(res,url,'json 형식 아님!!')
                }
            });
        }
    }
    else  _404(res,url, 'Page Not Found, else;');

})
server.listen(port,console.log(`${port}번 포트에서 실행`))