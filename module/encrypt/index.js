
const crypto = require('crypto');
const fs = require('fs')

const keypath = __dirname+'\\mainkey.txt'
const encrypt = ((val) => {
    //console.log('[encrypt]',val)
    const [k1, k2] = fs.readFileSync(keypath).toString().replace(/\r/gi,'').split('\n')
    let cipher = crypto.createCipheriv('aes-256-cbc', k1, k2);
    let encrypted = cipher.update(val, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
});

const decrypt = ((encrypted) => {
    const [k1, k2] = fs.readFileSync(keypath).toString().replace(/\r/gi,'').split('\n')
    const decipher = crypto.createDecipheriv('aes-256-cbc',  k1, k2);
    const decrypted = decipher.update(encrypted, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
});

try{
    fs.statSync(keypath)
    // console.log('aefgrstdhy',     fs.readFileSync(keypath).toString(),)
}catch(err){
    // console.log('[er encr]',err)
    fs.writeFileSync(keypath,crypto.randomBytes(16).toString('hex')+'\n'+crypto.randomBytes(8).toString('hex'))
   
}


module.exports.encrypt = encrypt
module.exports.decrypt = decrypt