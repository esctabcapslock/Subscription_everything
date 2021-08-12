# 뭐든지 구독하기

## 목적

- 기존 RSS리더[RSS리더](https://github.com/esctabcapslock/RSS_reader)는 단지 RSS만을 가져왔고, 본인은 다른 매체의 정보도 가져오고 싶었음
- 공부를 위해서, 처음부터 갈아엎고 다시 작성함
- 현재, 네이버 뉴스와 RSS 지원.

## 사용한 기술들

- 프로미스 사용법 익힘. (여러 https 요청 보낸거 모으기.)
- cheerio로 HTML 파싱하는 것.
- crypto 자체모듈로 aes 암호화를 이용해서, json파일 암호화했음.
- euc-kr을 utf-8로 바꿔야 하기도 했음. [유튜브 다운로드 서버](https://github.com/esctabcapslock/Youtube-dl_server)에서 사용했던 코드 복붙!
