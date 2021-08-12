const https = require('https')
const fs = require('fs')
const cheerio = require('cheerio')
const crypto = require('crypto');
var Iconv = require('iconv-lite');
  
var decrypt = ((encrypted) => {
    let decipher = crypto.createDecipheriv('aes-256-cbc', '577acec9d2fb7c3c70f1f056224c00ad', '55e66e23e349f0cb');
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
});

const News = {
    list:null,
    get_list:()=>{

        News.list = JSON.parse(decrypt(fs.readFileSync('./lists/news.json').toString('utf8')))
        //News.list = JSON.parse(fs.readFileSync('./list/news.json'))
        console.log('news_list',News.list.length)
    },
    get_time:(x)=>{
        //console.log('[get_time]',x)
        x=x.trim()
        var n = Number(new Date()) + 0*9*3600*1000;
        if(x.endsWith('분전')) n-= x.substr(0,x.length-2) * 1000*60;
        else if(x.endsWith('시간전')) n-= x.substr(0,x.length-3) * 1000*60*60;
        else if(x.endsWith('일전')) n-= x.substr(0,x.length-2) * 1000*60*60*24;
        else {//console.log(x,'x ') //이것은 그냥 날짜로 되어 있는 경우이다.
        var m=x.split('');
        var nn=m.splice(11,3).join('').replace('오전','am').replace('오후','pm')
        x=m.join('')+nn
        //console.log(x,'xx')
        n = new Date(x)
        
    }
        return new Date(n)
    },
    get_data:(callback)=>{
        if(!News.list) return;
        //console.log('[News get_data]',callback)
        //callback([1,2,3,4])
        for ( var i in News.list){
            url = News.list[i]
            https.get(url,(res,req)=>{
                //res.setEncoding('utf8');
                var data='';
                res.on('error', () => {callback(undefined) });
                res.on('data', (chunk) => { 
                    //console.log('ch')
                    //console.log( Iconv.decode( chunk, 'euc-kr').trim().replace(/\s+/g,' '))
                    //console.log('\n\n\ndata--------------\n\n\n',data)
                    data+= Iconv.decode(chunk, 'euc-kr');});
                res.on('end', () => { News.add_data( data, callback) });
            })
        }
    },
    add_data:(data, callback)=>{
        out=[]
        console.log('[News add_data]',data.length, callback)
        var $ = cheerio.load(data)
        var kk = $('.list_body > ul > li > dl ')
        //console.log(, kk[0].children[5])

        for (var i=0; i<kk.length; i++){
            var kkk = kk[i];
            //console.log(i)
            var d = kkk.children[1]
            //console.log(d.name)

            var clss = d.attribs.class;
            if (clss=='photo') f = 3
            else f=1;

            var d = kkk.children[f].children[1]
            var link=d.attribs.href
            var title = d.children[0].data.trim()
            var d = kkk.children[f+2]
            //d.children[1],d.children[3],d.children[5]
            var description = d.children[1].children[0].data
            var press = d.children[3].children[0].data
            //console.log('[news for ] d',title, d.children[7].children[0].data)

            var time = d.children[5].children[0].data;
            if(!time) time = d.children[7].children[0].data// 신문 면수 안내될 때 있음...
            var pubDate = News.get_time(time)
            out.push({
                link,title,description,press,pubDate,author:undefined
            })
        }
        
        console.log('[News add_data callback]',out.length, callback)
        callback(out)
    }
}

module.exports.News = News;