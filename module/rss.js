const https = require('https')
const fs = require('fs')
const xml2js = require('xml2js');
const crypto = require('crypto');

var decrypt = ((encrypted) => {
    let decipher = crypto.createDecipheriv('aes-256-cbc', '577acec9d2fb7c3c70f1f056224c00ad', '55e66e23e349f0cb');
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
});

const RSS = {
    list:null,
    get_list:()=>{
        RSS.list = JSON.parse(decrypt(fs.readFileSync('./lists/rss.json').toString('utf8')))
        //RSS.list = JSON.parse(fs.readFileSync('./list/rss.json'))
        console.log('RSS_list',RSS.list.length)
    },
    get_data:(callback)=>{
        promise_list = []
        for (var i in RSS.list){
            //console.log(i)
            var url = RSS.list[i];

            var my_Promise = new Promise(function(resolve, reject) {
                    https.get(url,(res,req)=>{
                        //res.setEncoding('utf8');
                        var data='';
                        res.on('error', () => {reject(Error("It broke"));});
                        res.on('data', (chunk) => { 
                            //console.log('ch')
                            //console.log( Iconv.decode( chunk, 'euc-kr').trim().replace(/\s+/g,' '))
                            //console.log('\n\n\ndata--------------\n\n\n',data)
                            data+= chunk});//Iconv.decode(chunk, 'euc-kr');});
                        res.on('end', () => { RSS.add_data( data, resolve) });
                    })
                })

                promise_list.push(my_Promise)
        }
        Promise.all(promise_list).then((data)=>{
            console.log('[RSS Promise.all]',data.length, callback)
            out=[]
            for (var i in data)out=out.concat(data[i])
            //console.log(out, data[1])
            callback(out)
        })
    },
    add_data:(data, resolve)=>{
        console.log('[RSS add_data]',data.length)
        xml2js.parseString(data,(err,result)=>{
            //console.log(result.rss.channel[0].title[0])

            var title = result.rss.channel[0].title[0];
            var items = result.rss.channel[0].item;
            var out = items.map((d)=>{
                //var d = result.rss.channel[0].item[0]
                var t = {
                press:title,
                author:d.author?d.author[0]:title,
                title:d.title[0],
                link:d.link[0],
                description:d.description[0],
                pubDate:new Date(d.pubDate[0])
                }
                return t;
            })
            
            //console.log(out)
            resolve(out)
        })
        //resolve(data)
    }
}

module.exports.RSS=RSS