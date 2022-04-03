const get={
    dom:{
    },
    set:()=>{
        get.dom.새로고침 = document.getElementById('새로고침')
        get.dom.새로고침.addEventListener('click',get.get_data)
        get.dom.main = document.getElementById('main')
        get.dom.file_list = document.getElementById('file_list')
        get.get_file_list()
        
        
    },
    get_file_list:(callback)=>{
        fetch('./list').then(d=>d.text()).then(data=>{
            const d = JSON.parse(data)
            get.dom.file_list.innerHTML = d.map(v=>`<li><a href='./edit/${v}'>${v}</a></li>`).join('\n')
            console.log(d)
        })
    },
    get_data:(callback)=>{
        fetch('./info').then(d=>d.text()).then(data=>{
            get.list = JSON.parse(data)
            var out = get.list.map(v=>get.show(v));
            get.dom.main.innerHTML = out.join('\n')
        })
    },
    show:(data)=>{
        text = (html)=>{
            return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'').replace(/(<([^>]+)>)/ig,"").trim();
            //https://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression
            //https://6developer.com/926
        }

        return `<article class='art'>
            <div class="ar_name" > <a href="${data.link}" target="_blank"><span> ${data.title}</span> </a> </div>
            <div class="ar_in">
                <span class="press">${data.press}</span>
                <span calss="pubDate"><time> ${(new Date(data.pubDate)).toLocaleString()}</time> </span>
                <div class='desc'>${text(data.description)}</div>
            </div>
        
        </article>`
        

        return `<article>
            <div class="ar_name" > <a href="${data.link}"><span> ${data.title}</span> </a> </div>
            <span calss="pubDate"><time> ${(new Date(data.pubDate)).toLocaleString()}</time> </span>
            <span class="press">${data.press}</span>
            <div class="ar_in"><pre>${data.description.substr(0,200).replace(/>/g,'&gt;').replace(/</g,'&lt;')}</pre></div>
        
        </article>`
    }
}