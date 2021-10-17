const crypto = require('crypto');
const MD5 = (txt)=> crypto.createHash('md5').update(txt).digest('hex');

class Digest{
    constructor(realm, qop){
        this.realm = realm?realm:'/'; //접근 영역
        this.qop = qop?qop:'auth'
        this.non_authed_nonce = [];
        this.authed_nonce = [];
        this.cnonce = []
        this.allow_user = ['1']
        this.__create_nonce()
        //선택된 보호 수준 (quality of protection, qop)
        //https://feel5ny.github.io/2019/11/24/HTTP_013_01/
    }

    __create_res(auth,nonce){
        const password = '12134';
        const method = 'GET'

        const HA1 = MD5(`${auth.username}:${this.realm}:${password}`)
        const HA2 = MD5(`${method}:${auth.uri}`);
        const response = MD5(`${HA1}:${nonce}:${auth.nc}:${auth.cnonce}:${auth.qop}:${HA2}`) 
        if (response != auth.response) return false;
        return true;
    }

    __allow_check(auth){
        //Digest username="1", realm="hihi", nonce="", uri="/", response="a749cf378780db83f455b7ed16404252"
        //Digest username="1", realm="/", nonce="ed90be88623e39bfbd799cc3bd1b2ad3", uri="/", response="739bde2cbde77598bec6d91b5c43a5b3", qop=auth, nc=00000001, cnonce="c0c9ac7a2aab0d9a"
        
        if(!auth || !this.allow_user.includes(auth.username)) return false;
        console.log('[인증요청확인]',auth, this.nonce)

        if(this.__create_res(auth, this.nonce)) {
            console.log('[인증성공!] 현재 논스에 부합. ')
            this.__create_nonce(); //인증했으니 논스 무효화!
            return true;
        }

        if(this.non_authed_nonce.some((nonce,i)=>{
            if(this.__create_res(auth, nonce)){
                console.log('[인증 성공!] 처음 인증 목록에 논스 있음. ')
                //인증했으니 논스 무효화!
                this.authed_nonce.push(nonce) 
                this.non_authed_nonce.splice(i,1);
                return true
            }
        })) return true

        console.log('[인증 실패]')
        return false;

    }

    _401(res, url, err){
        console.error('_404 fn err', url, err)
        
    }

    __parse(txt){
        if(typeof txt != 'string') return undefined;
        
        const sp_data = txt.split(' ');
        if(sp_data[0]!='Digest') return undefined;

        const out = {}
        try{
            sp_data.splice(1).forEach(element => {
                let v = element.split('=')
                out[v[0]] = v[1].substr(0,v[1].length-1).replace(/\"/g,'')
            });
        }catch{
            console.log('파싱 오류!')
            return undefined;
        }
        return out;
    }
    __create_nonce(){
        if(this.nonce) this.authed_nonce.push(this.nonce)  //없을 떄(ex. 처음 시작시) 방지
        this.nonce = MD5(`24h5angle${Math.random()**2} ${new Date()}`)
        console.log('[create_nonce]', this.nonce)
    }

    __create_auth_nonce(){
        if(this.non_authed_nonce.length>10) this.non_authed_nonce = this.non_authed_nonce.splice(1); //너무 크면 자른다.

        const nonce = MD5(`24h5angle${Math.random()**2} ${new Date()}`)
        console.log('[create_auth_nonce]', nonce)
        this.non_authed_nonce.push(nonce)
        return nonce;
    }
    
    server(req,res,callback){
        const auth = this.__parse(req.headers.authorization)
        const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress

        //인증X경우
        if(!this.__allow_check(auth)){
            //과거에 인증한 이력이 있는 논스
            if(auth && this.authed_nonce.includes(auth.nonce)){
                console.log('인증했음')
                res.writeHead(401, {'WWW-Authenticate':`Digest stale=true, realm="${this.realm}", nonce="${this.nonce}", qop="${this.qop}"`});
            }
            else {
                console.log('인증X했음')
                res.writeHead(401, {'WWW-Authenticate':`Digest realm="${this.realm}", nonce="${this.__create_auth_nonce()}", qop="${this.qop}"`});
            }
            res.end('401 인증요함');
            return false;
        }
        //else res.setHeader('Authentication-Info', `nextnonce="${this.nonce}"`); //없는 듯?
        console.log(`nextnonce="${this.nonce}"`)
        callback(req,res)
    }
}

module.exports.Digest = Digest;